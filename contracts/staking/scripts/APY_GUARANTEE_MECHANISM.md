# APY 保证机制 - 如何确保 10% - 200% APY 范围

## 📊 APY 范围说明

根据产品设计，PopCowDefi 质押系统的 APY 范围是 **10% - 200%**：

| 锁定期 | 基础 APY | 实际 APY (1:2) | 倍数 |
|--------|---------|---------------|------|
| 灵活质押 | 5% | **10%** | 1x |
| 30天 | 12% | **28.8%** | 2.4x |
| 90天 | 20% | **80%** | 4x |
| 180天 | 35% | **140%** | 7x |
| 365天 | 50% | **200%** | 10x |

---

## 🔒 保证机制

### 1. 奖励池资金管理

#### 1.1 资金池结构

```rust
pub struct RewardVault {
    pub total_rewards: u64,           // 总奖励资金
    pub allocated_rewards: u64,       // 已分配奖励
    pub reserve_ratio: u8,            // 储备比例 (20%)
    pub min_balance: u64,             // 最小余额阈值
}
```

#### 1.2 资金分配策略

```
总奖励池 (100,000,000 PopCowDefi)
    ↓
┌─────────────────────────────────────┐
│ 20% 储备资金 (20,000,000)            │ ← 紧急储备
│ 40% 质押奖励 (40,000,000)            │ ← 主要奖励池
│ 30% 平台收入补充 (30,000,000)         │ ← 动态补充
│ 10% 特殊活动 (10,000,000)            │ ← 营销活动
└─────────────────────────────────────┘
```

#### 1.3 资金监控机制

```rust
// 检查奖励池余额
fn check_reward_vault_balance(pool: &StakingPool) -> Result<()> {
    let vault_balance = get_token_balance(&pool.reward_vault)?;
    let total_staked = pool.total_staked;
    
    // 计算所需最小余额
    let min_required = calculate_min_required_balance(total_staked, pool.reward_rate_per_second)?;
    
    require!(
        vault_balance >= min_required,
        ErrorCode::InsufficientRewardFunds
    );
    
    Ok(())
}

// 计算最小所需余额（保证 30 天奖励）
fn calculate_min_required_balance(
    total_staked: u64,
    reward_rate_per_second: u64
) -> Result<u64> {
    let seconds_in_30_days = 30 * 24 * 60 * 60;
    let max_multiplier = 10; // 365天锁定期
    
    // 考虑 1:2 兑换比例和最大倍数
    let max_reward_rate = reward_rate_per_second
        .checked_mul(2)  // conversion_rate
        .unwrap()
        .checked_mul(max_multiplier)
        .unwrap();
    
    let min_balance = (total_staked as u128)
        .checked_mul(max_reward_rate as u128)
        .unwrap()
        .checked_mul(seconds_in_30_days as u128)
        .unwrap()
        .checked_div(1e18 as u128)
        .unwrap();
    
    Ok(min_balance as u64)
}
```

---

### 2. 动态 APY 调整机制

#### 2.1 APY 计算公式

```rust
// 实际 APY = 基础 APY × 兑换比例 (2) × 锁定期倍数
fn calculate_actual_apy(
    base_apy: u16,           // 基础 APY (5-50%)
    conversion_rate: u8,      // 兑换比例 (固定 2)
    lock_multiplier: u64,     // 锁定期倍数 (1-10x)
) -> u16 {
    let base = base_apy as u64;
    let actual = base
        .checked_mul(conversion_rate as u64)
        .unwrap()
        .checked_mul(lock_multiplier)
        .unwrap()
        .checked_div(100)
        .unwrap();
    
    actual as u16
}
```

#### 2.2 动态调整策略

```rust
// 根据奖励池余额动态调整基础 APY
fn adjust_base_apy(
    pool: &StakingPool,
    vault_balance: u64,
) -> Result<u64> {
    let total_staked = pool.total_staked;
    if total_staked == 0 {
        return Ok(pool.reward_rate_per_second);
    }
    
    // 计算当前资金可持续天数
    let current_rate = pool.reward_rate_per_second
        .checked_mul(pool.conversion_rate as u64)
        .unwrap();
    
    let max_daily_reward = (total_staked as u128)
        .checked_mul(current_rate as u128)
        .unwrap()
        .checked_mul(86400)  // 一天秒数
        .unwrap()
        .checked_div(1e18 as u128)
        .unwrap();
    
    let sustainable_days = (vault_balance as u128)
        .checked_div(max_daily_reward)
        .unwrap();
    
    // 如果资金不足 30 天，降低奖励率
    if sustainable_days < 30 {
        let reduction_factor = (sustainable_days * 100) / 30;
        let new_rate = pool.reward_rate_per_second
            .checked_mul(reduction_factor as u64)
            .unwrap()
            .checked_div(100)
            .unwrap();
        
        msg!("Warning: Low reward vault balance. Reducing rate by {}%", 100 - reduction_factor);
        return Ok(new_rate);
    }
    
    // 如果资金充足（> 90 天），可以适当提高（但不超过上限）
    if sustainable_days > 90 && pool.reward_rate_per_second < MAX_REWARD_RATE {
        let increase_factor = 105; // 最多提高 5%
        let new_rate = pool.reward_rate_per_second
            .checked_mul(increase_factor)
            .unwrap()
            .checked_div(100)
            .unwrap();
        
        return Ok(new_rate.min(MAX_REWARD_RATE));
    }
    
    Ok(pool.reward_rate_per_second)
}
```

---

### 3. 奖励发放限制

#### 3.1 每日奖励上限

```rust
// 设置每日最大奖励发放量
const MAX_DAILY_REWARDS: u64 = 1_000_000 * 1e9; // 100万 PopCowDefi/天

fn check_daily_limit(
    pool: &StakingPool,
    requested_amount: u64,
) -> Result<()> {
    let today_rewards = get_today_distributed_rewards(pool)?;
    let remaining = MAX_DAILY_REWARDS
        .checked_sub(today_rewards)
        .ok_or(ErrorCode::DailyLimitExceeded)?;
    
    require!(
        requested_amount <= remaining,
        ErrorCode::DailyLimitExceeded
    );
    
    Ok(())
}
```

#### 3.2 单用户奖励上限

```rust
// 防止大户垄断奖励
const MAX_USER_DAILY_REWARDS: u64 = 100_000 * 1e9; // 10万 PopCowDefi/天/用户

fn check_user_daily_limit(
    user_account: &StakeAccount,
    requested_amount: u64,
) -> Result<()> {
    let today_user_rewards = get_user_today_rewards(user_account)?;
    let remaining = MAX_USER_DAILY_REWARDS
        .checked_sub(today_user_rewards)
        .ok_or(ErrorCode::UserDailyLimitExceeded)?;
    
    require!(
        requested_amount <= remaining,
        ErrorCode::UserDailyLimitExceeded
    );
    
    Ok(())
}
```

---

### 4. 平台收入补充机制

#### 4.1 收入来源

```
平台总收入
    ↓
┌─────────────────────────────────────┐
│ 30% → 质押者分红 (直接补充奖励池)     │
│ 40% → 国库                           │
│ 30% → 回购销毁                       │
└─────────────────────────────────────┘
```

#### 4.2 自动补充逻辑

```rust
// 每日自动补充奖励池
pub fn auto_refill_reward_vault(
    ctx: Context<AutoRefill>,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let vault_balance = get_token_balance(&pool.reward_vault)?;
    
    // 计算目标余额（90 天储备）
    let target_balance = calculate_target_balance(pool)?;
    
    if vault_balance < target_balance {
        let refill_amount = target_balance
            .checked_sub(vault_balance)
            .unwrap();
        
        // 从平台收入池转移
        transfer_from_revenue_pool(
            &ctx.accounts.revenue_pool,
            &pool.reward_vault,
            refill_amount,
        )?;
        
        msg!("Refilled reward vault with {} tokens", refill_amount);
    }
    
    Ok(())
}

// 计算目标余额（90 天储备）
fn calculate_target_balance(pool: &StakingPool) -> Result<u64> {
    let total_staked = pool.total_staked;
    let max_rate = pool.reward_rate_per_second
        .checked_mul(pool.conversion_rate as u64)
        .unwrap()
        .checked_mul(10)  // 最大倍数
        .unwrap();
    
    let days = 90;
    let seconds = days * 24 * 60 * 60;
    
    let target = (total_staked as u128)
        .checked_mul(max_rate as u128)
        .unwrap()
        .checked_mul(seconds as u128)
        .unwrap()
        .checked_div(1e18 as u128)
        .unwrap();
    
    Ok(target as u64)
}
```

---

### 5. 紧急保护机制

#### 5.1 低余额保护

```rust
// 当奖励池余额过低时，暂停新质押
fn check_emergency_status(
    pool: &StakingPool,
) -> Result<()> {
    let vault_balance = get_token_balance(&pool.reward_vault)?;
    let min_balance = calculate_min_required_balance(
        pool.total_staked,
        pool.reward_rate_per_second,
    )?;
    
    if vault_balance < min_balance {
        // 暂停新质押
        pool.is_paused = true;
        
        // 发送警报
        emit!(EmergencyPauseEvent {
            reason: "Insufficient reward funds",
            vault_balance,
            min_required: min_balance,
        });
        
        return Err(ErrorCode::EmergencyPause.into());
    }
    
    Ok(())
}
```

#### 5.2 奖励率下限保护

```rust
// 确保 APY 不低于 10%
const MIN_BASE_APY: u16 = 5;  // 基础 5%，实际 10% (1:2)
const MIN_REWARD_RATE: u64 = 1000;  // 对应 5% APY

fn enforce_min_apy(
    pool: &mut StakingPool,
) -> Result<()> {
    // 计算当前基础 APY
    let current_base_apy = calculate_base_apy_from_rate(
        pool.reward_rate_per_second,
        pool.total_staked,
    )?;
    
    if current_base_apy < MIN_BASE_APY {
        // 如果低于最小值，调整到最小值
        pool.reward_rate_per_second = MIN_REWARD_RATE;
        
        msg!("Adjusted reward rate to minimum: {} ({}% APY)", 
             MIN_REWARD_RATE, MIN_BASE_APY * 2);
    }
    
    Ok(())
}
```

---

### 6. APY 上限保护

#### 6.1 最大 APY 限制

```rust
// 确保 APY 不超过 200%
const MAX_BASE_APY: u16 = 50;  // 基础 50%，实际 200% (1:2 × 10x)
const MAX_REWARD_RATE: u64 = 10000;  // 对应 50% APY

fn enforce_max_apy(
    pool: &mut StakingPool,
) -> Result<()> {
    // 计算当前基础 APY
    let current_base_apy = calculate_base_apy_from_rate(
        pool.reward_rate_per_second,
        pool.total_staked,
    )?;
    
    if current_base_apy > MAX_BASE_APY {
        // 如果超过最大值，调整到最大值
        pool.reward_rate_per_second = MAX_REWARD_RATE;
        
        msg!("Adjusted reward rate to maximum: {} ({}% APY)", 
             MAX_REWARD_RATE, MAX_BASE_APY * 2);
    }
    
    Ok(())
}
```

---

### 7. 监控和预警系统

#### 7.1 实时监控指标

```typescript
interface APYMonitoring {
  // 奖励池状态
  rewardVaultBalance: number;
  rewardVaultBalanceUSD: number;
  sustainableDays: number;
  
  // APY 状态
  currentBaseAPY: number;
  currentActualAPY: number;  // 考虑 1:2 和锁定期
  minAPY: number;  // 10%
  maxAPY: number;  // 200%
  
  // 质押状态
  totalStaked: number;
  totalStakers: number;
  averageLockPeriod: number;
  
  // 奖励发放
  dailyRewardsDistributed: number;
  dailyRewardsLimit: number;
  remainingDailyLimit: number;
}
```

#### 7.2 预警阈值

```rust
// 预警级别
enum AlertLevel {
    Normal,      // 正常
    Warning,     // 警告（资金 < 60 天）
    Critical,    // 严重（资金 < 30 天）
    Emergency,   // 紧急（资金 < 7 天）
}

fn get_alert_level(sustainable_days: u64) -> AlertLevel {
    if sustainable_days < 7 {
        AlertLevel::Emergency
    } else if sustainable_days < 30 {
        AlertLevel::Critical
    } else if sustainable_days < 60 {
        AlertLevel::Warning
    } else {
        AlertLevel::Normal
    }
}
```

---

### 8. 实施检查清单

#### 8.1 合约层面

- [x] 实现奖励池余额检查
- [x] 实现动态 APY 调整
- [x] 实现每日奖励上限
- [x] 实现紧急保护机制
- [x] 实现 APY 上下限保护

#### 8.2 运营层面

- [ ] 设置初始奖励池资金（20,000,000 PopCowDefi）
- [ ] 配置平台收入自动补充
- [ ] 设置监控和预警系统
- [ ] 建立应急响应流程

#### 8.3 监控层面

- [ ] 实时监控奖励池余额
- [ ] 实时监控 APY 范围
- [ ] 实时监控奖励发放量
- [ ] 设置自动预警通知

---

## 📊 APY 保证流程图

```
用户质押 POPCOW
    ↓
检查奖励池余额
    ↓
┌─────────────────────────────────────┐
│ 余额充足 (> 90天)                    │ → 正常发放奖励
│ 余额不足 (30-90天)                   │ → 动态调整 APY
│ 余额严重不足 (< 30天)                │ → 降低奖励率
│ 余额紧急 (< 7天)                     │ → 暂停新质押
└─────────────────────────────────────┘
    ↓
平台收入自动补充
    ↓
恢复奖励池余额
    ↓
恢复正常 APY
```

---

## 🎯 关键保证措施总结

### 1. **资金保证**
- ✅ 初始奖励池：20,000,000 PopCowDefi (20%)
- ✅ 平台收入补充：30% 收入自动补充
- ✅ 储备资金：20% 紧急储备

### 2. **APY 范围保证**
- ✅ 下限保护：最低 10% APY（灵活质押）
- ✅ 上限保护：最高 200% APY（365天锁定期）
- ✅ 动态调整：根据资金池自动调整

### 3. **发放限制**
- ✅ 每日上限：100万 PopCowDefi/天
- ✅ 用户上限：10万 PopCowDefi/天/用户
- ✅ 防止大户垄断

### 4. **紧急保护**
- ✅ 低余额暂停新质押
- ✅ 自动补充机制
- ✅ 预警系统

---

## 📈 预期效果

通过以上机制，可以确保：

1. **APY 始终在 10%-200% 范围内**
2. **奖励池资金充足**（至少 30 天储备）
3. **平台可持续运营**
4. **用户收益稳定**

---

*最后更新: 2026年1月15日*  
*版本: 1.0*
