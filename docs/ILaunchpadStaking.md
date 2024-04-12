# Solidity API

## ILaunchpadStaking

_Interface of launchpad staking reward.
Basic structs, events and errors to be used in the launchpad contract are defined in this interface._

### PoolInfo

_The staking pool information.
Each token to be staked should be mapped one pool information._

```solidity
struct PoolInfo {
  uint256 allocation;
  uint256 lastUpdatedBlock;
  uint256 rewardPerTokenStored;
  uint256 totalSupply;
  bool isActive;
}
```

### DepositInfo

_The deposit information.
One deposit information should be mapped for each staking pool in
which each account has deposited._

```solidity
struct DepositInfo {
  uint256 amount;
  uint256 userRewardPerTokenPaid;
  uint256 reward;
}
```

### Depositparams

_Parameters required when depositing into a staking pool._

```solidity
struct Depositparams {
  address token;
  uint256 amount;
  uint8 refundOption;
}
```

### AdjustDepositParams

_Parameters required when adjusting the return option for
what has already been deposited in the staking pool._

```solidity
struct AdjustDepositParams {
  address token;
  uint8 currentOption;
  uint8 replacementOption;
}
```

### PoolInfoResponse

_The response to be returned when requesting staking pool information._

```solidity
struct PoolInfoResponse {
  uint256 totalSupply;
  uint256 dailyAllocation;
}
```

### DepositInfoResponse

_The response to be returned when requesting deposit information._

```solidity
struct DepositInfoResponse {
  uint256 amount;
  uint256 rewards;
  uint256 dailyRewards;
  uint8 refundOption;
}
```

### MiningMultiplierParams

_The parameter required when set mining multiplier._

```solidity
struct MiningMultiplierParams {
  uint8 refundOption;
  uint256 multiplier;
}
```

### PoolConfig

_The parameter required when set pool information._

```solidity
struct PoolConfig {
  address stakingToken;
  uint256 allocation;
}
```

### ClaimConfig

_The parameter required when set claim schedule._

```solidity
struct ClaimConfig {
  uint256 countLimit;
  uint256 startBlock;
  uint256 cycle;
}
```

### InitializeParams

_The parameter required when initialize._

```solidity
struct InitializeParams {
  uint256 miningStartBlock;
  uint256 miningEndBlock;
  uint256 bonusSupply;
  struct ILaunchpadStaking.PoolConfig[] poolList;
  struct ILaunchpadStaking.MiningMultiplierParams[] miningMultipliers;
  struct ILaunchpadStaking.ClaimConfig claimSchedule;
}
```

### CreatePool

```solidity
event CreatePool(address token, uint256 allocation)
```

_This event should be emit when create staking pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The staking token contract address. |
| allocation | uint256 | The allocation of reward per block. |

### Deposit

```solidity
event Deposit(address user, address token, uint8 refundOption, uint256 amount)
```

_This event should be emit when user deposit to staking pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user's account address. |
| token | address | The staking token contract address. |
| refundOption | uint8 | The deposited refund options. |
| amount | uint256 | The amount of token for deposit. |

### Withdraw

```solidity
event Withdraw(address user, address token, uint8 refundOption, uint256 amount)
```

_This event should be emit when user withdraw from staking pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user's account address. |
| token | address | The staking token contract address. |
| refundOption | uint8 | The deposited refund options. |
| amount | uint256 | The amount of token for witdraw. |

### EmergencyWithdraw

```solidity
event EmergencyWithdraw(address user, address token, uint256 amount)
```

_This event should be emit when user emergency withdraw from staking pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user's account address. |
| token | address | The staking token contract address. |
| amount | uint256 | The amount of token for withdraw. |

### Refund

```solidity
event Refund(address user, address token, uint256 amount)
```

_This event should be emit when user refunded from staking pool._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user's account address. |
| token | address | the staking token contract address. |
| amount | uint256 | The amount of token for withdraw. |

### Claim

```solidity
event Claim(address user, uint256 count, uint256 reward)
```

_This event should be emit when user claim rewards._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user's account address. |
| count | uint256 | The claim count. |
| reward | uint256 | The amount of reward. |

### Collect

```solidity
event Collect(address user, address token, uint256 amount)
```

_This event should be emit when transfer token to collector._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user's account address. |
| token | address | The staking token contract address. |
| amount | uint256 | The amount of token for withdraw. |

### FixRewards

```solidity
event FixRewards(address user, uint256 amount)
```

_This event should be emit when fixed user's total rewards._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user's account address. |
| amount | uint256 | Total claimable rewards. |

### InvalidPeriod

```solidity
error InvalidPeriod(uint256 startBlock, uint256 endBlock)
```

_It was not executed within the valid period._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startBlock | uint256 | The starting block number. |
| endBlock | uint256 | The end block number. |

### InvalidPool

```solidity
error InvalidPool(address token)
```

_The pool of token does not exist._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The staking token contract address. |

### InvalidDepositInfo

```solidity
error InvalidDepositInfo(address user, address token, uint8 refundOption)
```

_The deposit information does not exist._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user's account address. |
| token | address | The staking token contract address. |
| refundOption | uint8 | The deposited refund option. |

### InvalidDepositedPool

```solidity
error InvalidDepositedPool(address user, address token)
```

_The deposited pool by token dose not exist._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user's account address. |
| token | address | The staking token contract address. |

### OutOfRange

```solidity
error OutOfRange(uint256 first, uint256 last, uint256 input)
```

_The input value is not a valid range value._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| first | uint256 | The first value in range. |
| last | uint256 | The last value in range. |
| input | uint256 | The input value. |

### ClaimUnauthorized

```solidity
error ClaimUnauthorized(address user)
```

_The user is not authorized to claim.
To claim reward, the user must first withdraw deposit._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user's account address. |

### NotYetStarted

```solidity
error NotYetStarted(uint256 startingPoint)
```

_The starting block number has not yet been reached._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startingPoint | uint256 | The starting block number. |

### NotExistRewardOf

```solidity
error NotExistRewardOf(address user)
```

_The user's reward does not exist._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| user | address | The user's account address. |

### OverTheLimit

```solidity
error OverTheLimit(uint256 limit, uint256 required)
```

_The required value is exceeds the limit value._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| limit | uint256 | The limit value. |
| required | uint256 | The required value. |

### OverTheDeadline

```solidity
error OverTheDeadline(uint256 deadline)
```

_Over the deadline. No more execute the function._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| deadline | uint256 | The block number for deadline. |

### BelowStandard

```solidity
error BelowStandard(uint256 standard, uint256 required)
```

_The required value is below the standard value._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| standard | uint256 | The standard value. |
| required | uint256 | The required value. |

### ERC20TransferFailure

```solidity
error ERC20TransferFailure(address to, address from, address token, uint256 amount)
```

_The ERC20 token transfer is failed._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The address of receiver. |
| from | address | The address of sender. |
| token | address | The token contract address for transfer. |
| amount | uint256 | The amount for transfer. |

### ETHTransferFailure

```solidity
error ETHTransferFailure(address to, address from, uint256 amount)
```

_The Native token transfer is failed._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The address of receiver. |
| from | address | The address of sender. |
| amount | uint256 | The amount for transfer. |

