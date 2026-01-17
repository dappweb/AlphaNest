# Cloudflare Pages 部署指南

## 前提条件

1. **Cloudflare 账号**: 需要一个 Cloudflare 账号
2. **Wrangler CLI**: 已安装（项目中已包含）
3. **环境变量**: 配置必要的环境变量

## 部署步骤

### 1. 登录 Cloudflare

```bash
npx wrangler login
```

这将打开浏览器，让你授权 Wrangler 访问你的 Cloudflare 账号。

### 2. 配置环境变量

在 Cloudflare Pages 项目设置中添加以下环境变量：

**生产环境变量**:
```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_API_URL=https://api.popcow.io
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_ALPHANEST_CORE_ADDRESS=0x0DE761C3A2e72BFa04B660395856ADc0A1252879
NEXT_PUBLIC_ALPHAGUARD_ADDRESS=0xCbcE6832F5E59F90c24bFb57Fb6f1Bc8B4232f03
NEXT_PUBLIC_USDC_ADDRESS=0xceCC6D1dA322b6AC060D3998CA58e077CB679F79
```

**可选环境变量**:
```
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project
```

### 3. 构建项目

```bash
cd apps/web
npm run build
```

这将创建静态导出到 `out` 目录。

### 4. 部署到 Cloudflare Pages

#### 方法 1: 使用 Wrangler CLI（推荐）

```bash
# 部署到生产环境
npm run pages:deploy

# 或者手动部署
npx wrangler pages deploy out --project-name=popcow-platform
```

#### 方法 2: 通过 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** 部分
3. 点击 **Create a project**
4. 选择 **Connect to Git** 或 **Direct Upload**
5. 如果选择 Direct Upload，上传 `out` 目录

### 5. 配置自定义域名（可选）

1. 在 Cloudflare Pages 项目设置中
2. 进入 **Custom domains**
3. 添加你的域名（例如：popcow.io）
4. 按照提示配置 DNS 记录

## 自动化部署（CI/CD）

### GitHub Actions

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main
      - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd apps/web
          npm ci
      
      - name: Build
        run: |
          cd apps/web
          npm run build
        env:
          NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: ${{ secrets.WALLET_CONNECT_PROJECT_ID }}
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
          NEXT_PUBLIC_ENVIRONMENT: production
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: popcow-platform
          directory: apps/web/out
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### 配置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：
- `CLOUDFLARE_API_TOKEN`: Cloudflare API Token
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account ID
- `WALLET_CONNECT_PROJECT_ID`: WalletConnect Project ID
- `API_URL`: API 地址

## 验证部署

部署完成后，访问以下 URL 验证：

1. **生产环境**: https://popcow-platform.pages.dev
2. **自定义域名**: https://popcow.io（如果已配置）

### 检查清单

- [ ] 页面正常加载
- [ ] 钱包连接功能正常
- [ ] API 调用正常
- [ ] 图片和资源加载正常
- [ ] 移动端显示正常
- [ ] 性能指标良好（Lighthouse > 90）

## 常见问题

### 1. 构建失败

**问题**: `npm run build` 失败

**解决方案**:
```bash
# 清理缓存
rm -rf .next out node_modules
npm install
npm run build
```

### 2. 环境变量未生效

**问题**: 环境变量在生产环境中未生效

**解决方案**:
- 确保在 Cloudflare Pages 项目设置中配置了环境变量
- 环境变量必须以 `NEXT_PUBLIC_` 开头才能在客户端使用
- 重新部署项目

### 3. 静态导出错误

**问题**: Next.js 静态导出失败

**解决方案**:
- 确保 `next.config.mjs` 中设置了 `output: 'export'`
- 确保没有使用服务端特性（如 API Routes、Server Actions）
- 确保图片使用了 `unoptimized: true`

### 4. 路由 404 错误

**问题**: 刷新页面时出现 404

**解决方案**:
- Cloudflare Pages 会自动处理 SPA 路由
- 确保 `trailingSlash: false` 在配置中
- 检查 `_headers` 和 `_redirects` 文件（如果有）

## 性能优化

### 1. 启用 Cloudflare CDN

Cloudflare Pages 自动启用全球 CDN，无需额外配置。

### 2. 配置缓存规则

在 Cloudflare Dashboard 中配置缓存规则：

```
Cache Level: Standard
Browser Cache TTL: 4 hours
Edge Cache TTL: 2 hours
```

### 3. 启用 Brotli 压缩

Cloudflare 自动启用 Brotli 压缩，无需配置。

### 4. 图片优化

使用 Cloudflare Images 或 R2 存储图片：

```typescript
// 使用 Cloudflare Images
<img src="https://imagedelivery.net/your-account/image-id/public" />
```

## 监控和分析

### 1. Cloudflare Web Analytics

在 Cloudflare Dashboard 中启用 Web Analytics：
- 进入 **Analytics & Logs** > **Web Analytics**
- 添加你的网站

### 2. Sentry 错误监控

已集成 Sentry，确保配置了 `NEXT_PUBLIC_SENTRY_DSN`。

### 3. 性能监控

使用 Cloudflare 的 Performance 标签查看：
- 页面加载时间
- 请求数量
- 带宽使用
- 错误率

## 回滚部署

如果需要回滚到之前的版本：

1. 在 Cloudflare Dashboard 中进入 Pages 项目
2. 进入 **Deployments** 标签
3. 找到之前的部署
4. 点击 **Rollback to this deployment**

## 支持和帮助

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Next.js 静态导出文档](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

---

**最后更新**: 2026-01-17
