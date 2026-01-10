# AlphaNest Smart Contracts

AlphaGuard 参数化保险协议智能合约，用于 Meme 代币 Rug Pull 保护。

## 概述

### AlphaGuard.sol
主保险合约，实现:
- 保险池创建与管理
- 保单购买 (RUG/SAFE 对赌)
- 赔付计算与领取
- 协议费用管理

### AlphaGuardOracle.sol
Rug Pull 判定预言机:
- 代币状态报告
- 自动 Rug 检测
- 争议机制
- 最终结算

## 技术栈

- **Solidity**: ^0.8.20
- **Framework**: Foundry
- **依赖**: OpenZeppelin Contracts v5

## 快速开始

### 安装依赖

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
```

### 编译

```bash
forge build
```

### 测试

```bash
forge test -vvv
```

### 部署

```bash
# 设置环境变量
export PRIVATE_KEY=your_private_key
export USDC_ADDRESS=0x...
export BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# 部署到测试网
forge script script/Deploy.s.sol:DeployTestnet \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --verify

# 部署到主网
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $BASE_RPC_URL \
  --broadcast \
  --verify
```

## 合约架构

```
┌─────────────────┐     ┌─────────────────────┐
│   AlphaGuard    │◄────│  AlphaGuardOracle   │
│                 │     │                     │
│  - createPool() │     │  - reportToken()    │
│  - purchase()   │     │  - autoDetectRug()  │
│  - claimPayout()│     │  - fileDispute()    │
│  - resolvePool()│     │  - finalizeAndNotify│
└─────────────────┘     └─────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐     ┌─────────────────────┐
│  Payment Token  │     │   Off-chain Data    │
│     (USDC)      │     │  (Price, Liquidity) │
└─────────────────┘     └─────────────────────┘
```

## 核心流程

### 1. 创建保险池
```solidity
alphaGuard.createPool(
    tokenAddress,    // 被保险代币
    86400,          // 持续时间 (24h)
    10 * 1e6,       // 最小投注 (10 USDC)
    1000 * 1e6      // 最大投注 (1000 USDC)
);
```

### 2. 购买保险
```solidity
// 用户认为代币会 Rug
alphaGuard.purchasePolicy(poolId, Position.RUG, 100 * 1e6);

// 用户认为代币是安全的
alphaGuard.purchasePolicy(poolId, Position.SAFE, 100 * 1e6);
```

### 3. 结算
```solidity
// 预言机判定结果
oracle.finalizeAndNotify(reportId, poolId);

// 或直接由预言机结算
alphaGuard.resolvePool(poolId, Outcome.RUGGED);
```

### 4. 领取赔付
```solidity
alphaGuard.claimPayout(policyId);
```

## 赔率计算

赔率 = 总池资金 / 该方投注金额

示例:
- RUG 方投注: 100 USDC
- SAFE 方投注: 300 USDC
- 总池: 400 USDC

赔率:
- RUG: 400/100 = 4x
- SAFE: 400/300 = 1.33x

获胜方分得:
```
赔付 = (用户投注 * 总池 * (1 - 协议费)) / 获胜方总投注
```

## 安全考量

1. **重入保护**: 使用 ReentrancyGuard
2. **暂停机制**: 紧急情况可暂停合约
3. **访问控制**: 关键函数限制为 owner/oracle
4. **争议期**: 给予用户对判定结果提出争议的时间

## 测试覆盖

- [x] 池创建
- [x] 保单购买
- [x] 赔率计算
- [x] 池结算
- [x] 赔付领取
- [x] 池取消退款
- [x] 管理功能
- [x] 暂停机制

## 部署地址

### ETH Sepolia (测试网)
| 合约 | 地址 |
|-----|------|
| AlphaGuard | `0x4DD570dc0518746fdF8B8C0AcA9Aefb84bB2C37a` |
| AlphaGuardOracle | `0x861f15374723a2e722f4BA532507f44a4E08d7fD` |
| MockUSDC | `0xdaA1EEEEE49b6c9Fb6ec2D990D07f1CD6281bebe` |

### Base Mainnet (主网)
| 合约 | 地址 |
|-----|------|
| AlphaGuard | TBD |
| AlphaGuardOracle | TBD |

## License

MIT
