# PopCowDefi 代币发行 - 快速开始

## 🚀 快速部署

### 1. 准备环境

```bash
# 确保已安装 Node.js 和 Solana CLI
node --version  # 需要 >= 16
solana --version

# 安装依赖
npm install @solana/web3.js @solana/spl-token
# 或
yarn add @solana/web3.js @solana/spl-token
```

### 2. 配置钱包

```bash
# 设置 Solana CLI 钱包（如果还没有）
solana-keygen new --outfile ~/.config/solana/id.json

# 检查余额（测试网）
solana airdrop 2  # 获取测试 SOL
solana balance
```

### 3. 设置环境变量

创建 `.env` 文件：

```bash
SOLANA_RPC_URL=https://api.devnet.solana.com
WALLET_PATH=~/.config/solana/id.json
```

### 4. 运行发行脚本

```bash
# 使用 ts-node
npx ts-node scripts/deploy-popcow-token.ts

# 或先编译
tsc scripts/deploy-popcow-token.ts --outDir dist --esModuleInterop
node dist/deploy-popcow-token.js
```

## 📋 脚本输出

脚本执行后会：

1. ✅ 创建代币 Mint
2. ✅ 生成分配池地址
3. ✅ 分配代币到各个池
4. ✅ 验证总供应量
5. ✅ 保存部署信息到 `popcow-token-deployment.json`

## 📊 代币分配结果

执行完成后，你会看到：

```
🎉 PopCowDefi 代币发行完成！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
代币 Mint: <MINT_ADDRESS>
总供应量: 1,000,000,000 tokens
小数位: 9
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 代币分配摘要:
  community   :  40% (400,000,000 tokens) -> <ADDRESS>
  ecosystem    :  20% (200,000,000 tokens) -> <ADDRESS>
  team         :  15% (150,000,000 tokens) -> <ADDRESS>
  investor     :  10% (100,000,000 tokens) -> <ADDRESS>
  public       :  10% (100,000,000 tokens) -> <ADDRESS>
  liquidity    :   5% ( 50,000,000 tokens) -> <ADDRESS>
```

## 🔑 重要信息

脚本会输出：

- **Mint 地址**: 代币的唯一标识
- **Mint 私钥**: Base64 格式（请安全保存！）
- **分配池地址**: 每个分配类别的接收地址
- **部署信息文件**: `popcow-token-deployment.json`

## ⚠️ 安全提示

1. **私钥管理**
   - 立即备份 Mint 私钥
   - 使用硬件钱包或多签钱包管理分配池
   - 不要将私钥提交到代码仓库

2. **权限管理**
   - 考虑放弃 Mint Authority（如果不需要后续铸造）
   - 考虑放弃 Freeze Authority（如果不需要冻结功能）

3. **生产环境**
   - 在测试网充分测试
   - 使用多签钱包作为分配池地址
   - 使用专业的托管服务管理 Vesting

## 🔄 后续步骤

### 1. 部署 Vesting 程序

```bash
cd contracts/solana
anchor build
anchor deploy --provider.cluster devnet
```

### 2. 初始化 Vesting 账户

为需要锁仓的分配池初始化 Vesting 账户（使用 Vesting 程序）。

### 3. 添加流动性

将流动性池的代币添加到 DEX（如 Raydium）。

### 4. 设置自动化释放

配置定期脚本或使用链上程序自动释放已解锁的代币。

## 📚 相关文档

- [完整 README](./README.md)
- [白皮书](../../PopCow-Whitepaper.md)
- [代币经济学](../../docs/TOKENOMICS.md)

## 🐛 常见问题

### Q: 余额不足错误
**A**: 确保钱包有足够的 SOL（建议至少 2 SOL）
```bash
solana airdrop 2  # 测试网
```

### Q: 网络连接失败
**A**: 检查 RPC 端点，或使用其他公共 RPC
```bash
# 使用 Helius
SOLANA_RPC_URL=https://rpc.helius.xyz/?api-key=YOUR_KEY
```

### Q: 权限错误
**A**: 确保使用正确的钱包文件路径
```bash
# 检查钱包地址
solana address
```

## 📞 需要帮助？

查看完整文档或联系开发团队。
