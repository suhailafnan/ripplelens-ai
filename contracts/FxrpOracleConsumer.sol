// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// MVP oracle consumer: mocked FXRP/USD price, ready to be swapped to FTSO/Pyth later.
contract FxrpOracleConsumer {
    // Base price = 1.00 USD with 18 decimals
    function getFxrpPrice()
        external
        view
        returns (uint256 price, uint8 decimals, uint256 timestamp)
    {
        // very simple pseudo-variation based on block timestamp
        // price = 1.00 ± 0.02
        uint256 base = 1e18; // 1.0
        uint256 wiggle = (block.timestamp % 40000000000000000); // up to 0.04e18
        if (block.timestamp % 2 == 0) {
            price = base + wiggle;
        } else {
            price = base - wiggle;
        }
        decimals = 18;
        timestamp = block.timestamp;
    }
}
