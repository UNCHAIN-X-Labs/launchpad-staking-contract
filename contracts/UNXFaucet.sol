// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import './interfaces/ICommonCustomError.sol';
import './TransferHandler.sol';
import './LaunchpadFactoryV2.sol';

contract UNXFaucet is ICommonCustomError, TransferHandler, ReentrancyGuard, Pausable, Ownable {
    address public immutable rewardToken;
    address public immutable factory;
    uint8 public claimLimit;

    /// @notice Timestamp per count(count => timestamp).
    mapping(uint8 => uint256) public claimableTimestamp;
    /// @notice User's claim count(account => count).
    mapping(address => uint8) public count;

    /**
     * @dev The parameters required when set claim schedule.
     */
    struct ClaimConfig {
        uint8 countLimit;
        uint256 startTimestamp;
        uint256 cycle;
    }

    /**
     * @dev The launchpad reward information.
     */
    struct RewardInfo {
        uint256 totalAmount;
        uint256 remains;
        uint256 rewardPerOnce;
        uint256 claimableAmount;
        uint256 claimedAmount;
    }

    /**
     * @dev The parameters required when airdrop.
     */
    struct AirdropParams {
        address token;
        address account;
        uint256 amount;
    }

    /**
     * @dev This event should be emit when user claim rewards.
     * @param user The user's account address.
     * @param count The claim count.
     * @param reward The amount of reward.
     */
    event Claim(address indexed user, uint256 count, uint256 reward);

    /**
     * @dev This event should be emit when user claim rewards.
     * @param token The token contract address to airdrop.
     * @param account The account address to airdrop.
     * @param amount The amount to airdrop.
     */
    event Airdrop(address indexed token, address indexed account, uint256 amount);

    /**
     * @dev The user's reward does not exist.
     * @param user The user's account address.
     */
    error NotExistRewardOf(address user);

    constructor(address rewardToken_, address factory_) Ownable(msg.sender) {
        rewardToken = rewardToken_;
        factory = factory_;
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
     * @dev Airdrop token.
     * @param params {AirdropParams}
     */
    function airdrop(AirdropParams[] calldata params) external onlyOwner {
        for (uint256 i = 0; i < params.length; ++i) {
            _transferFromERC20(msg.sender, params[i].account, params[i].token, params[i].amount);
            emit Airdrop(params[i].token, params[i].account, params[i].amount);
        }
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

    /**
     * @dev Set claim schedule.
     * @param params {ClaimConfig}
     */
    function setClaimSchedule(ClaimConfig calldata params) public onlyOwner {
        if(claimableTimestamp[1] > 0) {
            _verifyDeadline(block.timestamp, claimableTimestamp[1] - 1);
        }

        if(params.countLimit == 0) {
            revert OutOfRange(1, type(uint8).max, params.countLimit);
        }

        claimLimit = params.countLimit;

        for (uint8 i = 0; i < claimLimit; ++i) {
            claimableTimestamp[i + 1] = i == 0 ? params.startTimestamp : params.startTimestamp + params.cycle * i;
        }
    }

    /**
     * @dev Claim rewards.
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
        uint256 totalRewards = LaunchpadFactoryV2(factory).totalUserRewards(account);

        if(totalRewards == 0) {
            revert NotExistRewardOf(account);
        }

        uint256 rewardPerOnce = totalRewards / claimLimit;

        for (uint8 i = 1; i <= claimLimit; ++i) {
            if(i > formerCount && claimableTimestamp[i] <= block.timestamp) {
                rewards += rewardPerOnce;
                count[account]++;
                emit Claim(account, count[account], rewards);
            }
        }
        
        _transferERC20(account, rewardToken, rewards);
    }

    /**
     * @dev Return reward information of account.
     * @param account The user's account address.
     * @return result The reward information.
     */
    function rewardInfo(address account) public view returns (RewardInfo memory result) {
        uint256 totalRewards = LaunchpadFactoryV2(factory).totalUserRewards(account);

        if(totalRewards > 0) {
            uint256 rewardPerOnce = totalRewards / claimLimit;
            uint256 remains = count[account] == 0 ? totalRewards : rewardPerOnce * (claimLimit - count[account]);

            uint8 formerCount = count[account];
            uint8 tmpCount = formerCount;

            for (uint8 i = 1; i <= claimLimit; ++i) {
                if(i > formerCount && claimableTimestamp[i] <= block.timestamp) {
                    result.claimableAmount += rewardPerOnce;
                    tmpCount++;
                }
            }

            result.totalAmount = totalRewards;
            result.remains = remains;
            result.claimedAmount = totalRewards - remains;
            result.rewardPerOnce = rewardPerOnce;
        }
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