// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import './TransferHandler.sol';
import './interfaces/ILaunchpadStakingV2.sol';
import './interfaces/ICommonCustomError.sol';
import './LaunchpadStakingV2.sol';

/**
 * @title Launchpad factory contract.
 * @notice 
 * @dev 
 */
contract LaunchpadFactory is ICommonCustomError, TransferHandler, Ownable, ReentrancyGuard, Pausable {
    address public immutable rewardToken;
    address public immutable collector;
    uint8 public claimLimit;
    uint8 public currentRound;
    uint8 public totalRound;

    /// @notice LaunchpadStaking contract address(round => stakingContract)
    mapping(uint8 => address) public stakingContract;
    /// @notice Timestamp per count(count => timestamp).
    mapping(uint8 => uint256) public claimableTimestamp;
    /// @notice User's claim count(account => count).
    mapping(address => uint8) public count;

    struct RoundInfo {
        uint8 round;
        address launchpadStaking;
        uint256 startBlock;
        uint256 endBlock;
    }

    /**
     * @dev The parameter required when set claim schedule.
     */
    struct ClaimConfig {
        uint8 countLimit;
        uint256 startTimestamp;
        uint256 cycle;
    }    

    /**
     * @dev This event should be emit when user claim rewards.
     * @param user The user's account address.
     * @param count The claim count.
     * @param reward The amount of reward.
     */
    event Claim(address indexed user, uint256 count, uint256 reward);


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

    /**
     * @dev The user's reward does not exist.
     * @param user The user's account address.
     */
    error NotExistRewardOf(address user);

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

    function passToNextRound() external onlyOwner {
        if(block.number < LaunchpadStakingV2(stakingContract[currentRound]).stakingEndBlock()) {
            revert NotOverYetRound();
        }

        if(currentRound == totalRound) {
            revert OverTheLimit(totalRound, currentRound + 1);
        }

        currentRound++;

        emit PassToRound(currentRound);
    }

    function setClaimSchedule(ClaimConfig calldata params) public onlyOwner {
        if(claimableTimestamp[1] > 0) {
            _verifyDeadline(block.timestamp, claimableTimestamp[1] - 1);
        }

        if(params.countLimit == 0) {
            revert OutOfRange(1, type(uint8).max, params.countLimit);
        }

        claimLimit = params.countLimit;

        for (uint8 i = 0; i < claimLimit; i++) {
            claimableTimestamp[i + 1] = i == 0 ? params.startTimestamp : params.startTimestamp + params.cycle * i;
        }
    }

    /**
     * @dev Claim rewards.
     * Should be execute after {withdrawRefund}.
     * @return rewards claimable rewards.
     */
    function claim() external nonReentrant whenNotPaused returns (uint256 rewards) {
        address account = msg.sender;
        uint8 formerCount = count[account];
        uint256 nearestClaimableTimestamp = claimableTimestamp[formerCount + 1];

        if(formerCount >= claimLimit) {
            revert OverTheLimit(claimLimit, formerCount + 1);
        }

        if(nearestClaimableTimestamp > block.timestamp) {
            revert NotYetStarted(nearestClaimableTimestamp);
        }
        uint256 totalRewards = totalUserRewards(account);

        if(totalRewards == 0) {
            revert NotExistRewardOf(account);
        }

        uint256 rewardPerOnce = totalRewards / claimLimit;

        for (uint8 i = 1; i <= claimLimit; i++) {
            if(i > formerCount && claimableTimestamp[i] <= block.timestamp) {
                rewards += rewardPerOnce;
                count[account]++;
                emit Claim(account, count[account], rewards);
            }
        }
        
        _transferERC20(account, rewardToken, rewards);
    }

    /**
     * @dev Withdraw remains token by owner.
     * @param to The address of receiver.
     */
    function withdrawRemains(address to, uint256 amount) external onlyOwner nonReentrant {
        _transferERC20(to, rewardToken, amount);
    }

    /**
     * @dev Emergency withdraw reward token by owner.
     * Should be execute when paused.
     * @param to The address of receiver.
     */
    function emergenctWithdrawReward(address to) external onlyOwner nonReentrant whenPaused {
        _transferERC20(to, rewardToken, IERC20(rewardToken).balanceOf(address(this)));
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
            rewards = LaunchpadStakingV2(stakingContract[round]).totalUserRewards(account);
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

    function getCurrentRoundInfo() public view returns (RoundInfo memory result) {
        result = getRoundInfo(currentRound);
    }

    function getRoundInfo(uint8 round) public view returns (RoundInfo memory result) {
        result.round = round;
        result.launchpadStaking = stakingContract[round];
        result.startBlock = LaunchpadStakingV2(result.launchpadStaking).stakingStartBlock();
        result.endBlock = LaunchpadStakingV2(result.launchpadStaking).stakingEndBlock();
    }

    /**
     * @dev Verify whether the target has exceeded the deadline.
     * @param target The target to verify.
     * @param deadline The deadline.
     */
    function _verifyDeadline(uint256 target, uint256 deadline) internal pure {
        if(target > deadline) {
            revert OverTheDeadline(deadline);
        }
    }
}