# 部署说明 - Devnet

## ✅ 当前状态

### 已完成的准备工作
- ✅ 钱包已配置: `584ewGPTG6gvEVStLboR8et9E8wD1y13BPpJW98XShxZ`
- ✅ 余额充足: 3.8 SOL
- ✅ 所有程序 keypair 已生成 (10个)
- ✅ 网络已配置: devnet
- ✅ 部署脚本已就绪

### 当前问题
- ⚠️ 构建遇到 Cargo 版本兼容性问题
- `constant_time_eq v0.4.2` 需要 edition2024，但当前 Cargo 1.84.0 不支持

## 🚀 快速部署方案

### 方案 1: 使用预构建文件（推荐）⭐

如果有已构建的 `.so` 文件：

```bash
cd /home/zyj_dev/AlphaNest/contracts/solana

# 1. 将 .so 文件放到 target/deploy/ 目录
# 确保文件名匹配：
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

# 2. 运行部署脚本
./final-deploy.sh
```

### 方案 2: 在其他环境构建后传输

```bash
# 在其他支持 edition2024 的环境中：
cd contracts/solana
anchor build

# 将构建好的文件传输到当前环境
scp target/deploy/*.so user@host:/path/to/target/deploy/
```

### 方案 3: 使用 Docker 构建

```bash
cd /home/zyj_dev/AlphaNest/contracts/solana

docker run --rm -v $(pwd):/workspace \
  -w /workspace \
  solanalabs/solana:latest \
  anchor build

# 构建成功后部署
./final-deploy.sh
```

## 📋 程序 ID 列表

部署时需要确认的程序 ID：

| 程序 | 程序 ID | Keypair 文件 |
|------|---------|--------------|
| popcow_token | GB13aFFGs6G76dSWWNwHfH596npdwFcxkR5x4Ur4uBjS | popcow_token-keypair.json |
| cowguard_insurance | 3vq7cmrWBVQZF11mHCKnDhppSyyBy9xstbz6tzZqDYcg | cowguard_insurance-keypair.json |
| popcow_staking | 4pMUmKCTvxCiM6ccGyc851yhyKnaKfJ3q2umLhyZ9Y2d | popcow_staking-keypair.json |
| token_vesting | FKmtGh85bPYWRCyiJc8rHN6kohJWYgrkWvc8CtXAyz8n | token_vesting-keypair.json |
| yield_vault | ECAnyfJmCxVxUSgv4MW7uvAkMophVnG5VTvEAgQt2vrP | yield_vault-keypair.json |
| multi_asset_staking | EUN7ptUWascGEbBgFVQTxmFWzMSoN95YG5JGvabNtKYF | multi_asset_staking-keypair.json |
| reputation_registry | 6RpDY1sJJyQcTkYqr3myYbLuCA5H9SLeGonyRUBhBbWt | reputation_registry-keypair.json |
| governance | 5QCNr7vD639eE1R3rbts78qYZQEyc3L8XJriHNcLNyLW | governance-keypair.json |
| points_system | 2zv8gpnD7DYogiDb591uceav7Rkxfqz5aCK18hMqPCxH | points_system-keypair.json |
| referral_system | Cd2NZkSS5K4kqyWQcdaGv8deE8k75JrWjwU3byQRqEju | referral_system-keypair.json |

## 🔧 手动部署命令

如果只想部署单个程序：

```bash
cd /home/zyj_dev/AlphaNest/contracts/solana

# 部署单个程序示例
solana program deploy \
  target/deploy/popcow_token.so \
  --program-id target/deploy/popcow_token-keypair.json \
  --keypair ~/.config/solana/soldev.json \
  --url https://api.devnet.solana.com
```

## ✅ 部署后验证

部署成功后，验证程序：

```bash
# 检查程序状态
solana program show <PROGRAM_ID> --url https://api.devnet.solana.com

# 检查账户余额
solana balance
```

## 📝 注意事项

1. 每个程序部署需要约 0.1-2 SOL（取决于程序大小）
2. 当前余额 3.8 SOL，足够部署多个程序
3. 部署后记录程序 ID，用于前端配置
4. 建议先部署一个程序测试流程

## 🎯 下一步

一旦程序部署成功：
1. 更新前端配置中的程序 ID（如需要）
2. 测试前端与程序的交互
3. 验证所有功能正常工作
