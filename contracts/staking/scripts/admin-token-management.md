# 后台管理系统 - 代币管理功能

## 📋 概述

管理员可以通过后台管理系统动态添加新的代币作为质押品种，无需修改合约代码。

---

## 🎯 核心功能

### 1. 添加新代币

管理员可以添加任何 SPL Token 作为质押品种。

**功能**:
- ✅ 添加代币配置（名称、小数位、APY、奖励倍数等）
- ✅ 自动创建代币金库
- ✅ 支持价格预言机集成
- ✅ 设置最小质押数量
- ✅ 激活/停用代币

### 2. 更新代币配置

管理员可以动态调整代币的质押参数。

**可调整参数**:
- 基础 APY
- 奖励倍数
- 最小质押数量
- 激活状态

### 3. 移除代币

管理员可以移除不再支持的代币（需确保无活跃质押）。

---

## 🔧 合约接口

### 添加新代币

```rust
pub fn add_stakeable_token(
    ctx: Context<AddStakeableToken>,
    token_mint: Pubkey,
    token_name: String,
    token_decimals: u8,
    base_apy: u16,        // 基础 APY (基点，如 1000 = 10%)
    reward_multiplier: u8, // 奖励倍数 (100 = 1x, 200 = 2x)
    min_stake_amount: u64,
    is_active: bool,
) -> Result<()>
```

**参数说明**:
- `token_mint`: 代币 Mint 地址
- `token_name`: 代币名称（如 "BONK", "JUP"）
- `token_decimals`: 代币小数位（通常 6 或 9）
- `base_apy`: 基础 APY（基点，1000 = 10%）
- `reward_multiplier`: 奖励倍数（100 = 1x，200 = 2x）
- `min_stake_amount`: 最小质押数量（最小单位）
- `is_active`: 是否立即激活

### 更新代币配置

```rust
pub fn update_token_config(
    ctx: Context<UpdateTokenConfig>,
    base_apy: Option<u16>,
    reward_multiplier: Option<u8>,
    min_stake_amount: Option<u64>,
    is_active: Option<bool>,
) -> Result<()>
```

**参数说明**:
- 所有参数都是可选的（Option）
- 只更新提供的参数，其他保持不变

### 质押自定义代币

```rust
pub fn stake_custom_token(
    ctx: Context<StakeCustomToken>,
    amount: u64,
    lock_period: LockPeriod,
) -> Result<()>
```

**功能**:
- 用户可以使用管理员添加的代币进行质押
- 统一按 USD 价值计算奖励
- 支持所有锁定期选项

### 移除代币

```rust
pub fn remove_stakeable_token(
    ctx: Context<RemoveStakeableToken>,
) -> Result<()>
```

**限制**:
- 只能移除无活跃质押的代币
- 确保所有用户已提取质押

---

## 📊 代币配置示例

### 示例 1: 添加 BONK

```typescript
await program.methods
  .addStakeableToken(
    bonkMint,           // BONK Mint 地址
    "BONK",            // 代币名称
    5,                 // 小数位（BONK 是 5）
    1500,              // 基础 APY 15% (1500 基点)
    150,               // 1.5x 奖励倍数
    1_000_000,         // 最小质押 1 BONK
    true               // 立即激活
  )
  .accounts({
    admin: adminKeypair.publicKey,
    pool: poolPDA,
    tokenConfig: tokenConfigPDA,
    vault: vaultPDA,
    tokenMint: bonkMint,
    priceOracle: pythOracle,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY,
  })
  .rpc();
```

### 示例 2: 添加 JUP

```typescript
await program.methods
  .addStakeableToken(
    jupMint,           // JUP Mint 地址
    "JUP",            // 代币名称
    6,                // 小数位（JUP 是 6）
    1200,             // 基础 APY 12% (1200 基点)
    120,              // 1.2x 奖励倍数
    10_000_000,       // 最小质押 10 JUP
    true              // 立即激活
  )
  .accounts({
    // ... 同上
  })
  .rpc();
```

### 示例 3: 更新代币配置

```typescript
// 提高 BONK 的 APY
await program.methods
  .updateTokenConfig(
    { some: 2000 },    // 新 APY: 20%
    null,             // 不更新奖励倍数
    null,             // 不更新最小质押
    null              // 不更新激活状态
  )
  .accounts({
    admin: adminKeypair.publicKey,
    pool: poolPDA,
    tokenConfig: bonkTokenConfigPDA,
  })
  .rpc();
```

---

## 🔐 权限控制

### 管理员权限

- **添加代币**: 仅限池子管理员（`pool.authority`）
- **更新配置**: 仅限池子管理员
- **移除代币**: 仅限池子管理员

### 安全检查

1. **权限验证**: 所有管理操作都验证 `pool.authority`
2. **移除限制**: 只能移除无活跃质押的代币
3. **价格验证**: 代币价格必须可从预言机获取

---

## 📈 使用流程

### 管理员添加新代币

```
1. 准备代币信息
   - Mint 地址
   - 名称、小数位
   - APY、奖励倍数
   - 最小质押数量

2. 调用 add_stakeable_token
   - 创建 TokenConfig
   - 创建 TokenVault
   - 配置参数

3. 集成价格预言机
   - 确保 Pyth Network 支持该代币
   - 或配置自定义价格源

4. 激活代币
   - 设置 is_active = true
   - 用户即可开始质押
```

### 用户质押新代币

```
1. 查看可用代币列表
   - 查询所有 is_active = true 的 TokenConfig

2. 选择代币和锁定期
   - 查看 APY 和奖励倍数
   - 选择锁定期

3. 调用 stake_custom_token
   - 代币转入金库
   - 开始获得奖励
```

---

## 🛠 前端集成

### 查询所有可质押代币

```typescript
// 查询所有 TokenConfig
const tokenConfigs = await program.account.tokenConfig.all([
  {
    memcmp: {
      offset: 8 + 32, // 跳过 discriminator 和 token_mint
      bytes: Buffer.from([1]), // is_active = true
    },
  },
]);
```

### 显示代币信息

```typescript
interface StakeableToken {
  mint: PublicKey;
  name: string;
  decimals: number;
  baseApy: number;      // 基点
  rewardMultiplier: number; // 倍数
  minStake: number;
  totalStaked: number;
  totalStakers: number;
}
```

---

## 📊 代币配置建议

### 主流代币配置

| 代币 | 基础 APY | 奖励倍数 | 最小质押 | 说明 |
|------|---------|---------|---------|------|
| **SOL** | 15% | 1x | 0.1 SOL | 原生代币 |
| **USDC** | 10% | 1x | 10 USDC | 稳定币 |
| **USDT** | 10% | 1x | 10 USDT | 稳定币 |
| **POPCOW** | 10% | 2x | 1000 POPCOW | 项目代币 |
| **BONK** | 15% | 1.5x | 1M BONK | Meme 币 |
| **JUP** | 12% | 1.2x | 10 JUP | DEX 代币 |
| **RAY** | 12% | 1.2x | 1 RAY | DEX 代币 |

### APY 设置原则

1. **稳定币**: 较低 APY（10-12%），风险低
2. **主流代币**: 中等 APY（12-15%），风险中
3. **项目代币**: 较高 APY（15-20%），风险高
4. **POPCOW**: 特殊处理，2x 奖励倍数

---

## 🔍 监控和管理

### 代币统计

```typescript
// 查询代币质押统计
const tokenConfig = await program.account.tokenConfig.fetch(tokenConfigPDA);

console.log({
  name: tokenConfig.tokenName,
  totalStaked: tokenConfig.totalStaked,
  totalStakers: tokenConfig.totalStakers,
  baseApy: tokenConfig.baseApy / 100, // 转换为百分比
  rewardMultiplier: tokenConfig.rewardMultiplier / 100, // 转换为倍数
});
```

### 管理操作日志

建议记录所有管理操作：
- 添加代币时间
- 配置更新历史
- 移除代币原因

---

## ⚠️ 注意事项

1. **价格预言机**: 确保新代币在 Pyth Network 有价格源
2. **流动性**: 确保代币有足够流动性，避免价格操纵
3. **安全性**: 只添加经过审核的代币
4. **用户体验**: 新代币需要前端支持显示

---

## 📝 实施检查清单

- [x] 添加代币功能实现
- [x] 更新配置功能实现
- [x] 移除代币功能实现
- [x] 权限控制实现
- [ ] 价格预言机集成（需要实际 Pyth Network 集成）
- [ ] 前端管理界面
- [ ] 代币列表查询功能
- [ ] 管理操作日志

---

*最后更新: 2026年1月15日*  
*版本: 1.0*
