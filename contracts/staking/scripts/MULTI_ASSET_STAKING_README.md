# 多资产质押合约使用说明

## 📋 概述

多资产质押合约支持用户质押多种主流币（SOL、USDC、USDT、POPCOW），统一按 USD 价值计算奖励，用于项目初期资金募集。

---

## 🎯 核心功能

### 1. 支持的资产

| 资产 | 类型 | 说明 |
|------|------|------|
| **SOL** | 原生代币 | Solana 原生代币 |
| **USDC** | 稳定币 | USD Coin (6 位小数) |
| **USDT** | 稳定币 | Tether (6 位小数) |
| **POPCOW** | 项目代币 | PopCow 代币 (9 位小数) |

### 2. 质押机制

- **统一计算**：所有资产按 USD 价值统一计算奖励
- **锁定期支持**：灵活/30天/90天/180天/365天
- **早鸟奖励**：前 30 天质押额外奖励
- **大额奖励**：大额质押额外奖励
- **POPCOW 加成**：POPCOW 质押有 2x 奖励加成

### 3. 资金分配

```
总质押资金
    ↓
┌─────────────────────────────────────┐
│ 40% → 项目开发资金                    │
│ 30% → 流动性资金                      │
│ 20% → 奖励池                          │
│ 10% → 储备资金                        │
└─────────────────────────────────────┘
```

---

## 🔧 合约接口

### 初始化

```rust
pub fn initialize_pool(
    ctx: Context<InitializePool>,
    price_oracle: Pubkey,
) -> Result<()>
```

**参数**:
- `price_oracle`: Pyth Network 价格预言机地址

### 质押 SOL

```rust
pub fn stake_sol(
    ctx: Context<StakeSol>,
    amount: u64,
    lock_period: LockPeriod,
) -> Result<()>
```

**参数**:
- `amount`: SOL 数量（lamports）
- `lock_period`: 锁定期（Flexible/ThirtyDays/NinetyDays/OneEightyDays/ThreeSixtyFiveDays）

### 质押 USDC

```rust
pub fn stake_usdc(
    ctx: Context<StakeUSDC>,
    amount: u64,
    lock_period: LockPeriod,
) -> Result<()>
```

**参数**:
- `amount`: USDC 数量（最小单位，6 位小数）
- `lock_period`: 锁定期

### 质押 USDT

```rust
pub fn stake_usdt(
    ctx: Context<StakeUSDT>,
    amount: u64,
    lock_period: LockPeriod,
) -> Result<()>
```

**参数**:
- `amount`: USDT 数量（最小单位，6 位小数）
- `lock_period`: 锁定期

### 质押 POPCOW

```rust
pub fn stake_popcow(
    ctx: Context<StakePOPCOW>,
    amount: u64,
    lock_period: LockPeriod,
) -> Result<()>
```

**参数**:
- `amount`: POPCOW 数量（最小单位，9 位小数）
- `lock_period`: 锁定期

**特殊奖励**: POPCOW 质押有 2x 奖励加成

### 解除质押

```rust
pub fn unstake(
    ctx: Context<Unstake>,
    amount_usd: u64,
) -> Result<()>
```

**参数**:
- `amount_usd`: 解除质押的 USD 价值（6 位小数）

**注意**: 锁定期内无法解除质押（灵活质押除外）

### 领取奖励

```rust
pub fn claim_rewards(
    ctx: Context<ClaimRewards>,
) -> Result<()>
```

领取累积的 PopCowDefi 奖励。

### 每日资金分配

```rust
pub fn daily_fund_allocation(
    ctx: Context<DailyAllocation>,
) -> Result<()>
```

**仅限管理员**：每日自动分配资金到开发/流动性/奖励/储备钱包。

---

## 📊 奖励计算

### 基础公式

```
奖励 = 质押价值(USD) × 奖励率 × 时间 × 锁定期倍数 × 早鸟倍数 × 资产倍数
```

### 锁定期倍数

| 锁定期 | 倍数 | 说明 |
|--------|------|------|
| 灵活质押 | 1x | 基础奖励 |
| 30天 | 1.5x | +50% 奖励 |
| 90天 | 2x | +100% 奖励 |
| 180天 | 3x | +200% 奖励 |
| 365天 | 5x | +400% 奖励 |

### 早鸟奖励

| 时间段 | 额外奖励 |
|--------|---------|
| 前 7 天 | +50% |
| 前 14 天 | +30% |
| 前 30 天 | +20% |

### 资产奖励倍数

| 资产 | 倍数 |
|------|------|
| SOL | 1x |
| USDC | 1x |
| USDT | 1x |
| POPCOW | 2x |

---

## 🚀 部署步骤

### 1. 编译合约

```bash
cd contracts/solana
anchor build
```

### 2. 部署到 Devnet

```bash
anchor deploy --provider.cluster devnet
```

### 3. 初始化池子

```typescript
import { initializePool } from './deploy-multi-asset-staking';

const programId = new PublicKey('MultiAssetStake1111111111111111111111111111111');
const priceOracle = new PublicKey('PYTH_ORACLE_ADDRESS');

await initializePool(wallet, programId, priceOracle);
```

### 4. 配置代币地址

在 `deploy-multi-asset-staking.ts` 中配置：
- USDC Mint 地址
- USDT Mint 地址
- POPCOW Mint 地址
- PopCowDefi Mint 地址
- Pyth Network 价格预言机地址

---

## 📝 使用示例

### TypeScript 客户端

```typescript
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

// 连接
const connection = new Connection('https://api.devnet.solana.com');
const wallet = Keypair.fromSecretKey(/* ... */);
const provider = new AnchorProvider(connection, wallet, {});
const program = new Program(idl, programId, provider);

// 质押 SOL
await program.methods
  .stakeSol(
    new anchor.BN(1_000_000_000), // 1 SOL
    { flexible: {} }
  )
  .accounts({
    user: wallet.publicKey,
    pool: poolPDA,
    solVault: solVaultPDA,
    priceOracle: pythOracle,
  })
  .rpc();

// 质押 USDC
await program.methods
  .stakeUsdc(
    new anchor.BN(100_000_000), // 100 USDC
    { ninetyDays: {} }
  )
  .accounts({
    user: wallet.publicKey,
    pool: poolPDA,
    userUsdcAccount: userUsdcATA,
    usdcVault: usdcVaultPDA,
    priceOracle: pythOracle,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .rpc();

// 领取奖励
await program.methods
  .claimRewards()
  .accounts({
    user: wallet.publicKey,
    pool: poolPDA,
    stakeAccount: stakeAccountPDA,
    userRewardToken: userRewardATA,
    rewardVault: rewardVaultPDA,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .rpc();
```

---

## 🔐 安全注意事项

1. **价格预言机**: 必须使用可信的价格预言机（Pyth Network）
2. **多签钱包**: 开发资金必须使用多签钱包管理
3. **资金分配**: 资金分配需要多签审批
4. **审计**: 上线前必须完成安全审计

---

## 📊 监控指标

### 关键指标

- 总质押价值（USD）
- 各资产质押量
- 奖励池余额
- 每日奖励发放量
- 资金分配情况

### 预警阈值

- 奖励池余额 < 30 天储备：警告
- 奖励池余额 < 7 天储备：紧急暂停

---

## 📞 支持

- **技术文档**: 查看 `MULTI_ASSET_STAKING.md`
- **资金募集计划**: 查看 `FUNDRAISING_PLAN.md`
- **问题反馈**: tech@popcow.xyz

---

*最后更新: 2026年1月15日*  
*版本: 1.0*
