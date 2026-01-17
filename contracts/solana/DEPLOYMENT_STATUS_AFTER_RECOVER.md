# 📊 部署状态（关闭程序回收 SOL 后）

## ✅ 已完成的操作

### 1. 关闭已部署的程序并回收租金

已关闭以下 5 个程序并回收租金：

- ✅ popcow-token: 已关闭（回收 ~2.15 SOL）
- ✅ token-vesting: 已关闭（回收 ~1.66 SOL）
- ✅ referral-system: 已关闭（回收 ~1.83 SOL）
- ✅ governance: 已关闭（回收 ~1.75 SOL）
- ✅ points-system: 已关闭（回收 ~2.60 SOL）

**回收总额**: ~10.0 SOL

### 2. 余额变化

- **关闭前**: 0.798 SOL
- **关闭后**: 10.791 SOL
- **回收租金**: ~10.0 SOL

### 3. 新部署的程序

已成功部署以下 3 个程序：

1. ✅ **popcow-staking**: `DvdgR5JDpWJvaf3YFuxHqe4fQFgsyiibBJXSsDueSJRb`
2. ✅ **reputation-registry**: `7kCzJwKTVPiNSVLb96u8KcHXqaBuUYsA6vQmV2djY6n3`
3. ✅ **cowguard-insurance**: `CQ3HUEYmrv75ZtDoRgh1zLTzdp7WXFVx6koph9uYYY82`

## ⏳ 待部署的程序

还有 7 个程序未部署：

1. ⏳ **popcow-token** (需要 ~2.15 SOL)
2. ⏳ **token-vesting** (需要 ~1.66 SOL)
3. ⏳ **referral-system** (需要 ~1.83 SOL)
4. ⏳ **governance** (需要 ~1.75 SOL)
5. ⏳ **points-system** (需要 ~2.60 SOL)
6. ⏳ **yield-vault** (需要 ~2.13 SOL)
7. ⏳ **multi-asset-staking** (需要 ~3.54 SOL)

**总计需要**: ~15.66 SOL

## 💰 当前状态

- **当前余额**: 1.549 SOL
- **需要部署**: 7 个程序
- **所需 SOL**: ~15.66 SOL
- **还差**: ~14.11 SOL

## 🚀 下一步操作

### 方案 1: 等待 airdrop/充值

1. 申请 devnet airdrop（等待速率限制解除）
2. 或从其他账户转账
3. 有足够余额后继续部署

### 方案 2: 分批部署

1. 等待余额达到 ~2.5 SOL，部署较小的程序
2. 逐个部署，直到所有程序部署完成

### 方案 3: 优化程序后重新部署

1. 优化程序大小（减少 30-40%）
2. 降低部署成本
3. 用更少的 SOL 完成部署

## 📋 部署命令

当有足够余额时，运行：

```bash
# 部署单个程序
solana program deploy target/deploy/<program>.so \
  --program-id target/deploy/<program>-keypair.json \
  --url devnet

# 或使用脚本批量部署
./deploy-remaining.sh
```

## 📝 总结

- ✅ 成功关闭 5 个程序并回收 ~10 SOL
- ✅ 成功部署 3 个新程序
- ⏳ 剩余 7 个程序待部署
- 💰 需要额外 ~14 SOL 才能完成所有部署
