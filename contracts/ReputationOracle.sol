// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ReputationOracle is Ownable {
    mapping(address => uint8) public score; // 0–100

    constructor() Ownable(msg.sender) {}

    function setScore(address user, uint8 s) external onlyOwner {
        require(s <= 100, "score too high");
        score[user] = s;
    }

    function getScore(address user) external view returns (uint8) {
        return score[user];
    }
}
