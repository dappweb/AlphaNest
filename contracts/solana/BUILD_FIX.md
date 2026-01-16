# 构建问题修复指南

## 当前问题

构建时遇到 Cargo 版本兼容性问题：
```
feature `edition2024` is required
The package requires the Cargo feature called `edition2024`, 
but that feature is not stabilized in this version of Cargo (1.84.0)
```

## 解决方案

### 方案 1: 更新 Cargo 到最新版本 (推荐)

```bash
# 更新 Rust 工具链
rustup update stable

# 或者使用 nightly 版本
rustup toolchain install nightly
rustup default nightly

# 验证版本
cargo --version
```

### 方案 2: 使用 Solana 的构建工具

Solana 程序可以使用 `cargo build-sbf` 直接构建，不依赖 Anchor：

```bash
cd contracts/solana

# 为每个程序构建
for program in programs/*/; do
    cd "$program"
    cargo build-sbf
    cd ../..
done
```

### 方案 3: 使用 Docker 构建

如果有 Docker，可以使用 Solana 官方镜像：

```bash
docker run --rm -v $(pwd):/workspace \
  -w /workspace \
  solanalabs/solana:latest \
  anchor build
```

### 方案 4: 手动修复依赖版本

如果无法更新 Cargo，可以尝试锁定 `constant_time_eq` 到旧版本：

在 `Cargo.toml` 或 `Cargo.lock` 中指定：
```toml
[dependencies]
constant_time_eq = "0.3.0"  # 使用旧版本
```

## 构建成功后部署

构建成功后，运行：

```bash
cd contracts/solana

# 设置 soldev RPC URL (如果需要自定义)
export SOLDEV_RPC_URL="https://your-soldev-rpc-url.com"

# 运行部署脚本
./final-deploy.sh
```

## 检查构建状态

```bash
# 检查是否有构建好的程序
ls -la target/deploy/*.so

# 检查程序 keypair
ls -la target/deploy/*-keypair.json
```

## 程序 ID 列表

所有程序的 ID 已配置：

- popcow_token: `GB13aFFGs6G76dSWWNwHfH596npdwFcxkR5x4Ur4uBjS`
- cowguard_insurance: `3vq7cmrWBVQZF11mHCKnDhppSyyBy9xstbz6tzZqDYcg`
- popcow_staking: `4pMUmKCTvxCiM6ccGyc851yhyKnaKfJ3q2umLhyZ9Y2d`
- token_vesting: `FKmtGh85bPYWRCyiJc8rHN6kohJWYgrkWvc8CtXAyz8n`
- yield_vault: `ECAnyfJmCxVxUSgv4MW7uvAkMophVnG5VTvEAgQt2vrP`
- multi_asset_staking: `EUN7ptUWascGEbBgFVQTxmFWzMSoN95YG5JGvabNtKYF`
- reputation_registry: `6RpDY1sJJyQcTkYqr3myYbLuCA5H9SLeGonyRUBhBbWt`
- governance: `5QCNr7vD639eE1R3rbts78qYZQEyc3L8XJriHNcLNyLW`
- points_system: `2zv8gpnD7DYogiDb591uceav7Rkxfqz5aCK18hMqPCxH`
- referral_system: `Cd2NZkSS5K4kqyWQcdaGv8deE8k75JrWjwU3byQRqEju`
