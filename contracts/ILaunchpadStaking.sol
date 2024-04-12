// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.24;

/**
 * @dev Interface of launchpad staking reward.
 * Basic structs, events and errors to be used in the launchpad contract are defined in this interface.
 */
interface ILaunchpadStaking {
    /**
     * @dev The staking pool information.
     * Each token to be staked should be mapped one pool information.
     */
    struct PoolInfo {
        uint256 allocation;
        uint256 lastUpdatedBlock;
        uint256 rewardPerTokenStored;
        uint256 totalSupply;
        bool isActive;
    }

    /**
     * @dev The deposit information.
     * One deposit information should be mapped for each staking pool in
     * which each account has deposited.
     */
    struct DepositInfo {
        uint256 amount;
        uint256 userRewardPerTokenPaid;
        uint256 reward;
    }

    /**
     * @dev Parameters required when depositing into a staking pool. 
     */
    struct Depositparams {
        address token;
        uint256 amount;
        uint8 refundOption;
    }

    /**
     * @dev Parameters required when adjusting the return option for
     * what has already been deposited in the staking pool.
     */
    struct AdjustDepositParams {
        address token;
        uint8 currentOption;
        uint8 replacementOption;
    }

    /**
     * @dev The response to be returned when requesting staking pool information.
     */
    struct PoolInfoResponse {
        uint256 totalSupply;
        uint256 dailyAllocation;
    }

    /**
     * @dev The response to be returned when requesting deposit information.
     */
    struct DepositInfoResponse {
        uint256 amount;
        uint256 rewards;
        uint256 dailyRewards;
        uint8 refundOption;
    }

    /**
     * @dev The parameter required when set mining multiplier.
     */
    struct MiningMultiplierParams {
        uint8 refundOption;
        uint256 multiplier;
    }

    /**
     * @dev The parameter required when set pool information.
     */
    struct PoolConfig {
        address stakingToken;
        uint256 allocation;
    }

    /**
     * @dev The parameter required when set claim schedule.
     */
    struct ClaimConfig {
        uint256 countLimit;
        uint256 startBlock;
        uint256 cycle;
    }

    /**
     * @dev The parameter required when initialize.
     */
    struct InitializeParams {
        uint256 miningStartBlock;
        uint256 miningEndBlock;
        uint256 bonusSupply;
        PoolConfig[] poolList;
        MiningMultiplierParams[] miningMultipliers;
        ClaimConfig claimSchedule;
    }

    /**
     * @dev This event should be emit when create staking pool.
     * @param token The staking token contract address.
     * @param allocation The allocation of reward per block.
     */
    event CreatePool(address indexed token, uint256 allocation);

    /**
     * @dev This event should be emit when user deposit to staking pool.
     * @param user The user's account address.
     * @param token The staking token contract address.
     * @param refundOption The deposited refund options.
     * @param amount The amount of token for deposit.
     */
    event Deposit(address indexed user, address indexed token, uint8 refundOption, uint256 amount);

    /**
     * @dev This event should be emit when user withdraw from staking pool.
     * @param user The user's account address.
     * @param token The staking token contract address.
     * @param refundOption The deposited refund options.
     * @param amount The amount of token for witdraw.
     */    
    event Withdraw(address indexed user, address indexed token, uint8 refundOption, uint256 amount);

    /**
     * @dev This event should be emit when user emergency withdraw from staking pool.
     * @param user The user's account address.
     * @param token The staking token contract address.
     * @param amount The amount of token for withdraw.
     */
    event EmergencyWithdraw(address indexed user, address indexed token, uint256 amount);
    
    /**
     * @dev This event should be emit when user refunded from staking pool.
     * @param user The user's account address.
     * @param token the staking token contract address.
     * @param amount The amount of token for withdraw.
     */
    event Refund(address indexed user, address indexed token, uint256 amount);

    /**
     * @dev This event should be emit when user claim rewards.
     * @param user The user's account address.
     * @param count The claim count.
     * @param reward The amount of reward.
     */
    event Claim(address indexed user, uint256 count, uint256 reward);

    /**
     * @dev This event should be emit when transfer token to collector.
     * @param user The user's account address.
     * @param token The staking token contract address.
     * @param amount The amount of token for withdraw.
     */
    event Collect(address indexed user, address indexed token, uint256 amount);

    /**
     * @dev This event should be emit when fixed user's total rewards.
     * @param user The user's account address.
     * @param amount Total claimable rewards.
     */
    event FixRewards(address indexed user, uint256 amount);

    /**
     * @dev It was not executed within the valid period.
     * @param startBlock The starting block number.
     * @param endBlock The end block number.
     */
    error InvalidPeriod(uint256 startBlock, uint256 endBlock);

    /**
     * @dev The pool of token does not exist.
     * @param token The staking token contract address.
     */
    error InvalidPool(address token);

    /**
     * @dev The deposit information does not exist.
     * @param user The user's account address.
     * @param token The staking token contract address.
     * @param refundOption The deposited refund option.
     */
    error InvalidDepositInfo(address user, address token, uint8 refundOption);

    /**
     * @dev The deposited pool by token dose not exist.
     * @param user The user's account address.
     * @param token The staking token contract address.
     */
    error InvalidDepositedPool(address user, address token);

    /**
     * @dev The input value is not a valid range value.
     * @param first The first value in range.
     * @param last The last value in range.
     * @param input The input value.
     */
    error OutOfRange(uint256 first, uint256 last, uint256 input);

    /**
     * @dev The user is not authorized to claim.
     * To claim reward, the user must first withdraw deposit.
     * @param user The user's account address.
     */
    error ClaimUnauthorized(address user);

    /**
     * @dev The starting block number has not yet been reached.
     * @param startingPoint The starting block number.
     */
    error NotYetStarted(uint256 startingPoint);

    /**
     * @dev The user's reward does not exist.
     * @param user The user's account address.
     */
    error NotExistRewardOf(address user);

    /**
     * @dev The required value is exceeds the limit value.
     * @param limit The limit value.
     * @param required The required value.
     */
    error OverTheLimit(uint256 limit, uint256 required);

    /**
     * @dev Over the deadline. No more execute the function.
     * @param deadline The block number for deadline.
     */
    error OverTheDeadline(uint256 deadline);

    /**
     * @dev The required value is below the standard value.
     * @param standard The standard value.
     * @param required The required value.
     */
    error BelowStandard(uint256 standard, uint256 required);

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

}