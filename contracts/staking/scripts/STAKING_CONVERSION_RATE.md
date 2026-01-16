# PopCowDefi 质押兑换比例说明

## 📊 兑换比例

根据白皮书和平台设计，实现以下兑换机制：

```
1 POPCOW = 2 PopCowDefi
```

### 核心机制

用户质押 POPCOW 代币，按照 **1:2** 的比例获得 PopCowDefi 奖励。

## 🔄 工作原理

### 1. 质押流程

```
用户质押 100 POPCOW
    ↓
系统计算奖励率
    ↓
按照 1:2 比例计算奖励
    ↓
质押 100 POPCOW = 每秒获得 200 PopCowDefi 的奖励率
```

### 2. 奖励计算

```rust
// 基础奖励率（每秒）
let base_reward_rate = reward_rate_per_second;

// 应用 1:2 兑换比例
let actual_reward_rate = base_reward_rate * conversion_rate;  // conversion_rate = 2

// 用户奖励 = 质押量 * 实际奖励率 * 时间 * 锁定期倍数
let user_reward = staked_amount * actual_reward_rate * time_elapsed * lock_multiplier;
```

### 3. 示例计算

假设：
- 用户质押：1,000 POPCOW
- 基础奖励率：0.001 PopCowDefi/秒/1 POPCOW
- 兑换比例：1:2
- 锁定期：90天（4x 倍数）
- 质押时间：30天（2,592,000 秒）

计算：
```
实际奖励率 = 0.001 * 2 = 0.002 PopCowDefi/秒/1 POPCOW

基础奖励 = 1,000 * 0.002 * 2,592,000 = 5,184,000 PopCowDefi

应用锁定期倍数 = 5,184,000 * 4 = 20,736,000 PopCowDefi
```

## 📋 白皮书对齐

### 白皮书中的描述

根据 `PopCow-Whitepaper.md` 和 `defi-strategy.md`：

1. **双代币模型**:
   - POPCOW: 引流代币，用户获取、质押入场券
   - PopCowDefi: 价值代币，平台收益分红、治理

2. **代币流转**:
   ```
   用户购买 POPCOW
         ↓
     质押 POPCOW
         ↓
   挖矿获得 $PopCowDefi
   ```

3. **质押机制**:
   - 质押 POPCOW 获得 PopCowDefi
   - 1:2 兑换比例确保价值代币的稀缺性

## 🎯 实现细节

### Solana 合约实现

```rust
// 在 StakingPool 结构中
pub struct StakingPool {
    pub conversion_rate: u8,  // 固定为 2 (1:2 比例)
    // ...
}

// 在奖励计算中应用
let actual_reward_rate = pool.reward_rate_per_second
    .checked_mul(pool.conversion_rate as u64)
    .unwrap();
```

### 前端显示

```typescript
// 显示兑换比例
const conversionRate = 2;  // 1 POPCOW = 2 PopCowDefi

// 计算预期奖励
function calculateExpectedReward(
  stakedAmount: number,
  timeInSeconds: number,
  lockPeriod: LockPeriod
): number {
  const baseRate = 0.001;  // 每秒基础奖励率
  const actualRate = baseRate * conversionRate;  // 应用 1:2 比例
  const multiplier = getLockMultiplier(lockPeriod);
  
  return stakedAmount * actualRate * timeInSeconds * multiplier;
}
```

## 💰 经济模型

### 价值支撑

1. **POPCOW 价值**:
   - 唯一质押入场券
   - 必须持有并质押 POPCOW 才能挖取 PopCowDefi
   - 交易手续费销毁机制

2. **PopCowDefi 价值**:
   - 平台收益分红（40%）
   - 治理权力
   - 手续费折扣
   - 固定供应量（1亿）

### 兑换比例的意义

- **1:2 比例**确保：
  - PopCowDefi 的稀缺性（需要质押 POPCOW 才能获得）
  - 激励用户长期持有和质押 POPCOW
  - 平衡两个代币的价值关系

## 📊 质押池配置

### 推荐配置

```rust
// 初始化参数
let reward_rate_per_second = 1000;  // 每秒 1000 基点（0.001 PopCowDefi/秒/1 POPCOW）
let conversion_rate = 2;             // 1:2 兑换比例

// 实际奖励率 = 0.001 * 2 = 0.002 PopCowDefi/秒/1 POPCOW
```

### 不同锁定期的奖励

| 锁定期 | 倍数 | 实际 APY (基于 1:2) |
|--------|------|-------------------|
| 灵活质押 | 1x | 10% (基础 5% * 2) |
| 30天 | 2.4x | 28.8% (基础 12% * 2) |
| 90天 | 4x | 80% (基础 20% * 2) |
| 180天 | 7x | 140% (基础 35% * 2) |
| 365天 | 10x | 200% (基础 50% * 2) |

## ⚠️ 注意事项

1. **兑换比例固定**: 1:2 比例在合约中固定，不可更改
2. **奖励发放**: PopCowDefi 通过挖矿逐步发放，不是一次性兑换
3. **锁定期影响**: 锁定期越长，获得的 PopCowDefi 越多（倍数加成）
4. **总供应量**: PopCowDefi 总供应量固定为 1 亿，需要控制奖励发放速度

## 🔧 部署配置

### 初始化参数

```typescript
const stakingConfig = {
  stakeMint: 'POPCOW_MINT_ADDRESS',
  rewardMint: 'POPCOWDEFI_MINT_ADDRESS',
  rewardRatePerSecond: 1000,  // 基础奖励率
  conversionRate: 2,            // 1:2 兑换比例（合约中固定）
};
```

### 奖励池资金

需要确保奖励池有足够的 PopCowDefi 代币：
- 总供应量：100,000,000 PopCowDefi
- 建议初始奖励池：20,000,000 PopCowDefi (20%)
- 后续通过平台收入补充

## 📚 相关文档

- [白皮书](../PopCow-Whitepaper.md)
- [代币经济学](../docs/TOKENOMICS.md)
- [DeFi 策略](../docs/defi-strategy.md)
- [质押合约源码](../contracts/solana/programs/staking/src/lib.rs)

---

*最后更新: 2026年1月15日*
*版本: 1.0*
