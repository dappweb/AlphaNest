# 🚀 Solana 程序部署状态

## ✅ 已部署到 devnet (5/10)

1. **popcow-token**
   - Program ID: `7ezXYQTAtaBYT9aN7ZJnztfoyUk1LNb8xArqbWJBN63N`
   - 文件大小: 302K
   - 状态: ✅ 已部署

2. **token-vesting**
   - Program ID: `g1MeF25X1keZqdDDqtqi49SBFvTvE2YCRBbovdDQ3X7`
   - 文件大小: 233K
   - 状态: ✅ 已部署

3. **referral-system**
   - Program ID: `ApBvLgb7YG4T8GNuaGXp1YVd9dBNRmjj2HmNdrKmSeWj`
   - 文件大小: 256K
   - 状态: ✅ 已部署

4. **governance**
   - Program ID: `9ffadCibzkjgAgFA88Q6jGSK4vSuq7Wa45nhWgPaqjYC`
   - 文件大小: 246K
   - 状态: ✅ 已部署

5. **points-system**
   - Program ID: `Fp6vHW8wVLEkZvgEpHt8o1WENaBW7xhmXQx1okQvU5HH`
   - 文件大小: 365K
   - 状态: ✅ 已部署

## ⏳ 等待部署 (5/10)

以下程序已构建成功，等待部署（需要更多 SOL）：

1. **yield-vault** (300K) - 需要 ~2.13 SOL
2. **reputation-registry** (327K) - 需要 ~2.33 SOL
3. **popcow-staking** (330K) - 需要 ~2.35 SOL
4. **cowguard-insurance** (340K) - 需要 ~2.42 SOL
5. **multi-asset-staking** (496K) - 需要 ~3.54 SOL

## 📋 部署说明

### 当前状态
- **余额**: ~0.8 SOL
- **需要**: 约 12-15 SOL 部署剩余 5 个程序

### 继续部署

当有足够 SOL 时，可以使用以下命令部署：

```bash
cd /home/zyj_dev/AlphaNest/contracts/solana
./deploy-remaining.sh
```

或者手动部署：

```bash
# 部署 yield-vault
solana program deploy target/deploy/yield_vault.so \
  --program-id target/deploy/yield_vault-keypair.json \
  --url devnet

# 部署 popcow-staking
solana program deploy target/deploy/popcow_staking.so \
  --program-id target/deploy/popcow_staking-keypair.json \
  --url devnet

# 部署 reputation-registry
solana program deploy target/deploy/reputation_registry.so \
  --program-id target/deploy/reputation_registry-keypair.json \
  --url devnet

# 部署 cowguard-insurance
solana program deploy target/deploy/cowguard_insurance.so \
  --program-id target/deploy/cowguard_insurance-keypair.json \
  --url devnet

# 部署 multi-asset-staking
solana program deploy target/deploy/multi_asset_staking.so \
  --program-id target/deploy/multi_asset_staking-keypair.json \
  --url devnet
```

## 📊 进度统计

- **构建成功**: 10/10 (100%) ✅
- **已部署**: 5/10 (50%)
- **等待部署**: 5/10 (50%)
- **需要修复**: 0/10 (0%) ✅

## 🎯 下一步

1. 充值更多 SOL 到账户（建议至少 15 SOL）
2. 运行 `./deploy-remaining.sh` 部署剩余程序
3. 更新前端配置以使用新的程序 ID
