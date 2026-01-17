# 工具链更新总结

## 更新日期
2024年

## 更新内容

### 1. Solana/Anchor 工具链

#### 更新前
- 工作区 Anchor 版本：0.30.1
- 各程序 Anchor 版本：0.29.0（不一致）

#### 更新后
- **统一所有程序使用工作区依赖**：`anchor-lang = { workspace = true }`
- **工作区版本**：0.30.1
- **所有程序现在统一使用**：0.30.1

#### 更新的程序
- ✅ `multi-asset-staking`
- ✅ `popcow-token`
- ✅ `staking`
- ✅ `cowguard-insurance`
- ✅ `governance`
- ✅ `reputation-registry`
- ✅ `token-vesting`
- ✅ `yield-vault`
- ✅ `points-system`
- ✅ `referral-system`

#### 优势
1. **版本一致性**：所有程序使用相同的 Anchor 版本，避免兼容性问题
2. **工作区管理**：使用工作区依赖，便于统一管理版本
3. **易于维护**：只需在工作区 `Cargo.toml` 中更新版本

### 2. Solidity/Foundry 工具链

#### 更新前
- Foundry: `solc = "0.8.24"`
- Hardhat: `solidity version = "0.8.20"`

#### 更新后
- **Foundry**: `solc = "0.8.28"`
- **Hardhat**: `solidity version = "0.8.28"`

#### 优势
1. **统一版本**：Foundry 和 Hardhat 使用相同的 Solidity 版本
2. **安全修复**：0.8.28 包含重要的安全修复和性能改进
3. **新特性支持**：支持最新的 Solidity 特性

### 3. Node.js 依赖更新

#### Solana Web3.js
- **API**: `@solana/web3.js`: `^1.90.0` → `^1.98.4`
- **Web**: `@solana/web3.js`: `^1.98.4` (已是最新)

#### 优势
1. **性能改进**：新版本包含性能优化
2. **Bug 修复**：修复已知问题
3. **新功能**：支持最新的 Solana 功能

## 验证更新

### 1. 验证 Anchor 版本

```bash
cd contracts/solana
anchor --version  # 应该显示 0.30.1
cargo tree | grep anchor-lang  # 应该显示 0.30.1
```

### 2. 验证 Solidity 版本

```bash
cd contracts
forge --version  # 检查 Foundry 版本
solc --version  # 应该显示 0.8.28

cd evm
npx hardhat compile  # 应该使用 0.8.28 编译
```

### 3. 验证构建

```bash
# 构建 Solana 程序
cd contracts/solana
anchor build

# 构建 EVM 合约
cd contracts
forge build

# 构建 API
cd apps/api
npm install
npm run build

# 构建 Web
cd apps/web
npm install
npm run build
```

## 迁移指南

### 如果遇到编译错误

#### Anchor 0.29 → 0.30 迁移

主要变更：
1. **账户结构**：某些账户结构可能有变化
2. **错误处理**：错误类型可能有更新
3. **IDL 格式**：IDL 格式可能有变化

解决方案：
```bash
# 1. 清理旧的构建文件
cd contracts/solana
rm -rf target/
rm -rf .anchor/

# 2. 重新生成 IDL
anchor build

# 3. 更新前端 IDL 引用（如果有）
```

#### Solidity 0.8.20/0.8.24 → 0.8.28 迁移

主要变更：
1. **编译器警告**：可能有新的警告
2. **优化器**：优化器行为可能有变化

解决方案：
```bash
# 1. 清理旧的构建文件
cd contracts
forge clean

# 2. 重新编译
forge build

# 3. 检查警告
forge build --force
```

## 回滚方案

如果需要回滚到旧版本：

### Anchor
```bash
# 在工作区 Cargo.toml 中修改
[workspace.dependencies]
anchor-lang = "0.29.0"
anchor-spl = "0.29.0"

# 在各程序 Cargo.toml 中修改回
[dependencies]
anchor-lang = "0.29.0"
anchor-spl = "0.29.0"
```

### Solidity
```bash
# Foundry
solc = "0.8.24"

# Hardhat
version: "0.8.20"
```

## 最佳实践

### 1. 版本管理
- ✅ 使用工作区依赖管理 Anchor 版本
- ✅ 保持 Solidity 版本一致
- ✅ 定期检查依赖更新

### 2. 测试
- ✅ 更新后运行所有测试
- ✅ 检查编译警告
- ✅ 验证部署脚本

### 3. 文档
- ✅ 记录版本变更
- ✅ 更新部署文档
- ✅ 通知团队成员

## 下一步

1. **运行测试**：确保所有测试通过
2. **部署测试**：在测试网部署验证
3. **监控**：观察是否有运行时问题
4. **文档更新**：更新相关文档

## 注意事项

⚠️ **重要**：
- 更新工具链后，需要重新编译所有合约
- 部署到主网前，务必在测试网充分测试
- 如果使用 CI/CD，需要更新构建脚本
- 团队成员需要同步更新本地环境

## 相关文档

- [Anchor 0.30 发布说明](https://github.com/coral-xyz/anchor/releases)
- [Solidity 0.8.28 发布说明](https://github.com/ethereum/solidity/releases)
- [Solana Web3.js 更新日志](https://github.com/solana-labs/solana-web3.js/releases)
