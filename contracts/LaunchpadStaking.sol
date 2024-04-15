// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import './ILaunchpadStaking.sol';

/**
 * @title Launchpad staking reward contract.
 * @notice This staking reward contract follows a typical staking reward system but has a unique feature called the refund option.
 * The refund option is a selectable value for the percentage of the deposit to be refunded after the staking period ends.
 * Setting the refund option lower allows users to receive additional bonus rewards in addition to the rewards allocated to the staking pool.
 * The refund option for an already deposited contract can only be changed to a lower percentage.
 * Claiming rewards can be done after users withdraw their deposits following the end of the staking period, 
 * and rewards can be received divided into a total of 10 cycles, each defined cycle.
 * @dev Should execute initialize() after deploy contract.
 * Additionally, before initializing, ensure that the total reward amount is transferred to this contract as the reward token.
 * total reward token amount = Total reward allocation for each pool + bonus reward.
 */
contract LaunchpadStaking is ILaunchpadStaking, Ownable, Pausable, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;
    
    /// @notice The reward token address.
    address public immutable rewardToken;
    /// @notice The address for collect non-refund amount.
    address public immutable collector;
    /// @notice The reward allocation per block for all pool.
    uint256 public totalAllocationPerBlock;
    /// @notice Total bonus rewards for refund option.
    uint256 public bonusRewardSupply;
    /// @notice The Staking start block number.
    uint256 public stakingStartBlock;
    /// @notice The Staking end block number.
    uint256 public stakingEndBlock;
    /// @notice The claim limit.
    uint256 public claimLimit;

    /// @notice Deposited pools by user.
    mapping(address => EnumerableSet.AddressSet) private _depositedPools;
    /// @notice Deposited refundOptions by user, staking token.
    mapping(address => mapping(address => EnumerableSet.UintSet)) private _depositedRefundOptions;
    /// @notice Pool token address => Pool Info.
    mapping(address => PoolInfo) public pools;
    /// @notice User's refund by staking token (user address => staking token => refund).
    mapping(address => mapping(address => uint256)) public refundOf;
    /// @notice Bonus mining multipliers each refundOption.
    mapping(uint8 => uint256) public bonusMiningMultipliers;
    /// @notice Deposit info by account, staking token address, refund option.
    mapping(address => mapping(address => mapping(uint8 => DepositInfo))) public depositInfo;
    /// @notice User's claim count(account => count).
    mapping(address => uint256) public count;
    /// @notice Block number per count(count => block number).
    mapping(uint256 => uint256) public claimableBlock;
    /// @notice User's total reward amount(account => amount).
    mapping(address => uint256) public totalUserRewards;
    /// @notice User's claimable status.
    mapping(address => bool) public claimable;
    /// @notice User's Withdrawal status.
    mapping(address => mapping(address => bool)) public isWithdrawn;

    /**
     * @dev The modifier to run when executing deposit and withdraw functions.
     * It must be run whenever the staking pool's deposit information changes.
     * @param stakingToken The address of staking token.
     * @param refundOption The refund option for update.
     */
    modifier updateReward(address stakingToken, uint8 refundOption) {
        _updateReward(_msgSender(), stakingToken, refundOption);
        _;
    }

    /**
     * @dev Checking staking pool is active.
     * @param stakingToken The address of staking token.
     */
    modifier checkActive(address stakingToken) {
        if(block.number < stakingStartBlock || block.number > stakingEndBlock) {
            revert InvalidPeriod(stakingStartBlock, stakingEndBlock);
        }
        if(!pools[stakingToken].isActive) {
            revert InvalidPool(stakingToken);
        }
        _;
    }

    constructor(address rewardToken_, address collector_) Ownable(msg.sender) {
        rewardToken = rewardToken_;
        collector = collector_;
    }

    /* -------------------- below functions are external. -------------------- */
    
    /**
     * @dev Deposit to staking pool.
     * @param params Parameters for deposit.
     * @return acculated deposit.
     */
    function deposit(Depositparams calldata params)
        external
        payable
        nonReentrant
        whenNotPaused
        updateReward(params.token, params.refundOption)
        checkActive(params.token)
        returns (uint256)
    {   
        address account = _msgSender();
        uint256 amount = params.token != address(0) ? params.amount : msg.value;
        uint256 refund = calculateRefund(params.refundOption, amount);
        uint256 nonRefund = amount - refund;

        // If {params.token} is not zero address, it means ERC20 Token.
        if(params.token != address(0)) {
            _transferFromERC20(account, address(this), params.token, amount);
            _transferERC20(collector, params.token, nonRefund);
        } else {
            _transferETH(collector, nonRefund);
        }

        // If {_depositedPools} has not contains staking token, add to {_depositedPools} and initialize {depositInfo}.
        // Else, add amount to existent depositInfo.
        if(!_depositedPools[account].contains(params.token)) {
            _depositedPools[account].add(params.token);
            depositInfo[account][params.token][params.refundOption] = DepositInfo(amount, 0, 0);
        } else {
            depositInfo[account][params.token][params.refundOption].amount += amount;
        }

        // If {depositedRefundOptions} has not contains refund options, add to {depositedRefundOptions}.
        if(!_depositedRefundOptions[account][params.token].contains(params.refundOption)) {
            _depositedRefundOptions[account][params.token].add(params.refundOption);
        }

        refundOf[account][params.token] += refund;
        pools[params.token].totalSupply += amount;

        emit Deposit(account, params.token, params.refundOption, amount);
        emit Collect(account, params.token, nonRefund);

        // Return accumulated deposit.
        return (depositInfo[account][params.token][params.refundOption].amount);
    }

    /**
     * @dev Adjust return options on user's deposit info.
     * It must adjust refund option to downward.
     * @param params Parameters for adjust deposit.
     * @return acculated deposit.
     */
    function adjustDeposit(AdjustDepositParams calldata params)
        external
        nonReentrant
        whenNotPaused
        updateReward(params.token, params.currentOption)
        updateReward(params.token, params.replacementOption)
        checkActive(params.token)
        returns (uint256)
    {
        if(params.currentOption <= params.replacementOption) {
            revert OutOfRange(
                0,
                params.currentOption > 0 ? params.currentOption - 1 : 0,
                params.replacementOption
            );
        }

        address account = _msgSender();
        DepositInfo memory currentDepositInfo = depositInfo[account][params.token][params.currentOption];

        if(!_depositedRefundOptions[account][params.token].contains(params.currentOption)) {
            revert InvalidDepositInfo(account, params.token, params.currentOption);
        }
        uint256 additionalNonRefund = calculateRefund(params.currentOption, currentDepositInfo.amount) - calculateRefund(params.replacementOption, currentDepositInfo.amount);

        // If {params.token} is not zero address, it means ERC20 Token.
        if(params.token != address(0)) {
            _transferERC20(collector, params.token, additionalNonRefund);
        } else {
            _transferETH(collector, additionalNonRefund);
        }

        // If {depositedRefundOptions} has not contains refund option, add to {depositedRefundOptions} and initialize {depositInfo}.
        // Else, add amount to exist depositInfo.
        if(!_depositedRefundOptions[account][params.token].contains(params.replacementOption)) {
            _depositedRefundOptions[account][params.token].add(params.replacementOption);
            depositInfo[account][params.token][params.replacementOption] = DepositInfo(currentDepositInfo.amount, 0, currentDepositInfo.reward);
        } else {
            depositInfo[account][params.token][params.replacementOption].amount += currentDepositInfo.amount;
            depositInfo[account][params.token][params.replacementOption].reward += currentDepositInfo.reward;
        }

        // Remove current refund option to {depositedRefundOptions}
        _depositedRefundOptions[account][params.token].remove(params.currentOption);
        delete depositInfo[account][params.token][params.currentOption];
        refundOf[account][params.token] -= additionalNonRefund;
        

        emit Withdraw(account, params.token, params.currentOption, currentDepositInfo.amount);
        emit Deposit(account, params.token, params.replacementOption, currentDepositInfo.amount);

        return depositInfo[account][params.token][params.replacementOption].amount;
    }

    /**
     * @dev Withdraw from all refund options of specific staking token pool when claimable.
     * @param stakingToken Token address for withdraw.
     */
    function withdrawRefund(address stakingToken)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 refund, uint256 rewards)
    {
        if(block.number <= stakingEndBlock) {
            revert NotYetStarted(stakingEndBlock + 1);
        }

        address account = _msgSender();
        
        if(isWithdrawn[account][stakingToken]) {
            revert InvalidDepositedPool(account, stakingToken);
        }

        // Add claimable rewards, and remove _depositedPool.
        rewards = earnedForAllOptions(account, stakingToken);
        totalUserRewards[account] += rewards;
        _depositedPools[account].remove(stakingToken);

        // If no more exist depositedPools, fixed rewards.
        if(_depositedPools[account].length() == 0) {
            claimable[account] = true;
            emit FixRewards(account, totalUserRewards[account]);
        }

        // Refund deposit
        for(uint256 i = 0; i < _depositedRefundOptions[account][stakingToken].length(); i++) {
            uint8 refundOption = uint8(_depositedRefundOptions[account][stakingToken].at(i));
            _updateReward(account, stakingToken, refundOption);
            depositInfo[account][stakingToken][refundOption].amount = 0;
        }
        refund = _withdrawRefund(account, stakingToken);
        
        emit Refund(account, stakingToken, refund);
    }

    /**
     * @dev Emergency withdraw from all refund options of specific staking pool deposited by account.
     * should be execute when paused.
     * @param account Depositor address.
     * @param stakingToken Token address for withdraw.
     * @return refund Amount of refund.
     */
    function emergencyWithdrawRefund(address account, address stakingToken)
        external
        onlyOwner
        nonReentrant
        whenPaused
        returns (uint256 refund)
    {
        for(uint256 i = 0; i < _depositedRefundOptions[account][stakingToken].length(); i++) {
            uint8 refundOption = uint8(_depositedRefundOptions[account][stakingToken].at(i));
            _updateReward(account, stakingToken, refundOption);
            depositInfo[account][stakingToken][refundOption].amount = 0;
        }

        // Refund deposit
        refund = _withdrawRefund(account, stakingToken);
        emit EmergencyWithdraw(account, stakingToken, refund);
    }

    /**
     * @dev Withdraw reward token by owner.
     * @param to The address of receiver.
     */
    function withdrawReward(address to, uint256 amount)
        external
        onlyOwner
        nonReentrant
    {
        _transferERC20(to, rewardToken, amount);
    }

    /**
     * @dev Emergency withdraw reward token by owner.
     * Should be execute when paused.
     * @param to The address of receiver.
     */
    function emergenctWithdrawReward(address to)
        external
        onlyOwner
        nonReentrant
        whenPaused
    {
        _transferERC20(to, rewardToken, IERC20(rewardToken).balanceOf(address(this)));
    }

    /**
     * @dev Claim rewards.
     * Should be execute after {withdrawRefund}.
     * @return rewards claimable rewards.
     */
    function claim() external nonReentrant whenNotPaused returns (uint256 rewards) {
        address account = _msgSender();

        if(!claimable[account]) {
            revert ClaimUnauthorized(account);
        }

        uint256 formerCount = count[account];
        uint256 nearestClaimableBlock = claimableBlock[formerCount + 1];

        if(formerCount >= claimLimit) {
            revert OverTheLimit(claimLimit, formerCount + 1);
        }

        if(nearestClaimableBlock > block.number) {
            revert NotYetStarted(nearestClaimableBlock);
        }

        for (uint256 i = 1; i <= claimLimit; i++) {
            if(i > formerCount && claimableBlock[i] <= block.number) {
                rewards += totalUserRewards[account] / claimLimit;
                count[account]++;
                emit Claim(account, count[account], rewards);
            }
        }

        if(rewards == 0) {
            revert NotExistRewardOf(account);
        }
        
        _transferERC20(account, rewardToken, rewards);
    }

    /**
     * @dev Initialize configuration for mining protocol.
     * @param params {InitializeParams}
     */
    function initialize(InitializeParams calldata params) external onlyOwner {
        setMiningPeriod(params.miningStartBlock, params.miningEndBlock);
        setBonusRewardSupply(params.bonusSupply);
        setBonusMiningMultiplierBatch(params.miningMultipliers);
        setClaimSchedule(params.claimSchedule);

        for (uint256 i = 0; i < params.poolList.length; i++) {
            setPool(params.poolList[i]);
        }
    }

    /**
     * @dev Pause mining protocol
     */
    function pause() external onlyOwner {
        _pause();
        stakingEndBlock = block.number;
    }

    /**
     * @dev Unpause mining protocol
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /* -------------------- below functions are public. -------------------- */

    /**
     * @dev Set staking pool.
     * Only execute before start mining.
     * @param params {PoolConfig}
     */
    function setPool(PoolConfig calldata params) public onlyOwner {
        if(stakingStartBlock > 0) {
            _verifyDeadline(block.number, stakingStartBlock - 1);
        }

        uint256 prevAllocation = pools[params.stakingToken].allocation;
        uint256 maxValue = (IERC20(rewardToken).balanceOf(address(this)) - ((totalAllocationPerBlock - prevAllocation) * (stakingEndBlock - stakingStartBlock + 1) + bonusRewardSupply)) / (stakingEndBlock - stakingStartBlock + 1);

        if(maxValue < params.allocation) {
            revert OverTheLimit(maxValue, params.allocation);
        }

        totalAllocationPerBlock = totalAllocationPerBlock - prevAllocation + params.allocation;
        pools[params.stakingToken] = PoolInfo(params.allocation, stakingStartBlock, 0, 0, true);

        emit CreatePool(params.stakingToken, params.allocation);
    }

    /**
     * @dev Set {bonusRewardSupply}.
     * @param amount Amount of bonus reward supply.
     */
    function setBonusRewardSupply(uint256 amount) public onlyOwner {
        _verifyDeadline(block.number, stakingStartBlock > 0 ? stakingStartBlock - 1 : 0);
        uint256 maxValue = IERC20(rewardToken).balanceOf(address(this)) - (totalMiningRewards() - bonusRewardSupply);

        if(maxValue < amount) {
            revert OverTheLimit(maxValue, amount);
        }

        bonusRewardSupply = amount;
    }

    /**
     * @dev Set staking period.
     * @param startBlock The staking start block.
     * @param endBlock The staking end block.
     */
    function setMiningPeriod(uint256 startBlock, uint256 endBlock) public onlyOwner {
        if(stakingStartBlock > 0) {
            _verifyDeadline(block.number, stakingStartBlock - 1);
        }
        
        if(startBlock <= block.number) {
            revert BelowStandard(block.number + 1, startBlock);
        }
        
        if(startBlock >= endBlock) {
            revert BelowStandard(startBlock + 1, endBlock);
        }

        stakingStartBlock = startBlock;
        stakingEndBlock = endBlock;
    }

    function setClaimSchedule(ClaimConfig calldata params) public onlyOwner {
        if(claimableBlock[1] > 0) {
            _verifyDeadline(block.number, claimableBlock[1] - 1);
        }

        if(params.countLimit == 0) {
            revert OutOfRange(1, type(uint256).max, params.countLimit);
        }

        claimLimit = params.countLimit;

        for (uint256 i = 0; i < claimLimit; i++) {
            claimableBlock[i + 1] = i == 0 ? params.startBlock : params.startBlock + params.cycle * i;
        }
    }    
    
    /**
     * @dev Set {bonusMiningMultipliers}.
     * @param params {MiningMultiplierParams}.
     * refundOption: Refund option.
     * multiplier: Bonus mining multiplier. If mining power is 100.0 %, multiplier is 1000.
     */
    function setBonusMiningMultiplier(MiningMultiplierParams calldata params) public onlyOwner {
        if(params.refundOption > 100) {
            revert OutOfRange(0, 100, params.refundOption);
        }
        bonusMiningMultipliers[params.refundOption] = params.multiplier;
    }

    /**
     * @dev Set batch {bonusMiningMultipliers}.
     * @param params Batch of bonus mining multipliers. If mining power is 100.0 %, multiplier is 1000.
     */
    function setBonusMiningMultiplierBatch(MiningMultiplierParams[] calldata params) public onlyOwner {
        for(uint8 i = 0; i < params.length; i++) {
            setBonusMiningMultiplier(params[i]);
        }
    }

    /**
     * @dev Return user's rewards for a specific refund option in the staking pool.
     * @param account User's account address.
     * @param stakingToken Staking token address.
     * @param refundOption Refund option. 
     */
    function earned(address account, address stakingToken, uint8 refundOption) public view returns (uint256) {
        DepositInfo memory depositInfo_ = depositInfo[account][stakingToken][refundOption];
        uint256 bonusMultiplier = bonusMiningMultipliers[refundOption];
        return (depositInfo_.amount * (rewardPerToken(stakingToken) - depositInfo_.userRewardPerTokenPaid) / 1e18) * bonusMultiplier / 1000 + depositInfo_.reward;
    }

    /**
     * @dev Return user's rewards for all refund options in the staking pool.
     * @param account User's account address.
     * @param stakingToken Staking token address.
     */
    function earnedForAllOptions(address account, address stakingToken) public view returns (uint256 rewards) {
        for (uint256 i = 0; i < _depositedRefundOptions[account][stakingToken].length(); i++) {
            rewards += earned(account, stakingToken, uint8(_depositedRefundOptions[account][stakingToken].at(i)));
        }
    }
    
    /**
     * @dev If current block number greater than or equal to {stakingEndBlock}, return {stakingEndBlock}.
     * Else return current block number.
     */
    function lastBlockRewardApplicable() public view returns (uint256) {
        return stakingEndBlock <= block.number ? stakingEndBlock : block.number;
    }

    /**
     * @dev Return reward per token deposited pool.
     * @param stakingToken Staking token address.
     */
    function rewardPerToken(address stakingToken) public view returns (uint256) {
        PoolInfo memory pool = pools[stakingToken];

        if (pool.totalSupply > 0) {
            return pool.rewardPerTokenStored + (pool.allocation * (lastBlockRewardApplicable() - pool.lastUpdatedBlock) * 1e18 / pool.totalSupply);
        }

        return pool.rewardPerTokenStored;
    }

    /**
     * @dev Return total mining rewards.
     * @return totalMiningRewards total minting reward.
     */
    function totalMiningRewards() public view returns (uint256) {
        return totalAllocationPerBlock * (stakingEndBlock - stakingStartBlock + 1) + bonusRewardSupply;
    }

    /**
     * @dev Return poolInfo list.
     * @param tokens Array of token address getting {PoolInfoResponse}.
     */
    function poolInfoListByTokens(address[] calldata tokens) public view returns (PoolInfoResponse[] memory) {
        PoolInfoResponse[] memory result = new PoolInfoResponse[](tokens.length);

        for (uint256 i = 0; i < tokens.length; i++) {
            result[i] = PoolInfoResponse(pools[tokens[i]].totalSupply, pools[tokens[i]].allocation * 28800);
        }

        return result;
    }

    /**
     * Return user's deposited pools.
     * @param account User's account.
     */
    function depositedPoolsByAccount(address account) public view returns (address[] memory) {
        return _depositedPools[account].values();
    }

    /**
     * Return user's deposited pool info for a specific refund option.
     * @param account User's account.
     * @param token Staking token address.
     */
    function depositInfoListByToken(address account, address token) public view returns (DepositInfoResponse[] memory) {
        DepositInfoResponse[] memory result = new DepositInfoResponse[](_depositedRefundOptions[account][token].length());

        for (uint256 i = 0; i < _depositedRefundOptions[account][token].length(); i++) {
            uint8 refundOption = uint8(_depositedRefundOptions[account][token].at(i));
            DepositInfo memory depositInfo_ = depositInfo[account][token][refundOption];
            uint256 rewards = earned(account, token, refundOption);
            uint256 dailyRewards = rewards * 28800;
            result[i] = DepositInfoResponse(depositInfo_.amount, rewards, dailyRewards, refundOption);
        }

        return result;
    }

    /**
     * @dev Return refund.
     * @param refundOption Refund option.
     * @param amount Deposit amount.
     * @return refund Refund calculated by returnOption.
     */
    function calculateRefund(uint8 refundOption, uint256 amount) public pure returns (uint256 refund) {
        if(refundOption > 100) {
            revert OutOfRange(0, 100, refundOption);
        }
        refund = refundOption == 0 ? 0 : amount * refundOption / 100;
    }

    /* -------------------- below functions are internal. -------------------- */

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

    /**
     * @dev Withdraw token to account.
     * @param account Receiver address.
     * @param stakingToken Token address for transfer.
     */
    function _withdrawRefund(address account, address stakingToken) internal returns (uint256 refund) {
        refund = refundOf[account][stakingToken];
        if(refund > 0) {
            stakingToken != address(0) ? _transferERC20(account, stakingToken, refund) : _transferETH(account, refund);
            refundOf[account][stakingToken] = 0;
        }
        isWithdrawn[account][stakingToken] = true;
    }

    /**
     * @dev Update information related to reward.
     * @param account User's address for update.
     * @param stakingToken Token address for update.
     * @param refundOption Refund option for update.
     */
    function _updateReward(address account, address stakingToken, uint8 refundOption) internal {
        pools[stakingToken].rewardPerTokenStored = rewardPerToken(stakingToken);
        pools[stakingToken].lastUpdatedBlock = lastBlockRewardApplicable();

        if(account != address(0)) {
            depositInfo[account][stakingToken][refundOption].reward = earned(account, stakingToken, refundOption);
            depositInfo[account][stakingToken][refundOption].userRewardPerTokenPaid = pools[stakingToken].rewardPerTokenStored;
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