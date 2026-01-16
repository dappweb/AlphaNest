# 使用预构建文件部署指南

## 📋 准备步骤

### 1. 检查当前状态
```bash
cd /home/zyj_dev/AlphaNest/contracts/solana
./prepare-deploy.sh
```

### 2. 准备预构建文件

将构建好的 `.so` 文件放到 `target/deploy/` 目录：

```bash
# 需要的文件列表
target/deploy/popcow_token.so
target/deploy/cowguard_insurance.so
target/deploy/popcow_staking.so
target/deploy/token_vesting.so
target/deploy/yield_vault.so
target/deploy/multi_asset_staking.so
target/deploy/reputation_registry.so
target/deploy/governance.so
target/deploy/points_system.so
target/deploy/referral_system.so
```

### 3. 获取预构建文件的方式

#### 方式 A: 在其他环境构建
```bash
# 在支持 edition2024 的环境中：
cd contracts/solana
anchor build

# 传输文件
scp target/deploy/*.so user@host:/path/to/target/deploy/
```

#### 方式 B: 使用 Docker（如果可用）
```bash
cd contracts/solana
docker run --rm -v $(pwd):/workspace \
  -w /workspace solanalabs/solana:latest \
  anchor build
```

#### 方式 C: 从其他来源获取
如果有其他来源的预构建文件，直接复制到 `target/deploy/` 目录。

## 🚀 部署步骤

### 步骤 1: 准备文件
```bash
cd /home/zyj_dev/AlphaNest/contracts/solana
./prepare-deploy.sh
```

### 步骤 2: 开始部署
```bash
./final-deploy.sh
```

### 步骤 3: 验证部署
```bash
# 检查程序状态
solana program show <PROGRAM_ID> --url https://api.devnet.solana.com
```

## 📋 程序 ID 映射

确保 keypair 文件与程序 ID 匹配：

| 程序 | 程序 ID | Keypair 文件 |
|------|---------|--------------|
| popcow_token | (见 Anchor.toml) | popcow_token-keypair.json |
| cowguard_insurance | (见 Anchor.toml) | cowguard_insurance-keypair.json |
| popcow_staking | (见 Anchor.toml) | popcow_staking-keypair.json |
| token_vesting | (见 Anchor.toml) | token_vesting-keypair.json |
| yield_vault | (见 Anchor.toml) | yield_vault-keypair.json |
| multi_asset_staking | (见 Anchor.toml) | multi_asset_staking-keypair.json |
| reputation_registry | (见 Anchor.toml) | reputation_registry-keypair.json |
| governance | (见 Anchor.toml) | governance-keypair.json |
| points_system | (见 Anchor.toml) | points_system-keypair.json |
| referral_system | (见 Anchor.toml) | referral_system-keypair.json |

## ⚠️ 注意事项

1. **文件名必须匹配**: `.so` 文件名必须与 keypair 文件名对应（去掉 `-keypair.json` 后缀）
2. **程序 ID 匹配**: 确保 `.so` 文件是用对应的 keypair 构建的
3. **余额充足**: 每个程序部署需要约 0.1-2 SOL
4. **网络配置**: 确保已配置为 devnet

## 🔍 检查清单

- [ ] 所有 `.so` 文件已放到 `target/deploy/` 目录
- [ ] 所有 keypair 文件存在
- [ ] 钱包余额充足（至少 2 SOL）
- [ ] 网络已配置为 devnet
- [ ] 运行 `./prepare-deploy.sh` 检查通过

## 💡 快速开始

```bash
# 1. 准备文件（将 .so 文件放到 target/deploy/）
cd /home/zyj_dev/AlphaNest/contracts/solana

# 2. 检查准备状态
./prepare-deploy.sh

# 3. 开始部署
./final-deploy.sh
```
