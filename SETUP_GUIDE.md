# AlphaNest 完整配置指南

## 📋 配置清单

| 配置项 | 状态 | 说明 |
|--------|------|------|
| Web 部署 | ✅ | https://alphanest-web-9w8.pages.dev |
| API 部署 | ✅ | https://alphanest-api.suiyiwan1.workers.dev |
| D1 数据库 | ✅ | alphanest-db |
| KV 缓存 | ✅ | CACHE/SESSIONS/RATE_LIMIT |
| 智能合约 | ⏳ | 需要私钥部署 |
| WalletConnect | ⏳ | 需要 Project ID |
| API Secrets | ⏳ | 可选配置 |

---

## 1️⃣ 智能合约部署 (Sepolia)

### 前置条件
- Foundry 已安装 ✅
- 有 Sepolia 测试网 ETH

### 获取测试 ETH
- https://sepoliafaucet.com
- https://www.alchemy.com/faucets/ethereum-sepolia

### 获取 RPC URL
1. 注册 [Alchemy](https://dashboard.alchemy.com)
2. 创建 App，选择 Ethereum Sepolia
3. 复制 API URL

### 部署命令

```bash
# 设置环境变量
export PRIVATE_KEY="你的私钥(不带0x前缀)"
export SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/你的API_KEY"

# 部署
cd /home/zyj_dev/AlphaNest/contracts
forge script script/Deploy.s.sol:DeployAllSepolia \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  -vvvv
```

### 保存合约地址
部署成功后，记录以下地址：
- AlphaToken
- AlphaNestCore
- ReputationRegistry
- AlphaGuard
- MockUSDC

---

## 2️⃣ WalletConnect 配置

### 获取 Project ID
1. 访问 https://cloud.walletconnect.com
2. 登录/注册账号
3. 创建新项目 "AlphaNest"
4. 复制 Project ID

### 配置方法

**方法 A: Cloudflare Pages 环境变量 (推荐)**

```bash
# 使用 wrangler 设置
cd /home/zyj_dev/AlphaNest/apps/web
npx wrangler pages secret put NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID --project-name alphanest-web
# 输入你的 Project ID
```

或者在 Cloudflare Dashboard:
1. 登录 https://dash.cloudflare.com
2. Pages > alphanest-web > Settings > Environment variables
3. 添加变量

**方法 B: 直接修改代码**

```typescript
// apps/web/src/config/wagmi.ts
export const wagmiConfig = getDefaultConfig({
  projectId: '你的Project_ID',  // 直接填写
  // ...
});
```

---

## 3️⃣ API Secrets 配置 (可选)

### Bitquery API (链上数据)
1. 注册: https://graphql.bitquery.io/user/register
2. 获取 API Key
3. 配置:

```bash
cd /home/zyj_dev/AlphaNest/apps/api
npx wrangler secret put BITQUERY_API_KEY
# 输入 API Key
```

### Telegram Bot Token (通知)
1. 在 Telegram 找 @BotFather
2. 发送 /newbot 创建 Bot
3. 复制 Token
4. 配置:

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
```

### Discord Webhook (通知)
1. Discord 服务器设置 > 整合 > Webhook
2. 创建 Webhook，复制 URL
3. 配置:

```bash
npx wrangler secret put DISCORD_WEBHOOK_URL
```

---

## 4️⃣ 更新前端合约地址

部署合约后，更新前端配置：

### 方法 A: Cloudflare Pages 环境变量

```bash
cd /home/zyj_dev/AlphaNest/apps/web

# 设置合约地址
npx wrangler pages secret put NEXT_PUBLIC_ALPHAGUARD_ADDRESS --project-name alphanest-web
npx wrangler pages secret put NEXT_PUBLIC_ALPHANEST_CORE_ADDRESS --project-name alphanest-web
npx wrangler pages secret put NEXT_PUBLIC_USDC_ADDRESS --project-name alphanest-web
```

### 方法 B: 修改代码

```typescript
// apps/web/src/hooks/use-alphaguard.ts
const ALPHAGUARD_ADDRESS = '0x你的合约地址' as `0x${string}`;
const USDC_ADDRESS = '0x你的USDC地址' as `0x${string}`;

// apps/web/src/hooks/use-alphanest-core.ts
const CONTRACT_ADDRESS = '0x你的合约地址' as `0x${string}`;
```

重新构建并部署:

```bash
cd /home/zyj_dev/AlphaNest/apps/web
npm run build
npx wrangler pages deploy out --project-name alphanest-web --commit-dirty=true
```

---

## 🔧 快速检查命令

```bash
# 检查 API 状态
curl https://alphanest-api.suiyiwan1.workers.dev/health

# 检查 Foundry
forge --version

# 检查 wrangler
npx wrangler whoami

# 查看已配置的 Secrets
cd /home/zyj_dev/AlphaNest/apps/api
npx wrangler secret list
```

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. 错误信息截图
2. 执行的命令
3. 当前步骤

---

**最后更新**: 2026-01-11
