# AlphaNest 部署指南

## Cloudflare 部署步骤

### 前置要求

1. Cloudflare 账户 (Pro 或更高版本推荐)
2. 已配置的域名 (alphanest.dev)
3. Node.js 18+ 和 pnpm

### 1. 创建 Cloudflare 资源

```bash
# 登录 Cloudflare
npx wrangler login

# 创建 D1 数据库
npx wrangler d1 create alphanest-production
npx wrangler d1 create alphanest-dev

# 创建 KV 命名空间
npx wrangler kv:namespace create CACHE
npx wrangler kv:namespace create SESSIONS
npx wrangler kv:namespace create RATE_LIMIT

# 创建 R2 存储桶
npx wrangler r2 bucket create alphanest-assets

# 创建 Queue
npx wrangler queues create alphanest-tasks
npx wrangler queues create alphanest-notifications
```

### 2. 配置环境变量

在 Cloudflare Dashboard 中添加 Secrets:

```bash
# 或使用 CLI
npx wrangler secret put JWT_SECRET
npx wrangler secret put SOLANA_RPC_URL
npx wrangler secret put BASE_RPC_URL
npx wrangler secret put BITQUERY_API_KEY
npx wrangler secret put COVALENT_API_KEY
```

### 3. 初始化数据库

```bash
# 应用数据库迁移
cd apps/api
npx wrangler d1 execute alphanest-production --file=../../infrastructure/database/migrations/001_init.sql
```

### 4. 部署 API (Workers)

```bash
cd apps/api
pnpm install
pnpm build
npx wrangler deploy
```

### 5. 部署前端 (Pages)

```bash
cd apps/web
pnpm install
pnpm build

# 使用 next-on-pages 适配器
npx @cloudflare/next-on-pages

# 部署到 Pages
npx wrangler pages deploy .vercel/output/static --project-name=alphanest
```

### 6. 配置 DNS

在 Cloudflare DNS 中添加:

| 类型 | 名称 | 内容 |
|-----|-----|-----|
| CNAME | @ | alphanest.pages.dev |
| CNAME | api | alphanest-api.workers.dev |
| CNAME | assets | alphanest-assets.r2.dev |

### 7. 配置定时任务 (Cron Triggers)

在 `wrangler.toml` 中添加:

```toml
[triggers]
crons = [
  "*/5 * * * *",  # 每5分钟更新热门代币
  "0 * * * *",    # 每小时更新 Dev 评分
  "0 0 * * *"     # 每天清理过期数据
]
```

### 8. 验证部署

```bash
# 检查 API 健康状态
curl https://api.alphanest.dev/health

# 检查前端
curl https://alphanest.dev
```

---

## 监控与告警

### Cloudflare Analytics

- 在 Dashboard 中启用 Workers Analytics
- 配置 Real User Monitoring (RUM)

### 日志

```bash
# 实时查看 Workers 日志
npx wrangler tail alphanest-api

# 查看特定时间段日志
npx wrangler tail alphanest-api --since 2h
```

### 告警配置

在 Cloudflare Notifications 中配置:

- Workers 错误率 > 1%
- 响应时间 > 500ms
- D1 数据库存储 > 80%

---

## 回滚流程

```bash
# 查看部署历史
npx wrangler deployments list

# 回滚到指定版本
npx wrangler rollback --version <version-id>
```

---

## 成本估算

| 服务 | 免费额度 | 预估月费用 |
|-----|---------|----------|
| Workers | 10万次/天 | $5-50 |
| D1 | 5GB 存储 | $0.75/GB |
| KV | 10万次/天 | $0.50/百万次 |
| R2 | 10GB 存储 | $0.015/GB |
| Pages | 无限制 | 免费 |

**预估总费用**: $20-100/月 (视流量而定)
