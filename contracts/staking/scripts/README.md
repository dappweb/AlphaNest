# PopCowDefi 代币发行脚本

根据白皮书实现 PopCowDefi 代币在 Solana 链上的发行和分配。

## 📋 代币信息

- **代币名称**: PopCow Token
- **代币符号**: POPCOW
- **总供应量**: 1,000,000,000 (10亿)
- **小数位**: 9
- **代币标准**: SPL Token

## 📊 代币分配方案

根据白皮书，代币分配如下：

| 分配类别 | 比例 | 数量 | 释放规则 |
|---------|------|------|----------|
| **社区激励** | 40% | 4亿 | 5年线性释放 |
| **生态发展** | 20% | 2亿 | 2年锁仓，后3年线性释放 |
| **团队与顾问** | 15% | 1.5亿 | 1年锁仓 + 3年线性释放 |
| **早期投资者** | 10% | 1亿 | 6个月锁仓 + 2年线性释放 |
| **公开销售** | 10% | 1亿 | TGE 释放 50%，6个月内释放剩余 |
| **流动性储备** | 5% | 0.5亿 | TGE 全部释放 |

## 🚀 使用方法

### 1. 安装依赖

```bash
cd contracts/staking
npm install
# 或
yarn install
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
# Solana RPC 端点
SOLANA_RPC_URL=https://api.devnet.solana.com  # 或 mainnet-beta

# 钱包路径
WALLET_PATH=~/.config/solana/id.json
```

### 3. 运行发行脚本

```bash
# 使用 TypeScript
npx ts-node scripts/deploy-popcow-token.ts

# 或使用 Node.js (需要先编译)
npm run build
node dist/scripts/deploy-popcow-token.js
```

### 4. 脚本执行流程

1. **创建代币 Mint**: 生成新的 SPL Token
2. **创建分配池**: 为每个分配类别生成接收地址
3. **分配代币**: 根据分配方案铸造代币到各个池
4. **验证供应量**: 确认总供应量正确
5. **保存信息**: 将部署信息保存到 `popcow-token-deployment.json`

## 📁 输出文件

脚本执行后会生成 `popcow-token-deployment.json`，包含：

- 代币信息（Mint 地址、总供应量等）
- 各分配池地址和配置
- Vesting 参数
- 部署时间戳

## ⚠️ 重要提示

1. **私钥安全**: 
   - 请安全保存 Mint 私钥（脚本会输出 Base64 格式）
   - 建议使用硬件钱包或多签钱包管理分配池

2. **权限管理**:
   - 考虑放弃 Mint Authority（如果不需要后续铸造）
   - 考虑放弃 Freeze Authority（如果不需要冻结功能）

3. **生产环境**:
   - 在测试网充分测试后再部署到主网
   - 分配池地址应使用多签钱包
   - 建议使用专业的托管服务管理 Vesting

4. **Vesting 管理**:
   - 当前脚本将代币分配到各个池地址
   - 实际 Vesting 释放需要使用 Vesting 程序
   - 可以手动管理或使用自动化脚本定期释放

## 🔧 后续步骤

1. **部署 Vesting 程序**: 使用 `token-vesting` 程序管理锁仓释放
2. **设置多签钱包**: 将分配池地址更新为多签钱包
3. **配置自动化**: 设置定期释放脚本或使用链上程序
4. **添加流动性**: 将流动性池代币添加到 DEX

## 📚 相关文档

- [白皮书](./PopCow-Whitepaper.md)
- [代币经济学](./docs/TOKENOMICS.md)
- [Solana 部署计划](./docs/SOLANA_DEPLOYMENT_PLAN.md)

## 🐛 故障排除

### 余额不足
```
Error: Insufficient funds
```
解决: 确保钱包有足够的 SOL（建议至少 2 SOL）

### 网络连接问题
```
Error: Failed to connect
```
解决: 检查 RPC 端点是否可访问，或更换其他 RPC 端点

### 权限错误
```
Error: Unauthorized
```
解决: 确保使用正确的钱包私钥文件

## 📞 支持

如有问题，请联系开发团队或查看项目文档。
