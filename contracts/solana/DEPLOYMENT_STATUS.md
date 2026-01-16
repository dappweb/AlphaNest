# Soldev 网络部署状态

## 已完成的工作

### 1. 钱包配置 ✅
- 私钥已转换为 Solana keypair 格式
- 钱包文件位置: `~/.config/solana/soldev.json`
- 公钥: `584ewGPTG6gvEVStLboR8et9E8wD1y13BPpJW98XShxZ`
- 余额: 3.8 SOL (devnet)

### 2. 程序 ID 配置 ✅
所有程序的 keypair 已生成并更新：

| 程序 | 程序 ID |
|------|---------|
| popcow_token | GB13aFFGs6G76dSWWNwHfH596npdwFcxkR5x4Ur4uBjS |
| cowguard_insurance | 3vq7cmrWBVQZF11mHCKnDhppSyyBy9xstbz6tzZqDYcg |
| popcow_staking | 4pMUmKCTvxCiM6ccGyc851yhyKnaKfJ3q2umLhyZ9Y2d |
| token_vesting | FKmtGh85bPYWRCyiJc8rHN6kohJWYgrkWvc8CtXAyz8n |
| yield_vault | ECAnyfJmCxVxUSgv4MW7uvAkMophVnG5VTvEAgQt2vrP |
| multi_asset_staking | EUN7ptUWascGEbBgFVQTxmFWzMSoN95YG5JGvabNtKYF |
| reputation_registry | 6RpDY1sJJyQcTkYqr3myYbLuCA5H9SLeGonyRUBhBbWt |
| governance | 5QCNr7vD639eE1R3rbts78qYZQEyc3L8XJriHNcLNyLW |
| points_system | 2zv8gpnD7DYogiDb591uceav7Rkxfqz5aCK18hMqPCxH |
| referral_system | Cd2NZkSS5K4kqyWQcdaGv8deE8k75JrWjwU3byQRqEju |

### 3. 配置文件更新 ✅
- `Anchor.toml` 已更新所有网络的程序 ID
- 所有程序的 `lib.rs` 中的 `declare_id!` 已更新
- 为缺少的程序添加了 `Cargo.toml` 文件

### 4. 部署脚本 ✅
已创建以下部署脚本：
- `deploy-soldev.sh` - Bash 部署脚本
- `deploy-soldev.ts` - TypeScript 部署脚本
- `deploy-all.sh` - 简化部署脚本
- `create-wallet.js` - 钱包创建脚本
- `generate-program-keys.js` - 程序 keypair 生成脚本

## 待解决的问题

### Cargo 版本问题
当前遇到 Cargo 版本兼容性问题：
- 错误: `feature 'edition2024' is required`
- Cargo 版本: 1.84.0
- 需要更新 Cargo 或使用 nightly 版本

### 解决方案

#### 选项 1: 更新 Cargo (推荐)
```bash
rustup update
# 或使用 nightly
rustup toolchain install nightly
rustup default nightly
```

#### 选项 2: 清理缓存后重试
```bash
cargo clean
rm -rf ~/.cargo/registry
anchor build
```

#### 选项 3: 使用 solana program deploy 直接部署
如果已有构建好的 `.so` 文件，可以直接部署：
```bash
cd contracts/solana
./deploy-all.sh
```

## 部署命令

构建成功后，使用以下命令部署到 soldev 网络：

```bash
cd contracts/solana

# 方式 1: 使用 Anchor deploy
ANCHOR_PROVIDER_URL=<SOLDEV_RPC_URL> \
ANCHOR_WALLET=~/.config/solana/soldev.json \
anchor deploy

# 方式 2: 使用 Solana CLI (推荐)
SOLDEV_RPC_URL=<SOLDEV_RPC_URL> ./deploy-all.sh

# 方式 3: 逐个部署
solana program deploy \
  target/deploy/popcow_token.so \
  --program-id target/deploy/popcow_token-keypair.json \
  --keypair ~/.config/solana/soldev.json \
  --url <SOLDEV_RPC_URL>
```

## 网络配置

Soldev 网络配置：
- RPC URL: 需要根据实际情况设置（可通过环境变量 `SOLDEV_RPC_URL` 指定）
- 默认使用 devnet: `https://api.devnet.solana.com`

## 注意事项

1. 确保钱包有足够的 SOL 支付部署费用
2. 每个程序部署需要约 0.1-2 SOL（取决于程序大小）
3. 部署后记录程序 ID，用于后续交互
4. 建议先在一个程序上测试部署流程
