# AlphaNest 生产环境可行性检查清单

## 📋 执行摘要

**状态**: ✅ 代码层面已准备就绪，需要完成配置和部署步骤

**关键发现**:
- ✅ 所有核心功能已实现并编译通过
- ✅ 数据库迁移脚本已准备
- ⚠️ 需要配置环境变量和密钥
- ⚠️ 需要运行数据库迁移
- ⚠️ 需要配置 Cloudflare 资源

---

## 1. 环境变量配置

### 1.1 API 环境变量 (Cloudflare Workers Secrets)

需要在 Cloudflare Dashboard 或使用 `wrangler secret put` 配置以下密钥：

#### 🔐 必需密钥 (Secrets)
```bash
# JWT 密钥 (用于用户认证)
wrangler secret put JWT_SECRET

# RPC 节点 URL
wrangler secret put SOLANA_RPC_URL
wrangler secret put BASE_RPC_URL
wrangler secret put ETH_RPC_URL

# API 密钥
wrangler secret put BITQUERY_API_KEY
wrangler secret put COVALENT_API_KEY
wrangler secret put DEXSCREENER_API_KEY

# 智能合约地址
wrangler secret put CONTRACT_ALPHANEST_CORE
wrangler secret put CONTRACT_REPUTATION_REGISTRY
wrangler secret put CONTRACT_ALPHAGUARD
```

#### 📝 可选密钥
```bash
# Telegram Bot (用于通知)
wrangler secret put TELEGRAM_BOT_TOKEN

# Discord Webhook (用于警报)
wrangler secret put DISCORD_WEBHOOK_URL

# 1inch API Key (用于 DEX 聚合)
wrangler secret put ONE_INCH_API_KEY
```

### 1.2 前端环境变量

在 Cloudflare Pages 环境变量中配置：

```bash
# API 端点
NEXT_PUBLIC_API_URL=https://alphanest-api.suiyiwan1.workers.dev

# WalletConnect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

# 智能合约地址
NEXT_PUBLIC_ALPHAGUARD_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS_BASE=0x...
NEXT_PUBLIC_USDC_ADDRESS_SEPOLIA=0x...
```

---

## 2. Cloudflare 资源配置

### 2.1 D1 数据库

✅ **已配置**: `alphanest-db` (ID: 6408074b-1989-40a9-a748-4124ffd297de)

**需要执行**:
```bash
cd apps/api
npm run db:migrate
```

**迁移文件**:
- ✅ `0002_traders_and_copy_trades.sql`
- ✅ `0003_referral_system.sql`
- ✅ `0004_notifications.sql`
- ✅ `0005_trading_bots.sql`

### 2.2 KV 命名空间

✅ **已配置**:
- `CACHE` (ID: 3ae92e8c9c74467695857507745d4f64)
- `SESSIONS` (ID: 55bd89b63daf4bacaf4dd6bf22720ca4)
- `RATE_LIMIT` (ID: 59b47b256b47499995ea884c40395058)

### 2.3 Durable Objects

✅ **已配置**: `WEBSOCKET_SERVER` (WebSocketServer class)

**需要确认**: Durable Objects 迁移已应用

### 2.4 R2 存储 (可选)

⚠️ **未配置**: 用于存储用户上传的资产

**如需启用**:
```bash
wrangler r2 bucket create alphanest-assets
```

然后在 `wrangler.toml` 中取消注释 R2 配置。

### 2.5 Queues (可选)

⚠️ **未配置**: 用于异步任务处理

**如需启用**:
```bash
wrangler queues create alphanest-tasks
wrangler queues create alphanest-notifications
wrangler queues create alphanest-dlq
```

---

## 3. 数据库迁移检查

### 3.1 迁移状态

需要检查以下表是否存在：

```sql
-- 核心表
✓ users
✓ user_chains
✓ points_history
✓ devs
✓ tokens
✓ dev_subscriptions

-- 新增表 (需要迁移)
✓ traders
✓ copy_trades
✓ referrals
✓ referral_records
✓ notifications
✓ bots
```

### 3.2 迁移执行

```bash
# 生产环境
cd apps/api
wrangler d1 migrations apply alphanest-db --remote

# 验证迁移
wrangler d1 execute alphanest-db --command "SELECT name FROM sqlite_master WHERE type='table';"
```

---

## 4. 安全配置检查

### 4.1 CORS 配置

✅ **当前配置**: `CORS_ORIGIN = "*"` (允许所有来源)

⚠️ **生产环境建议**: 限制为特定域名
```toml
CORS_ORIGIN = "https://alphanest-web-9w8.pages.dev"
```

### 4.2 Rate Limiting

✅ **已配置**: 
- 100 请求/分钟
- 使用 KV 存储计数器

### 4.3 地理围栏

✅ **已启用**: `geoBlockMiddleware()` 中间件

需要配置受限地区列表。

### 4.4 JWT 密钥

⚠️ **必须配置**: 使用强随机密钥
```bash
# 生成安全密钥
openssl rand -base64 32 | wrangler secret put JWT_SECRET
```

---

## 5. 智能合约部署状态

### 5.1 合约地址

需要确认以下合约已部署：

- ✅ AlphaGuard (Sepolia): `0x...`
- ✅ AlphaNestCore (Sepolia): `0x...`
- ✅ ReputationRegistry (Sepolia): `0x...`
- ✅ MockUSDC (Sepolia): `0x...`

### 5.2 主网部署

⚠️ **待部署**: 主网合约地址需要更新

---

## 6. 前端部署检查

### 6.1 构建配置

✅ **已优化**:
- 静态导出 (`output: 'export'`)
- 移除生产环境 console
- 图片优化
- Webpack 优化

### 6.2 Cloudflare Pages 配置

**需要配置**:
- 构建命令: `npm run pages:build`
- 输出目录: `.vercel/output/static`
- 环境变量: 见 1.2 节

### 6.3 域名配置

⚠️ **待配置**: 自定义域名和 SSL 证书

---

## 7. 外部服务依赖

### 7.1 必需服务

| 服务 | 状态 | 用途 |
|------|------|------|
| DexScreener API | ✅ 免费 | 代币价格和 K 线数据 |
| Bitquery API | ⚠️ 需要密钥 | 链上数据分析 |
| Covalent API | ⚠️ 需要密钥 | 多链数据聚合 |
| 1inch API | ⚠️ 需要密钥 | DEX 聚合交易 |
| WalletConnect | ⚠️ 需要 Project ID | 钱包连接 |

### 7.2 可选服务

| 服务 | 状态 | 用途 |
|------|------|------|
| Telegram Bot | ⚠️ 可选 | 通知推送 |
| Discord Webhook | ⚠️ 可选 | 警报通知 |

---

## 8. 性能优化检查

### 8.1 API 优化

✅ **已实现**:
- KV 缓存 (30秒-5分钟)
- 请求去重
- 批量查询优化

### 8.2 前端优化

✅ **已实现**:
- 代码分割
- 懒加载
- 图片优化
- Tree shaking

### 8.3 数据库优化

⚠️ **建议添加**:
- 索引优化
- 查询优化
- 连接池 (D1 自动管理)

---

## 9. 监控和日志

### 9.1 日志配置

✅ **已配置**: 
- Hono logger
- 结构化日志

⚠️ **建议**: 集成 Cloudflare Analytics

### 9.2 错误追踪

⚠️ **待集成**: 
- Sentry 或类似服务
- 错误告警

### 9.3 性能监控

⚠️ **待配置**:
- Cloudflare Analytics
- Real User Monitoring (RUM)

---

## 10. 备份和恢复

### 10.1 数据库备份

⚠️ **需要配置**:
```bash
# 定期备份 D1 数据库
wrangler d1 export alphanest-db --output=backup.sql
```

### 10.2 KV 备份

⚠️ **需要配置**: KV 数据备份策略

---

## 11. 部署步骤

### 11.1 预部署检查

```bash
# 1. 检查代码编译
cd apps/web && npm run build
cd apps/api && npm run typecheck

# 2. 运行测试 (如果有)
npm test

# 3. 检查环境变量
wrangler secret list

# 4. 验证数据库迁移
wrangler d1 migrations list alphanest-db
```

### 11.2 API 部署

```bash
cd apps/api

# 1. 应用数据库迁移
npm run db:migrate

# 2. 部署到生产环境
npm run deploy

# 3. 验证部署
curl https://alphanest-api.suiyiwan1.workers.dev/
```

### 11.3 前端部署

```bash
cd apps/web

# 1. 构建
npm run pages:build

# 2. 部署到 Cloudflare Pages
npm run pages:deploy

# 或使用 Cloudflare Dashboard 自动部署
```

---

## 12. 风险评估

### 12.1 高风险项

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 环境变量未配置 | 🔴 高 | 使用检查清单逐一验证 |
| 数据库迁移未执行 | 🔴 高 | 部署前强制运行迁移 |
| JWT 密钥泄露 | 🔴 高 | 使用强密钥，定期轮换 |
| RPC 节点故障 | 🟡 中 | 配置多个 RPC 节点备用 |
| API 密钥限制 | 🟡 中 | 监控使用量，准备升级方案 |

### 12.2 中风险项

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 缓存失效 | 🟡 中 | 实现缓存预热和失效策略 |
| Rate Limit 过严 | 🟡 中 | 根据实际流量调整 |
| WebSocket 连接数限制 | 🟡 中 | 实现连接池和重连机制 |

---

## 13. 生产环境检查清单

### 部署前

- [ ] 所有环境变量已配置
- [ ] 数据库迁移已执行
- [ ] 智能合约地址已更新
- [ ] API 密钥已获取并配置
- [ ] CORS 配置已限制
- [ ] JWT 密钥已生成
- [ ] 代码已编译通过
- [ ] 测试已通过 (如果有)

### 部署中

- [ ] API 部署成功
- [ ] 前端部署成功
- [ ] 健康检查通过
- [ ] 数据库连接正常
- [ ] KV 存储正常
- [ ] WebSocket 连接正常

### 部署后

- [ ] 功能测试通过
- [ ] 性能测试通过
- [ ] 监控告警配置
- [ ] 备份策略已实施
- [ ] 文档已更新

---

## 14. 快速启动命令

```bash
# 完整部署流程
cd apps/api
wrangler secret put JWT_SECRET
wrangler secret put SOLANA_RPC_URL
wrangler secret put BASE_RPC_URL
wrangler secret put ETH_RPC_URL
wrangler secret put BITQUERY_API_KEY
wrangler secret put COVALENT_API_KEY
wrangler secret put DEXSCREENER_API_KEY
wrangler d1 migrations apply alphanest-db --remote
npm run deploy

cd ../web
npm run pages:build
npm run pages:deploy
```

---

## 15. 支持资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)
- [项目部署指南](./SETUP_GUIDE.md)

---

**最后更新**: 2026-01-11
**状态**: ✅ 准备就绪，等待配置和部署
