# 编译问题解决方案

## ⚠️ 当前问题

### 错误信息
```
error: failed to parse manifest at `blake3-1.8.3/Cargo.toml`
Caused by:
  feature `edition2024` is required
  The package requires the Cargo feature called `edition2024`, 
  but that feature is not stabilized in this version of Cargo (1.84.0)
```

### 根本原因
- Anchor CLI 内部使用的 Cargo 版本是 **1.84.0**（2025-04-07）
- 依赖包 `blake3 v1.8.3` 需要 `edition2024` 特性
- `edition2024` 需要更新的 Cargo 版本（至少 1.85.0+）

---

## 🔧 解决方案

### 方案 1: 使用 Solana 官方 Docker 镜像（推荐）✅

**优点**: 
- 环境完全隔离
- 包含所有必需工具
- 版本匹配

**步骤**:
```bash
# 1. 确保 Docker 已安装
docker --version

# 2. 使用 Solana 官方镜像构建
cd contracts/solana
docker run --rm -v $(pwd):/workspace \
  -w /workspace \
  solanalabs/solana:latest \
  anchor build

# 或者使用 Anchor 官方镜像
docker run --rm -v $(pwd):/workspace \
  -w /workspace \
  projectserum/anchor:latest \
  anchor build
```

---

### 方案 2: 手动更新 Anchor 和 Cargo

**步骤**:
```bash
# 1. 卸载旧版 Anchor
cargo uninstall anchor-cli

# 2. 更新 Rust 工具链
rustup update stable
rustup default stable

# 3. 更新 Cargo（如果可能）
# 注意：可能需要从源码编译 Cargo

# 4. 重新安装 Anchor
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked --force

# 5. 验证版本
anchor --version
cargo --version  # 应该 >= 1.85.0
```

---

### 方案 3: 使用 AVM (Anchor Version Manager)

**步骤**:
```bash
# 1. 安装 AVM
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# 2. 安装 Anchor 0.30.1（如果支持更新的 Cargo）
avm install 0.30.1
avm use 0.30.1

# 3. 验证
anchor --version
```

---

### 方案 4: 使用 Solana build-sbf（绕过 Anchor）

**步骤**:
```bash
# 1. 安装 Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# 2. 为每个程序单独构建
cd contracts/solana

for program in programs/*/; do
    cd "$program"
    cargo build-sbf
    cd ../..
done
```

**注意**: 需要手动处理 IDL 生成和部署脚本。

---

### 方案 5: 锁定依赖版本（临时方案）

**步骤**:
```bash
# 1. 在 Cargo.toml 中锁定 blake3 版本
# 编辑 contracts/solana/Cargo.toml 或各程序的 Cargo.toml

[dependencies]
blake3 = "1.7.0"  # 使用旧版本，不需要 edition2024
```

**注意**: 这可能导致其他依赖不兼容。

---

## 📊 方案对比

| 方案 | 难度 | 可靠性 | 推荐度 |
|------|------|--------|--------|
| **Docker** | ⭐ 简单 | ⭐⭐⭐⭐⭐ | ✅ **最推荐** |
| **手动更新** | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐ | ⚠️ 可能复杂 |
| **AVM** | ⭐⭐ 简单 | ⭐⭐⭐ | ✅ 推荐 |
| **build-sbf** | ⭐⭐⭐⭐ 复杂 | ⭐⭐⭐ | ⚠️ 需要额外工作 |
| **锁定版本** | ⭐ 简单 | ⭐⭐ | ❌ 不推荐 |

---

## ✅ 推荐行动

### 立即执行（推荐）

**使用 Docker 构建**:
```bash
cd contracts/solana
docker run --rm -v $(pwd):/workspace \
  -w /workspace \
  solanalabs/solana:latest \
  anchor build
```

**优点**:
- ✅ 无需修改系统配置
- ✅ 环境完全隔离
- ✅ 版本匹配
- ✅ 可重复构建

---

## 📋 验证步骤

构建成功后，验证：

```bash
# 1. 检查构建产物
ls -la target/deploy/*.so

# 2. 检查程序 keypair
ls -la target/deploy/*-keypair.json

# 3. 运行测试
anchor test
```

---

## 🔍 当前状态

- ✅ **代码完成度**: 100%
- ⚠️ **编译状态**: 需要解决 Cargo 版本问题
- ⏳ **测试状态**: 等待编译成功
- ⏳ **部署状态**: 等待编译成功

---

## 📝 后续步骤

1. **解决编译问题** → 使用 Docker 或更新 Cargo
2. **编译所有合约** → `anchor build`
3. **运行测试** → `anchor test`
4. **部署到 Devnet** → `anchor deploy --provider.cluster devnet`

---

*最后更新: 2026年1月15日*  
*问题状态: ⚠️ 待解决*
