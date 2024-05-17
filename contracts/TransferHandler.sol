// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract TransferHandler {
    /**
     * @dev The ERC20 token transfer is failed.
     * @param to The address of receiver.
     * @param from The address of sender.
     * @param token The token contract address for transfer.
     * @param amount The amount for transfer.
     */
    error ERC20TransferFailure(address to, address from, address token, uint256 amount);

    /**
     * @dev The Native token transfer is failed.
     * @param to The address of receiver.
     * @param from The address of sender.
     * @param amount The amount for transfer.
     */
    error ETHTransferFailure(address to, address from, uint256 amount);

    /**
     * Call transfer() function to ERC20 Contract.
     * @param to Receiver address.
     * @param token Token address for transfer.
     * @param amount Amount for transfer.
     */
    function _transferERC20(address to, address token, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(IERC20.transfer.selector, to, amount));
        if(!success || (data.length != 0 && !abi.decode(data, (bool)))) {
            revert ERC20TransferFailure(to, address(this), token, amount);
        }
    }

    /**
     * Call transferFrom() function to ERC20 Contract.
     * @param from Sender address.
     * @param to Receiver address.
     * @param token Token address for transfer.
     * @param amount Amount for transfer.
     */
    function _transferFromERC20(address from, address to, address token, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, amount));
        if(!success || (data.length != 0 && !abi.decode(data, (bool)))) {
            revert ERC20TransferFailure(to, from, token, amount);
        }
    }

    /**
     * Call send ETH.
     * @param to Receiver address.
     * @param amount Amount for tranfser.
     */
    function _transferETH(address to, uint256 amount) internal {
        (bool success, ) = to.call{value: amount}(new bytes(0));
        if(!success) {
            revert ETHTransferFailure(to, address(this), amount);
        }
    }
}