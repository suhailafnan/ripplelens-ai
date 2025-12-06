// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ReputationOracle.sol";

/**
 * FxrpLendingPool (MVP)
 *
 * - Users deposit FXRP (here MockFXRP) as collateral.
 * - Users can borrow FXRP against their collateral.
 * - Reputation score (0–100) from ReputationOracle adjusts max LTV.
 * - Simple interest model:
 *     - Borrow APR: 6%  (0.06e18)
 *     - Lend APR:   3.5% (0.035e18)
 *   Interest accrues globally over time for total debt/collateral.
 *   Protocol profit = borrower interest - lender interest (~2.5% spread).
 *
 * - For MVP, price is treated as 1 FXRP = 1 USD (no external oracle).
 *   You can later plug in FTSO or Pyth in _getFxrpUsd().
 */
contract FxrpLendingPool {
    IERC20 public fxrp;
    ReputationOracle public rep;

    // Collateral and debt in FXRP units
    mapping(address => uint256) public collateral;
    mapping(address => uint256) public debt;

    // Interest accounting (global)
    uint256 public totalCollateral;              // total FXRP deposited
    uint256 public totalDebt;                    // total FXRP borrowed

    uint256 public totalLenderInterestAccrued;   // FXRP owed to all lenders
    uint256 public totalBorrowerInterestAccrued; // FXRP paid by all borrowers
    uint256 public totalProtocolProfit;          // FXRP = borrowerInterest - lenderInterest

    uint256 public lastAccrual; // timestamp of last interest accrual

    // APRs expressed in 1e18 precision
    uint256 public constant BORROW_APR = 6e16;   // 0.06 (6%)
    uint256 public constant LEND_APR   = 35e15;  // 0.035 (3.5%)

    constructor(address _fxrp, address _rep) {
        fxrp = IERC20(_fxrp);
        rep = ReputationOracle(_rep);
        lastAccrual = block.timestamp;
    }

    // --------------------
    // Internal helpers
    // --------------------

    // For MVP: 1 FXRP = 1 USD, decimals = 18
    function _getFxrpUsd()
        internal
        pure
        returns (uint256 price, uint8 decimals)
    {
        // price = 1 * 10^18 (1e18) => 1 FXRP = 1 USD
        return (1e18, 18);
    }

    function _collateralUsd(address user) internal view returns (uint256) {
        (uint256 price, uint8 decimals) = _getFxrpUsd();
        return (collateral[user] * price) / (10 ** decimals);
    }

    function _debtUsd(address user) internal view returns (uint256) {
        (uint256 price, uint8 decimals) = _getFxrpUsd();
        return (debt[user] * price) / (10 ** decimals);
    }

    // Reputation-based max LTV: base 50%, bonus up to +50%, capped at 80%
    function _maxLtv(address user) internal view returns (uint256) {
        uint8 s = rep.score(user); // 0–100
        uint256 base = 50e16; // 0.5
        uint256 extra = (uint256(s) * 5e16) / 100; // up to 0.5
        uint256 max = base + extra;
        if (max > 80e16) {
            max = 80e16; // cap at 80%
        }
        return max; // 1e18 = 100%
    }

    // Accrue interest globally based on time passed
    function _accrueInterest() internal {
        if (block.timestamp <= lastAccrual) return;

        uint256 dt = block.timestamp - lastAccrual;
        lastAccrual = block.timestamp;

        // APR is per year; assume year = 365 days
        uint256 YEAR = 365 days;

        // Borrower interest on totalDebt
        if (totalDebt > 0) {
            uint256 borrowInterest = (totalDebt * BORROW_APR * dt) / (YEAR * 1e18);
            totalBorrowerInterestAccrued += borrowInterest;
            totalDebt += borrowInterest; // borrowers owe more
        }

        // Lender interest on totalCollateral
        if (totalCollateral > 0) {
            uint256 lendInterest = (totalCollateral * LEND_APR * dt) / (YEAR * 1e18);
            totalLenderInterestAccrued += lendInterest;
            totalCollateral += lendInterest; // lenders' pool grows notionally
        }

        // Protocol profit is the spread
        if (totalBorrowerInterestAccrued > totalLenderInterestAccrued) {
            totalProtocolProfit =
                totalBorrowerInterestAccrued -
                totalLenderInterestAccrued;
        }
    }

    // --------------------
    // Views
    // --------------------

    function getUserState(address user)
        external
        view
        returns (
            uint256 coll,
            uint256 d,
            uint8 score,
            uint256 price,
            uint256 health
        )
    {
        coll = collateral[user];
        d = debt[user];
        score = rep.score(user);

        (uint256 p, uint8 decimals) = _getFxrpUsd();
        price = p;

        uint256 collUsd = (coll * p) / (10 ** decimals);
        uint256 debtUsd = (d * p) / (10 ** decimals);

        if (debtUsd == 0) {
            health = type(uint256).max;
        } else {
            // health = collUsd / debtUsd (scaled 1e18)
            health = (collUsd * 1e18) / debtUsd;
        }
    }

    // --------------------
    // Core user functions
    // --------------------

    function depositCollateral(uint256 amount) external {
        require(amount > 0, "amount=0");
        _accrueInterest();

        fxrp.transferFrom(msg.sender, address(this), amount);
        collateral[msg.sender] += amount;
        totalCollateral += amount;
    }

    function borrow(uint256 amount) external {
        require(amount > 0, "amount=0");
        _accrueInterest();

        (uint256 price, uint8 decimals) = _getFxrpUsd();
        uint256 collUsd = (collateral[msg.sender] * price) /
            (10 ** decimals);
        uint256 debtUsdAfter = (debt[msg.sender] + amount) *
            price /
            (10 ** decimals);

        uint256 maxLtv = _maxLtv(msg.sender); // 1e18 = 100%
        uint256 maxBorrowUsd = (collUsd * maxLtv) / 1e18;

        require(debtUsdAfter <= maxBorrowUsd, "exceeds borrow limit");

        debt[msg.sender] += amount;
        totalDebt += amount;

        fxrp.transfer(msg.sender, amount);
    }

    function repay(uint256 amount) external {
        require(amount > 0, "amount=0");
        _accrueInterest();

        fxrp.transferFrom(msg.sender, address(this), amount);

        uint256 d = debt[msg.sender];
        if (amount >= d) {
            totalDebt -= d;
            debt[msg.sender] = 0;
        } else {
            debt[msg.sender] = d - amount;
            totalDebt -= amount;
        }
    }
}
