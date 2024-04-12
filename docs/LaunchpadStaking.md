# Solidity API

## LaunchpadStaking

This staking reward contract follows a typical staking reward system but has a unique feature called the refund option.
The refund option is a selectable value for the percentage of the deposit to be refunded after the staking period ends.
Setting the refund option lower allows users to receive additional bonus rewards in addition to the rewards allocated to the staking pool.
The refund option for an already deposited contract can only be changed to a lower percentage.
Claiming rewards can be done after users withdraw their deposits following the end of the staking period, 
and rewards can be received divided into a total of 10 cycles, each defined cycle.

_Should execute initialize() after deploy contract.
Additionally, before initializing, ensure that the total reward amount is transferred to this contract as the reward token.
total reward token amount = Total reward allocation for each pool + bonus reward._

### rewardToken

```solidity
address rewardToken
```

The reward token address.

### collector

```solidity
address collector
```

The address for collect non-refund amount.

### totalAllocationPerBlock

```solidity
uint256 totalAllocationPerBlock
```

The reward allocation per block for all pool.

### bonusRewardSupply

```solidity
uint256 bonusRewardSupply
```

Total bonus rewards for refund option.

### stakingStartBlock

```solidity
uint256 stakingStartBlock
```

The Staking start block number.

### stakingEndBlock

```solidity
uint256 stakingEndBlock
```

The Staking end block number.

### claimLimit

```solidity
uint256 claimLimit
```

The claim limit.

### pools

```solidity
mapping(address => struct ILaunchpadStaking.PoolInfo) pools
```

Pool token address => Pool Info.

### refundOf

```solidity
mapping(address => mapping(address => uint256)) refundOf
```

User's refund by staking token (user address => staking token => refund).

### bonusMiningMultipliers

```solidity
mapping(uint8 => uint256) bonusMiningMultipliers
```

Bonus mining multipliers each refundOption.

### depositInfo

```solidity
mapping(address => mapping(address => mapping(uint8 => struct ILaunchpadStaking.DepositInfo))) depositInfo
```

Deposit info by account, staking token address, refund option.

### count

```solidity
mapping(address => uint256) count
```

User's claim count(account => count).

### claimableBlock

```solidity
mapping(uint256 => uint256) claimableBlock
```

Block number per count(count => block number).

### totalUserRewards

```solidity
mapping(address => uint256) totalUserRewards
```

User's total reward amount(account => amount).

### claimable

```solidity
mapping(address => bool) claimable
```

User's claimable status.

### isWithdrawn

```solidity
mapping(address => mapping(address => bool)) isWithdrawn
```

User's Withdrawal status.

### updateReward

```solidity
modifier updateReward(address stakingToken, uint8 refundOption)
```

_The modifier to run when executing deposit and withdraw functions.
It must be run whenever the staking pool's deposit information changes._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakingToken | address | The address of staking token. |
| refundOption | uint8 | The refund option for update. |

### checkActive

```solidity
modifier checkActive(address stakingToken)
```

_Checking staking pool is active._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakingToken | address | The address of staking token. |

### constructor

```solidity
constructor(address rewardToken_, address collector_) public
```

### deposit

```solidity
function deposit(struct ILaunchpadStaking.Depositparams params) external payable returns (uint256)
```

_Deposit to staking pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| params | struct ILaunchpadStaking.Depositparams | Parameters for deposit. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | acculated deposit. |

### adjustDeposit

```solidity
function adjustDeposit(struct ILaunchpadStaking.AdjustDepositParams params) external returns (uint256)
```

_Adjust return options on user's deposit info.
It must adjust refund option to downward._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| params | struct ILaunchpadStaking.AdjustDepositParams | Parameters for adjust deposit. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | acculated deposit. |

### withdrawRefund

```solidity
function withdrawRefund(address stakingToken) external returns (uint256 refund, uint256 rewards)
```

_Withdraw from all refund options of specific staking token pool when claimable._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakingToken | address | Token address for withdraw. |

### emergencyWithdrawRefund

```solidity
function emergencyWithdrawRefund(address account, address stakingToken) external returns (uint256 refund)
```

_Emergency withdraw from all refund options of specific staking pool deposited by account.
should be execute when paused._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Depositor address. |
| stakingToken | address | Token address for withdraw. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| refund | uint256 | Amount of refund. |

### withdrawReward

```solidity
function withdrawReward(address to, uint256 amount) external
```

_Withdraw reward token by owner._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The address of receiver. |
| amount | uint256 |  |

### emergenctWithdrawReward

```solidity
function emergenctWithdrawReward(address to) external
```

_Emergency withdraw reward token by owner.
Should be execute when paused._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The address of receiver. |

### claim

```solidity
function claim() external returns (uint256 rewards)
```

_Claim rewards.
Should be execute after {withdrawRefund}._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| rewards | uint256 | claimable rewards. |

### initialize

```solidity
function initialize(struct ILaunchpadStaking.InitializeParams params) external
```

_Initialize configuration for mining protocol._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| params | struct ILaunchpadStaking.InitializeParams | {InitializeParams} |

### pause

```solidity
function pause() external
```

_Pause mining protocol_

### unpause

```solidity
function unpause() external
```

_Unpause mining protocol_

### setPool

```solidity
function setPool(struct ILaunchpadStaking.PoolConfig params) public
```

_Set staking pool.
Only execute before start mining._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| params | struct ILaunchpadStaking.PoolConfig | {PoolConfig} |

### setBonusRewardSupply

```solidity
function setBonusRewardSupply(uint256 amount) public
```

_Set {bonusRewardSupply}._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | Amount of bonus reward supply. |

### setMiningPeriod

```solidity
function setMiningPeriod(uint256 startBlock, uint256 endBlock) public
```

_Set staking period._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startBlock | uint256 | The staking start block. |
| endBlock | uint256 | The staking end block. |

### setClaimSchedule

```solidity
function setClaimSchedule(struct ILaunchpadStaking.ClaimConfig params) public
```

### setBonusMiningMultiplier

```solidity
function setBonusMiningMultiplier(struct ILaunchpadStaking.MiningMultiplierParams params) public
```

_Set {bonusMiningMultipliers}._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| params | struct ILaunchpadStaking.MiningMultiplierParams | {MiningMultiplierParams}. refundOption: Refund option. multiplier: Bonus mining multiplier. If mining power is 100.0 %, multiplier is 1000. |

### setBonusMiningMultiplierBatch

```solidity
function setBonusMiningMultiplierBatch(struct ILaunchpadStaking.MiningMultiplierParams[] params) public
```

_Set batch {bonusMiningMultipliers}._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| params | struct ILaunchpadStaking.MiningMultiplierParams[] | Batch of bonus mining multipliers. If mining power is 100.0 %, multiplier is 1000. |

### earned

```solidity
function earned(address account, address stakingToken, uint8 refundOption) public view returns (uint256)
```

_Return user's rewards for a specific refund option in the staking pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | User's account address. |
| stakingToken | address | Staking token address. |
| refundOption | uint8 | Refund option. |

### earnedForAllOptions

```solidity
function earnedForAllOptions(address account, address stakingToken) public view returns (uint256 rewards)
```

_Return user's rewards for all refund options in the staking pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | User's account address. |
| stakingToken | address | Staking token address. |

### lastBlockRewardApplicable

```solidity
function lastBlockRewardApplicable() public view returns (uint256)
```

_If current block number greater than or equal to {stakingEndBlock}, return {stakingEndBlock}.
Else return current block number._

### rewardPerToken

```solidity
function rewardPerToken(address stakingToken) public view returns (uint256)
```

_Return reward per token deposited pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakingToken | address | Staking token address. |

### totalMiningRewards

```solidity
function totalMiningRewards() public view returns (uint256)
```

_Return total mining rewards._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | totalMiningRewards total minting reward. |

### poolInfoListByTokens

```solidity
function poolInfoListByTokens(address[] tokens) public view returns (struct ILaunchpadStaking.PoolInfoResponse[])
```

_Return poolInfo list._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokens | address[] | Array of token address getting {PoolInfoResponse}. |

### depositedPoolsByAccount

```solidity
function depositedPoolsByAccount(address account) public view returns (address[])
```

Return user's deposited pools.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | User's account. |

### depositInfoListByToken

```solidity
function depositInfoListByToken(address account, address token) public view returns (struct ILaunchpadStaking.DepositInfoResponse[])
```

Return user's deposited pool info for a specific refund option.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | User's account. |
| token | address | Staking token address. |

### calculateRefund

```solidity
function calculateRefund(uint8 refundOption, uint256 amount) public pure returns (uint256 refund)
```

_Return refund._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| refundOption | uint8 | Refund option. |
| amount | uint256 | Deposit amount. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| refund | uint256 | Refund calculated by returnOption. |

### _transferERC20

```solidity
function _transferERC20(address to, address token, uint256 amount) internal
```

Call transfer() function to ERC20 Contract.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | Receiver address. |
| token | address | Token address for transfer. |
| amount | uint256 | Amount for transfer. |

### _transferFromERC20

```solidity
function _transferFromERC20(address from, address to, address token, uint256 amount) internal
```

Call transferFrom() function to ERC20 Contract.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | Sender address. |
| to | address | Receiver address. |
| token | address | Token address for transfer. |
| amount | uint256 | Amount for transfer. |

### _transferETH

```solidity
function _transferETH(address to, uint256 amount) internal
```

Call send ETH.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | Receiver address. |
| amount | uint256 | Amount for tranfser. |

### _withdrawRefund

```solidity
function _withdrawRefund(address account, address stakingToken) internal returns (uint256 refund)
```

_Withdraw token to account._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Receiver address. |
| stakingToken | address | Token address for transfer. |

### _updateReward

```solidity
function _updateReward(address account, address stakingToken, uint8 refundOption) internal
```

_Update information related to reward._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | User's address for update. |
| stakingToken | address | Token address for update. |
| refundOption | uint8 | Refund option for update. |

### _verifyDeadline

```solidity
function _verifyDeadline(uint256 target, uint256 deadline) internal pure
```

