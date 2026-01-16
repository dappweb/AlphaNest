# 🚀 下一步操作指南

## ✅ 已完成的工作

### 1. 管理员登录安全功能
- ✅ 数据库迁移（管理员表、会话表、操作日志）
- ✅ 管理员认证中间件（JWT、角色、权限检查）
- ✅ 管理员 API 路由（登录、登出、权限管理）
- ✅ 智能合约管理员验证（从链上读取 authority）
- ✅ 前端管理员页面（钱包签名登录、权限验证）

### 2. 工具链更新
- ✅ 统一所有 Solana 程序使用 Anchor 0.30.1
- ✅ 更新 Solidity 编译器到 0.8.28
- ✅ 更新 Node.js 依赖版本

### 3. GitHub Actions 自动部署
- ✅ 生产环境部署工作流（main 分支）
- ✅ 开发环境部署工作流（develop/dev 分支）
- ✅ CI 检查工作流
- ✅ 自动配置脚本（一键设置）

---

## 🎯 立即执行的下一步

### 步骤 1: 配置 GitHub Actions Secrets（必需）

**方式 1: 使用一键设置脚本（推荐）**

```bash
./scripts/one-click-setup.sh
```

**方式 2: 手动配置**

1. 访问 GitHub 仓库：https://github.com/dappweb/AlphaNest
2. Settings → Secrets and variables → Actions
3. 添加以下 Secrets：
   - `CLOUDFLARE_API_TOKEN` - Cloudflare API Token
   - `CLOUDFLARE_ACCOUNT_ID` - Cloudflare Account ID
   - `NEXT_PUBLIC_API_URL` (可选) - API URL

**获取凭证：**
- Account ID: https://dash.cloudflare.com/ (右侧边栏)
- API Token: https://dash.cloudflare.com/profile/api-tokens (使用 "Edit Cloudflare Workers" 模板)

### 步骤 2: 测试自动部署

配置完成后，推送代码触发部署：

```bash
# 做一个小改动测试
echo "# Test deployment" >> README.md
git add README.md
git commit -m "test: trigger deployment"
git push origin main
```

**验证部署：**
- 查看 GitHub Actions: https://github.com/dappweb/AlphaNest/actions
- 或运行：`gh run watch` (如果安装了 GitHub CLI)

### 步骤 3: 运行数据库迁移

首次部署前，需要运行数据库迁移：

```bash
cd apps/api

# 应用迁移
npx wrangler d1 migrations apply alphanest-production

# 或使用本地数据库测试
npx wrangler d1 migrations apply alphanest-dev --local
```

**迁移文件：**
- `apps/api/migrations/0006_admin_system.sql` - 管理员系统表

### 步骤 4: 配置 Cloudflare 资源

确保以下资源已创建：

```bash
# 登录 Cloudflare
npx wrangler login

# 创建 D1 数据库（如果还没有）
npx wrangler d1 create alphanest-production

# 创建 KV 命名空间（如果还没有）
npx wrangler kv:namespace create CACHE
npx wrangler kv:namespace create SESSIONS
npx wrangler kv:namespace create RATE_LIMIT
```

### 步骤 5: 配置环境变量

#### API (Cloudflare Workers)

在 Cloudflare Dashboard 或使用 CLI 设置 Secrets：

```bash
# 设置 Secrets
npx wrangler secret put JWT_SECRET
npx wrangler secret put SOLANA_RPC_URL
npx wrangler secret put BASE_RPC_URL
npx wrangler secret put BITQUERY_API_KEY
npx wrangler secret put COVALENT_API_KEY
```

#### Web (Cloudflare Pages)

在 Cloudflare Pages 项目设置中配置环境变量：

- `NEXT_PUBLIC_API_URL` - API 端点
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` - WalletConnect 项目 ID
- `NEXT_PUBLIC_ENVIRONMENT` - 环境标识 (production)

---

## 📋 后续工作清单

### 优先级 P0 - 部署前必须完成

- [ ] **配置 GitHub Secrets** - 让自动部署工作
- [ ] **运行数据库迁移** - 创建管理员系统表
- [ ] **创建第一个管理员** - 在数据库中或通过合约
- [ ] **测试管理员登录** - 验证功能正常
- [ ] **验证自动部署** - 确保 GitHub Actions 正常工作

### 优先级 P1 - 上线前完成

- [ ] **完善前端管理界面** - 实现所有管理功能的 UI
- [ ] **合约集成测试** - 测试智能合约管理员验证
- [ ] **安全审计** - 检查管理员系统安全性
- [ ] **文档更新** - 更新部署和使用文档

### 优先级 P2 - 后续迭代

- [ ] **多签钱包支持** - 使用多签作为合约管理员
- [ ] **操作日志查看界面** - 前端查看管理员操作记录
- [ ] **权限细化** - 更细粒度的权限控制
- [ ] **监控告警** - 管理员操作监控

---

## 🔧 快速命令参考

### GitHub Actions

```bash
# 查看工作流状态
gh run list

# 手动触发部署
gh workflow run deploy.yml

# 查看最新运行日志
gh run watch

# 查看 Secrets
gh secret list
```

### Cloudflare

```bash
# 部署 API
cd apps/api
npx wrangler deploy

# 部署 Web
cd apps/web
npm run pages:build
npx wrangler pages deploy .vercel/output/static --project-name=alphanest

# 查看日志
npx wrangler tail

# 运行数据库迁移
npx wrangler d1 migrations apply alphanest-production
```

### 数据库

```bash
# 查看数据库
npx wrangler d1 execute alphanest-production --command "SELECT * FROM admins"

# 创建第一个管理员（示例）
npx wrangler d1 execute alphanest-production --command "
  INSERT INTO admins (id, user_id, wallet_address, role, permissions, is_active, created_at, updated_at)
  VALUES ('admin1', 'user1', 'YOUR_WALLET_ADDRESS', 'super_admin', '[]', 1, $(date +%s), $(date +%s))
"
```

---

## 📚 相关文档

- [自动配置指南](./docs/AUTO_SETUP_GUIDE.md) - 详细配置步骤
- [GitHub Actions 设置](./docs/GITHUB_ACTIONS_SETUP.md) - GitHub Actions 配置
- [管理员系统指南](./docs/CONTRACT_ADMIN_GUIDE.md) - 管理员功能说明
- [工具链更新](./docs/TOOLCHAIN_UPDATE.md) - 工具链更新说明
- [部署指南](./DEPLOYMENT_GUIDE.md) - 完整部署流程

---

## 🆘 需要帮助？

### 常见问题

**Q: GitHub Actions 没有触发？**
- 检查 Secrets 是否配置
- 检查工作流文件是否正确
- 查看 Actions 标签页的错误信息

**Q: 部署失败？**
- 检查 Cloudflare API Token 权限
- 检查 Account ID 是否正确
- 查看工作流日志获取详细错误

**Q: 管理员无法登录？**
- 检查数据库中是否有管理员记录
- 检查钱包地址是否正确
- 检查签名验证是否通过

### 获取支持

- 查看文档：`docs/` 目录
- 查看工作流日志：GitHub Actions 页面
- 检查 Cloudflare 日志：`npx wrangler tail`

---

**最后更新**: 2026-01-16
