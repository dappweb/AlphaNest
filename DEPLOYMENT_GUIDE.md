# AlphaNest 生产环境部署指南

## 📦 快速部署

### 前置要求

1. **Cloudflare 账户**
   - 注册: https://dash.cloudflare.com/sign-up
   - 验证邮箱和支付方式

2. **Node.js 和 npm**
   - Node.js >= 18.x
   - npm >= 9.x

3. **Wrangler CLI**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

4. **API 密钥**
   - WalletConnect Project ID: https://cloud.walletconnect.com/
   - Bitquery API Key: https://bitquery.io/
   - Covalent API Key: https://www.covalenthq.com/
   - 1inch API Key: https://1inch.io/

---

## 🚀 部署步骤

### 步骤 1: 配置 API 环境变量

```bash
cd apps/api

# 生成并设置 JWT 密钥
openssl rand -base64 32 | wrangler secret put JWT_SECRET

# 设置 RPC 节点 URL
wrangler secret put SOLANA_RPC_URL
# 输入: https://api.mainnet-beta.solana.com (或使用付费 RPC)

wrangler secret put BASE_RPC_URL
# 输入: https://mainnet.base.org (或使用 Alchemy/Infura)

wrangler secret put ETH_RPC_URL
# 输入: https://eth.llamarpc.com (或使用 Alchemy/Infura)

# 设置 API 密钥
wrangler secret put BITQUERY_API_KEY
wrangler secret put COVALENT_API_KEY
wrangler secret put DEXSCREENER_API_KEY  # 可选，免费使用
wrangler secret put ONE_INCH_API_KEY

# 设置智能合约地址
wrangler secret put CONTRACT_ALPHANEST_CORE
wrangler secret put CONTRACT_REPUTATION_REGISTRY
wrangler secret put CONTRACT_ALPHAGUARD

# 可选: 通知服务
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put DISCORD_WEBHOOK_URL
```

### 步骤 2: 运行数据库迁移

```bash
cd apps/api

# 检查迁移文件
ls migrations/

# 应用迁移到生产环境
wrangler d1 migrations apply alphanest-db --remote

# 验证迁移
wrangler d1 execute alphanest-db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

### 步骤 3: 部署 API

```bash
cd apps/api

# 类型检查
npm run typecheck

# 部署到生产环境
npm run deploy

# 验证部署
curl https://alphanest-api.suiyiwan1.workers.dev/
```

### 步骤 4: 配置前端环境变量

在 Cloudflare Pages Dashboard:

1. 进入项目设置
2. Settings > Environment Variables
3. 添加以下变量:

```
NEXT_PUBLIC_API_URL=https://alphanest-api.suiyiwan1.workers.dev
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ALPHAGUARD_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS_BASE=0x...
NEXT_PUBLIC_USDC_ADDRESS_SEPOLIA=0x...
```

### 步骤 5: 部署前端

#### 方式 1: 使用 Cloudflare Pages Dashboard

1. 登录 Cloudflare Dashboard
2. 进入 Pages
3. 创建新项目
4. 连接 Git 仓库
5. 配置:
   - Framework preset: Next.js
   - Build command: `cd apps/web && npm install && npm run pages:build`
   - Build output directory: `apps/web/.vercel/output/static`
   - Root directory: `/`

#### 方式 2: 使用 Wrangler CLI

```bash
cd apps/web

# 安装依赖
npm install

# 构建
npm run pages:build

# 部署
npm run pages:deploy
```

---

## ✅ 部署后验证

### API 健康检查

```bash
# 基础健康检查
curl https://alphanest-api.suiyiwan1.workers.dev/

# 测试端点
curl https://alphanest-api.suiyiwan1.workers.dev/api/v1/analytics/platform
```

### 前端验证

1. 访问部署的 URL
2. 检查控制台无错误
3. 测试钱包连接
4. 测试核心功能

### 数据库验证

```bash
# 检查表结构
wrangler d1 execute alphanest-db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"

# 检查数据
wrangler d1 execute alphanest-db --remote --command "SELECT COUNT(*) FROM users;"
```

---

## 🔧 故障排查

### API 部署失败

**问题**: `Error: No environment found`
```bash
# 检查 wrangler.toml 配置
# 确保 account_id 已设置
wrangler whoami
```

**问题**: `KV namespace not found`
```bash
# 创建缺失的 KV 命名空间
wrangler kv namespace create CACHE
wrangler kv namespace create SESSIONS
wrangler kv namespace create RATE_LIMIT

# 更新 wrangler.toml 中的 ID
```

**问题**: `D1 database not found`
```bash
# 创建数据库
wrangler d1 create alphanest-db

# 更新 wrangler.toml 中的 database_id
```

### 前端构建失败

**问题**: `Module not found`
```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

**问题**: `Environment variable not found`
- 检查 Cloudflare Pages 环境变量配置
- 确保变量名以 `NEXT_PUBLIC_` 开头

### 数据库迁移失败

**问题**: `Migration failed`
```bash
# 检查迁移文件语法
wrangler d1 migrations apply alphanest-db --remote --dry-run

# 手动执行 SQL
wrangler d1 execute alphanest-db --remote --file=migrations/0002_traders_and_copy_trades.sql
```

---

## 📊 监控和维护

### 查看日志

```bash
# API 实时日志
cd apps/api
wrangler tail

# 过滤错误
wrangler tail --format=pretty | grep ERROR
```

### 性能监控

1. Cloudflare Dashboard > Workers & Pages
2. 查看请求数、错误率、响应时间
3. 设置告警阈值

### 数据库维护

```bash
# 备份数据库
wrangler d1 export alphanest-db --output=backup-$(date +%Y%m%d).sql

# 查看数据库大小
wrangler d1 execute alphanest-db --remote --command "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();"
```

---

## 🔄 更新部署

### API 更新

```bash
cd apps/api

# 1. 拉取最新代码
git pull

# 2. 运行新的迁移 (如果有)
npm run db:migrate

# 3. 重新部署
npm run deploy
```

### 前端更新

```bash
cd apps/web

# 1. 拉取最新代码
git pull

# 2. 重新构建和部署
npm run pages:build
npm run pages:deploy
```

---

## 🛡️ 安全最佳实践

1. **密钥管理**
   - 使用 `wrangler secret put` 而不是环境变量文件
   - 定期轮换密钥
   - 使用强随机密钥

2. **CORS 配置**
   - 生产环境限制为特定域名
   - 移除 `CORS_ORIGIN = "*"`

3. **Rate Limiting**
   - 根据实际流量调整限制
   - 监控异常请求

4. **数据库安全**
   - 定期备份
   - 限制访问权限
   - 使用参数化查询 (已实现)

---

## 📞 支持

如遇问题，请检查:
1. [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - 完整检查清单
2. [SETUP_GUIDE.md](./SETUP_GUIDE.md) - 初始设置指南
3. Cloudflare 文档
4. 项目 Issues

---

**最后更新**: 2026-01-11
