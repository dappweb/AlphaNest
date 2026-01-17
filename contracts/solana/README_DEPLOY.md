# Soldev 网络部署 - 快速参考

## ✅ 已完成

1. **钱包配置** ✅
   - 文件: `~/.config/solana/soldev.json`
   - 公钥: `584ewGPTG6gvEVStLboR8et9E8wD1y13BPpJW98XShxZ`
   - 余额: 3.8 SOL (devnet)

2. **程序 ID 生成** ✅
   - 所有 10 个程序的 keypair 已生成
   - 所有程序 ID 已更新到配置文件

3. **配置文件** ✅
   - `Anchor.toml` 已更新
   - 所有程序的 `lib.rs` 已更新
   - 所有 `Cargo.toml` 已更新到 Anchor 0.30.1

## ⚠️ 待完成

### 构建程序

由于 Cargo 版本问题，需要先解决构建问题：

```bash
# 方案 1: 更新 Cargo (推荐)
rustup update stable

# 方案 2: 使用 nightly
rustup default nightly

# 然后构建
cd contracts/solana
anchor build
```

详细说明见: `BUILD_FIX.md`

### 部署程序

构建成功后，运行：

```bash
cd contracts/solana

# 设置 soldev RPC URL (如果需要)
export SOLDEV_RPC_URL="https://your-soldev-rpc-url.com"

# 运行部署脚本
./final-deploy.sh
```

## 📋 程序列表

| 程序 | 程序 ID | Keypair | 状态 |
|------|---------|---------|------|
| popcow_token | GB13aFFGs6G76dSWWNwHfH596npdwFcxkR5x4Ur4uBjS | ✅ | 待构建 |
| cowguard_insurance | 3vq7cmrWBVQZF11mHCKnDhppSyyBy9xstbz6tzZqDYcg | ✅ | 待构建 |
| popcow_staking | 4pMUmKCTvxCiM6ccGyc851yhyKnaKfJ3q2umLhyZ9Y2d | ✅ | 待构建 |
| token_vesting | FKmtGh85bPYWRCyiJc8rHN6kohJWYgrkWvc8CtXAyz8n | ✅ | 待构建 |
| yield_vault | ECAnyfJmCxVxUSgv4MW7uvAkMophVnG5VTvEAgQt2vrP | ✅ | 待构建 |
| multi_asset_staking | EUN7ptUWascGEbBgFVQTxmFWzMSoN95YG5JGvabNtKYF | ✅ | 待构建 |
| reputation_registry | 6RpDY1sJJyQcTkYqr3myYbLuCA5H9SLeGonyRUBhBbWt | ✅ | 待构建 |
| governance | 5QCNr7vD639eE1R3rbts78qYZQEyc3L8XJriHNcLNyLW | ✅ | 待构建 |
| points_system | 2zv8gpnD7DYogiDb591uceav7Rkxfqz5aCK18hMqPCxH | ✅ | 待构建 |
| referral_system | Cd2NZkSS5K4kqyWQcdaGv8deE8k75JrWjwU3byQRqEju | ✅ | 待构建 |

## 🚀 快速开始

```bash
# 1. 进入目录
cd contracts/solana

# 2. 更新 Cargo (如果需要)
rustup update stable

# 3. 构建程序
anchor build

# 4. 部署到 soldev
export SOLDEV_RPC_URL="https://api.devnet.solana.com"  # 或你的 soldev RPC
./final-deploy.sh
```

## 📝 文件说明

- `final-deploy.sh` - 最终部署脚本（推荐使用）
- `deploy-soldev.sh` - Bash 部署脚本
- `deploy-soldev.ts` - TypeScript 部署脚本
- `create-wallet.js` - 钱包创建脚本
- `generate-program-keys.js` - 程序 keypair 生成脚本
- `BUILD_FIX.md` - 构建问题修复指南
- `DEPLOYMENT_STATUS.md` - 详细部署状态

## 💡 提示

- 确保钱包有足够的 SOL 支付部署费用（每个程序约 0.1-2 SOL）
- 部署前检查网络连接和 RPC URL
- 建议先部署一个程序测试流程
- 记录部署后的程序 ID，用于后续交互
