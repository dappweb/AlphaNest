# 快速部署指南

## ⚠️ 当前构建问题

由于 Cargo 版本限制，无法在当前环境构建程序。需要 edition2024 支持。

## 🚀 部署方案

### 方案 1: 使用预构建文件（最快）

如果有已构建的 `.so` 文件：

```bash
cd /home/zyj_dev/AlphaNest/contracts/solana

# 1. 将 .so 文件放到 target/deploy/ 目录
# 文件名必须匹配：
# - popcow_token.so
# - cowguard_insurance.so  
# - popcow_staking.so
# - token_vesting.so
# - yield_vault.so
# - multi_asset_staking.so
# - reputation_registry.so
# - governance.so
# - points_system.so
# - referral_system.so

# 2. 运行部署
./final-deploy.sh
```

### 方案 2: 手动部署单个程序

```bash
cd /home/zyj_dev/AlphaNest/contracts/solana

# 部署示例（需要先有 .so 文件）
solana program deploy \
  target/deploy/popcow_token.so \
  --program-id target/deploy/popcow_token-keypair.json \
  --keypair ~/.config/solana/soldev.json \
  --url https://api.devnet.solana.com
```

## 📋 程序 ID 列表

| 程序 | 程序 ID | Keypair |
|------|---------|---------|
| popcow_token | GB13aFFGs6G76dSWWNwHfH596npdwFcxkR5x4Ur4uBjS | ✅ |
| cowguard_insurance | 3vq7cmrWBVQZF11mHCKnDhppSyyBy9xstbz6tzZqDYcg | ✅ |
| popcow_staking | 4pMUmKCTvxCiM6ccGyc851yhyKnaKfJ3q2umLhyZ9Y2d | ✅ |
| token_vesting | FKmtGh85bPYWRCyiJc8rHN6kohJWYgrkWvc8CtXAyz8n | ✅ |
| yield_vault | ECAnyfJmCxVxUSgv4MW7uvAkMophVnG5VTvEAgQt2vrP | ✅ |
| multi_asset_staking | EUN7ptUWascGEbBgFVQTxmFWzMSoN95YG5JGvabNtKYF | ✅ |
| reputation_registry | 6RpDY1sJJyQcTkYqr3myYbLuCA5H9SLeGonyRUBhBbWt | ✅ |
| governance | 5QCNr7vD639eE1R3rbts78qYZQEyc3L8XJriHNcLNyLW | ✅ |
| points_system | 2zv8gpnD7DYogiDb591uceav7Rkxfqz5aCK18hMqPCxH | ✅ |
| referral_system | Cd2NZkSS5K4kqyWQcdaGv8deE8k75JrWjwU3byQRqEju | ✅ |

## ✅ 当前状态

- ✅ 钱包已配置
- ✅ 余额充足 (3.8 SOL)
- ✅ 所有 keypair 已生成
- ✅ 网络已配置 (devnet)
- ⚠️ 需要构建文件或预构建文件

## 💡 建议

1. **使用 Docker 构建**（推荐）
2. **在其他环境构建后传输文件**
3. **使用预构建文件**（如果有）
