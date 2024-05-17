// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/access/Ownable.sol';
import "./token/UNXToken.sol";
import "./LaunchpadFactory.sol";

/**
 * @title Genesis-X
 * @dev {GenesisX} is a generator that create the contracts {XToken}, {XLaunchpad} and a reserve pool X-Token for XFi ecosystem.
 */
contract GenesisX is Ownable {
    address public immutable unxToken;
    address public immutable launchpadFactory;

    /**
     * @dev Create contracts {XToken} and {XLaunchpad}.
     */
    constructor(address ecosystemReserveAccount, address collector, uint256 totalSupply, uint256 launchpadSupply, uint256 ecosystemSupply, uint8 totalRound) Ownable(msg.sender) {
        // Create X-Token contract
        bytes memory bytecodeForToken = abi.encodePacked(type(UNXToken).creationCode, abi.encode("TEST", "TTT", totalSupply));
        unxToken = _createContract(bytecodeForToken);
        
        // Create Launchpad factory contract
        // address rewardToken_, address collector_, uint8 totalRound_
        bytes memory bytecodeForLaunchpad = abi.encodePacked(type(LaunchpadFactory).creationCode, abi.encode(msg.sender, unxToken, collector, totalRound));
        launchpadFactory = _createContract(bytecodeForLaunchpad);

        UNXToken(unxToken).transfer(launchpadFactory, launchpadSupply);
        UNXToken(unxToken).transfer(ecosystemReserveAccount, ecosystemSupply);
        UNXToken(unxToken).transfer(address(this), totalSupply - launchpadSupply - ecosystemSupply);
    }

    function transferToken(address to) external onlyOwner {
        UNXToken(unxToken).transfer(to, UNXToken(unxToken).balanceOf(address(this)));
    }

    /**
     * @dev Creat contract.
     * @param bytecode Bytecode for create contract.
     * @return ca address of created contract
     */
    function _createContract(bytes memory bytecode) internal returns (address ca) {
        bytes32 salt = keccak256(abi.encodePacked(address(this), msg.sender));

        assembly {
            ca := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
    }
}