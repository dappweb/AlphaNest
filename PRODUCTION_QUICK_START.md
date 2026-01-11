# 生产环境快速启动指南

## 🚀 5 分钟快速检查

### 必需配置 (P0)

```bash
# 1. API Secrets (必需)
cd apps/api
wrangler secret put JWT_SECRET          # 生成: openssl rand -base64 32
wrangler secret put SOLANA_RPC_URL      # https://api.mainnet-beta.solana.com
wrangler secret put BASE_RPC_URL        # https://mainnet.base.org
wrangler secret put ETH_RPC_URL         # https://eth.llamarpc.com
wrangler secret put CONTRACT_ALPHANEST_CORE
wrangler secret put CONTRACT_REPUTATION_REGISTRY
wrangler secret put CONTRACT_ALPHAGUARD

# 2. 数据库迁移 (必需)
wrangler d1 migrations apply alphanest-db --remote

# 3. 部署 API
npm run deploy

# 4. 前端环境变量 (Cloudflare Pages Dashboard)
NEXT_PUBLIC_API_URL=https://alphanest-api.suiyiwan1.workers.dev
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ALPHAGUARD_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x...
```

### 推荐配置 (P1)

```bash
# API 密钥 (推荐)
wrangler secret put BITQUERY_API_KEY
wrangler secret put COVALENT_API_KEY
wrangler secret put ONE_INCH_API_KEY

# 限制 CORS
# 在 wrangler.toml 中修改: CORS_ORIGIN = "https://your-domain.com"
```

---

## ✅ 部署前检查清单

- [ ] 所有 Secrets 已配置 (`wrangler secret list`)
- [ ] 数据库迁移已执行
- [ ] 前端环境变量已配置
- [ ] CORS 已限制为生产域名
- [ ] 智能合约地址已更新
- [ ] 代码已编译通过

---

## 📊 状态检查

```bash
# 检查 API 健康
curl https://alphanest-api.suiyiwan1.workers.dev/

# 检查数据库表
wrangler d1 execute alphanest-db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"

# 查看日志
wrangler tail
```

---

## 🔗 相关文档

- [完整检查清单](./PRODUCTION_CHECKLIST.md)
- [详细部署指南](./DEPLOYMENT_GUIDE.md)
- [可行性分析报告](./PRODUCTION_FEASIBILITY_REPORT.md)
