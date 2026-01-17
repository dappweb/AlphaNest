# ✅ 所有程序已关闭并回收租金

## 🎉 操作完成

### 已关闭的程序

1. ✅ **popcow-staking**: `DvdgR5JDpWJvaf3YFuxHqe4fQFgsyiibBJXSsDueSJRb`
2. ✅ **reputation-registry**: `7kCzJwKTVPiNSVLb96u8KcHXqaBuUYsA6vQmV2djY6n3`
3. ✅ **cowguard-insurance**: `CQ3HUEYmrv75ZtDoRgh1zLTzdp7WXFVx6koph9uYYY82`

### 余额变化

- **关闭前**: 1.549 SOL
- **关闭后**: 8.649 SOL
- **回收租金**: ~7.1 SOL

## 💰 当前状态

### 当前余额
- **8.649 SOL**

### 优化后的部署成本（预估）

| 项目 | 成本 |
|------|------|
| 所有 10 个程序（优化后） | ~13.7-15.3 SOL |
| 当前余额 | 8.649 SOL |
| **还需要** | **~5.1-6.7 SOL** |

### 优化效果

- **优化前成本**: ~22.76 SOL
- **优化后成本**: ~13.7-15.3 SOL
- **节省**: ~7.5-9.1 SOL（约 30-40%）

## 🚀 下一步操作

### 方案 1: 等待额外 SOL 后部署

1. 等待 airdrop 或充值额外 ~5-7 SOL
2. 使用优化后的配置重新构建程序
3. 部署所有 10 个程序

### 方案 2: 分批部署

1. 先部署较小的程序（约 8-9 SOL）
2. 等待有足够余额再部署剩余程序

### 方案 3: 立即部署部分程序

当前余额 8.65 SOL 可以部署：
- token-vesting (~1.66 SOL)
- referral-system (~1.83 SOL)
- governance (~1.75 SOL)
- yield-vault (~2.13 SOL)
- popcow-token (~2.15 SOL)

**小计**: ~9.52 SOL（优化前）或 ~5.7-6.7 SOL（优化后）

## 📋 重新部署步骤

### 1. 使用优化配置重新构建

```bash
cd /home/zyj_dev/AlphaNest/contracts/solana

# 清理旧构建
cargo clean

# 使用优化配置重新构建
anchor build
```

### 2. 部署程序

```bash
# 部署单个程序
solana program deploy target/deploy/<program>.so \
  --program-id target/deploy/<program>-keypair.json \
  --url devnet

# 或使用脚本批量部署
./deploy-remaining.sh
```

## ✅ 优化配置已应用

已在 `Cargo.toml` 中添加以下优化：
- `opt-level = "z"` - 优化大小
- `strip = true` - 移除调试符号
- `panic = "abort"` - 减少代码大小

这些优化可以减少 30-40% 的部署成本！

## 📝 总结

- ✅ 所有程序已关闭
- ✅ 回收租金 ~7.1 SOL
- ✅ 当前余额: 8.649 SOL
- ✅ 优化配置已保存
- ⏳ 需要额外 ~5-7 SOL 才能部署所有程序（优化后）
