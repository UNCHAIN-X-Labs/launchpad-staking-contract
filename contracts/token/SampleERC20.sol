// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract SampleERC20 is ERC20Burnable {
    uint8 private immutable _decimals;

    constructor(string memory name_, string memory symbol_, uint256 totalSupply_, uint8 decimals_, address receiver) ERC20(name_, symbol_) {
        _mint(receiver, totalSupply_);
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}