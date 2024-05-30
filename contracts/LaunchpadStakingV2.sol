// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import './interfaces/ILaunchpadStakingV2.sol';
import './interfaces/ICommonCustomError.sol';
import './TransferHandler.sol';

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
contract LaunchpadStakingV2 is ILaunchpadStakingV2, ICommonCustomError, TransferHandler, Ownable, Pausable, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;
    
    /// @notice The Factory contract address.
    address public immutable factory;
    /// @notice The address for collect non-refund amount.
    address public immutable collector;
    /// @notice The round number.
    uint8 public immutable round;
    /// @notice The Staking start block number.
    uint256 public stakingStartBlock;
    /// @notice The Staking end block number.
    uint256 public stakingEndBlock;

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
    /// @notice User's total reward amount(account => amount).
    mapping(address => uint256) public totalUserRewards;

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
        if(pools[stakingToken].allocation == 0) {
            revert InvalidPool(stakingToken);
        }
        _;
    }

    modifier refundOptonValidator(uint8 refundOption) {
        if(refundOption > 99) {
            revert OutOfRange(0, 99, refundOption);
        }

        if(block.number > stakingStartBlock + (5 * 28800)) {
            if(refundOption < 50) {
                revert BelowStandard(50, refundOption);
            }
        }
        _;
    }

    constructor(address collector_, uint8 round_) Ownable(msg.sender) {
        factory = _msgSender();
        collector = collector_;
        round = round_;
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
        checkActive(params.token)
        refundOptonValidator(params.refundOption)
        updateReward(params.token, params.refundOption)
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
            depositInfo[account][params.token][params.refundOption].amount = amount;
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
        checkActive(params.token)
        refundOptonValidator(params.replacementOption)
        updateReward(params.token, params.currentOption)
        updateReward(params.token, params.replacementOption)
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
            depositInfo[account][params.token][params.replacementOption].amount = currentDepositInfo.amount;
            depositInfo[account][params.token][params.replacementOption].reward = currentDepositInfo.reward;
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
        // Refund deposit
        refund = _withdrawRefund(account, stakingToken);
        emit EmergencyWithdraw(account, stakingToken, refund);
    }

    /**
     * @dev Initialize configuration for mining protocol.
     * @param params {InitializeParams}
     */
    function initialize(InitializeParams calldata params) external onlyOwner {
        setMiningPeriod(params.miningStartBlock, params.miningEndBlock);
        setBonusMiningMultiplierBatch(params.miningMultipliers);

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

        pools[params.stakingToken] = PoolInfo(params.allocation, stakingStartBlock, 0, 0);

        emit CreatePool(params.stakingToken, params.allocation);
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
    
    /**
     * @dev Set {bonusMiningMultipliers}.
     * @param params {MiningMultiplierParams}.
     * refundOption: Refund option.
     * multiplier: Bonus mining multiplier. If mining power is 100.0 %, multiplier is 1000.
     */
    function setBonusMiningMultiplier(MiningMultiplierParams calldata params) public onlyOwner {
        if(params.refundOption > 99) {
            revert OutOfRange(0, 99, params.refundOption);
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
     * @dev Withdraw from all refund options of specific staking token pool when claimable.
     * @param account User's address.
     */
    function withdrawRefund(address account, address stakingToken)
        public
        nonReentrant
        whenNotPaused
        onlyOwner
        returns (uint256 refund)
    {
        if(block.number <= stakingEndBlock) {
            revert NotYetStarted(stakingEndBlock + 1);
        }

        if(_depositedPools[account].contains(stakingToken)) {
            refund = _withdrawRefund(account, stakingToken);
            totalUserRewards[account] += earnedForAllOptions(account, stakingToken);
            _depositedPools[account].remove(stakingToken);
            emit Refund(account, stakingToken, refund);
        }
    }

    function withdrawRefundBatch(address[] calldata params)
        public
        nonReentrant
        whenNotPaused
        onlyOwner
    {
        if(block.number <= stakingEndBlock) {
            revert NotYetStarted(stakingEndBlock + 1);
        }

        for(uint256 i = 0; i < params.length; i++) {
            address account = params[i];
            uint256 len = _depositedPools[params[i]].length();
            address[] memory tokens = new address[](len);

            for(uint256 j = 0; j < len; j++) {
                address token = _depositedPools[params[i]].at(j);
                uint256 refund = _withdrawRefund(account, token);
                tokens[j] = token;
                totalUserRewards[account] += earnedForAllOptions(account, token);
                emit Refund(account, token, refund);
            }

            // remove deposited pools
            for(uint256 j = 0; j < len; j++) {
                _depositedPools[account].remove(tokens[j]);
            }
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
        return (depositInfo_.amount * (rewardPerToken(stakingToken) - depositInfo_.userRewardPerTokenPaid)) / 1e18 * bonusMultiplier / 1000 + depositInfo_.reward;
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
            uint256 dailyRewards = pools[token].allocation * depositInfo_.amount / pools[token].totalSupply * bonusMiningMultipliers[refundOption] / 1000 * 28800;
            result[i] = DepositInfoResponse(token, depositInfo_.amount, rewards, dailyRewards, refundOption);
        }

        return result;
    }

    /**
     * Return to 
     * @param account User's account.
     */
    function depositInfoList(address account) public view returns (DepositInfoResponse[][] memory result) {
        address[] memory depositedPools = depositedPoolsByAccount(account);
        result = new DepositInfoResponse[][](depositedPools.length);

        for (uint256 i = 0; i < depositedPools.length; i++) {
            result[i] = depositInfoListByToken(account, depositedPools[i]);
        }
    }

    /**
     * @dev Return refund.
     * @param refundOption Refund option.
     * @param amount Deposit amount.
     * @return refund Refund calculated by returnOption.
     */
    function calculateRefund(uint8 refundOption, uint256 amount) public pure returns (uint256 refund) {
        if(refundOption > 99) {
            revert OutOfRange(0, 99, refundOption);
        }
        refund = refundOption == 0 ? 0 : amount * refundOption / 100;
    }

    /* -------------------- below functions are internal. -------------------- */

    /**
     * @dev Withdraw token to account.
     * @param account Receiver address.
     * @param stakingToken Token address for transfer.
     */
    function _withdrawRefund(address account, address stakingToken) internal returns (uint256 refund) {
        refund = refundOf[account][stakingToken];
        
        if(refund > 0) {
            refundOf[account][stakingToken] = 0;
            stakingToken != address(0) ? _transferERC20(account, stakingToken, refund) : _transferETH(account, refund);
        }
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