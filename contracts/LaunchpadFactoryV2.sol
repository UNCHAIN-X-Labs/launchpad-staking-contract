// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import './interfaces/ILaunchpadStakingV2.sol';
import './interfaces/ICommonCustomError.sol';
import './LaunchpadStakingV2.sol';

/**
 * @title Launchpad factory contract.
 * @notice
 * @dev
 */
contract LaunchpadFactoryV2 is ICommonCustomError, ReentrancyGuard, Ownable, Pausable {
    address public immutable rewardToken;
    address public immutable collector;
    uint8 public currentRound;
    uint8 public totalRound;

    /// @notice LaunchpadStaking contract address(round => stakingContract)
    mapping(uint8 => address) public stakingContract;

    struct RoundInfo {
        uint8 round;
        address launchpadStaking;
        uint256 startBlock;
        uint256 endBlock;
        uint256[] accTotalSupplys;
        ILaunchpadStakingV2.PoolInfoResponse[] pools;
    }

    struct DepositInfo {
        uint8 round;
        ILaunchpadStakingV2.DepositInfoResponse[][] pools;
    }

    /**
     * @dev This event should be emit when create round.
     * @param stakingContract The launchpad staking contract address.
     * @param round The round number.
     */
    event CreateRound(address stakingContract, uint8 round);

    /**
     * @dev This event should be emit when Pass to next round.
     * @param round The new round number.
     */
    event PassToRound(uint8 round);

    error AlreadyExistRound();
    error NotOverYetRound();

    constructor(address owner, address rewardToken_, address collector_, uint8 totalRound_) Ownable(owner) {
        rewardToken = rewardToken_;
        collector = collector_;
        currentRound++;
        totalRound = totalRound_;
    }

    function createRound(uint8 roundNum, ILaunchpadStakingV2.InitializeParams calldata params) external onlyOwner {
        if(stakingContract[roundNum] != address(0)) {
            revert AlreadyExistRound();
        }

        address newRound = address(new LaunchpadStakingV2{salt: keccak256(abi.encode(roundNum, address(this)))}(collector, roundNum));
        stakingContract[roundNum] = newRound;
        LaunchpadStakingV2(newRound).initialize(params);
        LaunchpadStakingV2(newRound).transferOwnership(msg.sender);

        emit CreateRound(newRound, roundNum);
    }

    function setRound(uint8 roundNum, address launchpadStaking) external onlyOwner {
        if(stakingContract[roundNum] != address(0)) {
            revert AlreadyExistRound();
        }
        stakingContract[roundNum] = launchpadStaking;
    }

    function passToNextRound() external onlyOwner {
        if(block.number < ILaunchpadStakingV2(stakingContract[currentRound]).stakingEndBlock()) {
            revert NotOverYetRound();
        }

        if(currentRound == totalRound) {
            revert OverTheLimit(totalRound, currentRound + 1);
        }

        currentRound++;

        emit PassToRound(currentRound);
    }

    /**
     * @dev Pause mining protocol
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause mining protocol
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    function userRewardsOf(address account, uint8 round) public view returns (uint256 rewards) {
        if(round > 0 && round <= currentRound) {
            rewards = ILaunchpadStakingV2(stakingContract[round]).totalUserRewards(account);
        }
    }

    function rewardList(address account) public view returns (uint256 total, uint256[] memory list) {
        list = new uint256[](totalRound);

        for(uint8 i = 0; i < totalRound; i++) {
            list[i] = userRewardsOf(account, i + 1);
            total += list[i];
        }
    }

    function totalUserRewards(address account) public view returns (uint256 rewards) {
        (rewards, )= rewardList(account);
    }

    function getCurrentRoundInfo(address[] calldata tokens) public view returns (RoundInfo memory result) {
        result = getRoundInfo(currentRound, tokens);
    }

    function getRoundInfo(uint8 round, address[] calldata tokens) public view returns (RoundInfo memory result) {
        address lauchpadStaking = stakingContract[round];
        result.round = round;
        result.launchpadStaking = lauchpadStaking;
        result.startBlock = ILaunchpadStakingV2(result.launchpadStaking).stakingStartBlock();
        result.endBlock = ILaunchpadStakingV2(result.launchpadStaking).stakingEndBlock();
        result.pools = poolInfoList(result.launchpadStaking, tokens);
        result.accTotalSupplys = new uint256[](8);

        for(uint8 i = 1; i <= round; i++)  {
            ILaunchpadStakingV2.PoolInfoResponse[] memory pools = poolInfoList(stakingContract[i], tokens);
            for(uint256 j = 0; j < 8; j++) {
                result.accTotalSupplys[j] += pools[j].totalSupply;
            }
        }
    }

    function poolInfoList(address lauchpadStaking, address[] calldata tokens) public view returns (ILaunchpadStakingV2.PoolInfoResponse[] memory pools) {
        pools = ILaunchpadStakingV2(lauchpadStaking).poolInfoListByTokens(tokens);
    }

    function getDepositInfoByToken(address user, address token) public view returns (ILaunchpadStakingV2.DepositInfoResponse[][] memory result) {
        result = new ILaunchpadStakingV2.DepositInfoResponse[][](8);
        for(uint8 i = 0; i < currentRound; i++) {
            result[i] = ILaunchpadStakingV2(stakingContract[i + 1]).depositInfoListByToken(user, token);
        }
    }

    function getDepositInfoByToken(address user) public view returns (DepositInfo[] memory result) {
        result = new DepositInfo[](currentRound);
        for (uint8 i = 0; i < currentRound; i++) {
            result[i].round = i + 1;
            result[i].pools = ILaunchpadStakingV2(stakingContract[i + 1]).depositInfoList(user);
        }
    }
}