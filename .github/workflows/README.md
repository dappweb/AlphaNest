# GitHub Actions 工作流

## 工作流说明

### 1. CI (ci.yml)
- **触发时机**: Pull Request 和 Push 到 main 分支
- **功能**: 
  - 代码检查 (Lint)
  - 类型检查 (TypeScript)
  - 构建验证

### 2. Deploy (deploy.yml)
- **触发时机**: Push 到 main 分支或手动触发
- **功能**:
  - 自动部署 API 到 Cloudflare Workers
  - 自动部署 Web 到 Cloudflare Pages

## 需要的 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

1. **CLOUDFLARE_API_TOKEN**
   - 获取方式: Cloudflare Dashboard → My Profile → API Tokens → Create Token
   - 权限: 需要 Workers 和 Pages 的编辑权限

2. **CLOUDFLARE_ACCOUNT_ID**
   - 获取方式: Cloudflare Dashboard → 右侧边栏可以看到 Account ID

3. **NEXT_PUBLIC_API_URL** (可选)
   - 默认值: `https://alphanest-api.dappweb.workers.dev`
   - 如果需要自定义 API URL，可以设置此 Secret

## 设置步骤

1. 进入 GitHub 仓库
2. 点击 Settings → Secrets and variables → Actions
3. 点击 New repository secret
4. 添加上述 Secrets

## 手动触发部署

如果需要手动触发部署：

1. 进入 GitHub 仓库的 Actions 标签页
2. 选择 "Deploy to Cloudflare" 工作流
3. 点击 "Run workflow"
4. 选择分支并运行

## 故障排查

### 部署失败

1. **检查 Secrets 是否正确配置**
   - 确保 `CLOUDFLARE_API_TOKEN` 有效
   - 确保 `CLOUDFLARE_ACCOUNT_ID` 正确

2. **检查 Cloudflare 资源**
   - 确保 Workers 和 Pages 项目已创建
   - 确保有足够的配额

3. **查看工作流日志**
   - 在 Actions 标签页查看详细错误信息

### API 部署失败

- 检查 `apps/api/wrangler.toml` 配置
- 确保 D1 数据库和 KV 命名空间已创建
- 检查环境变量是否正确设置

### Web 部署失败

- 检查 `apps/web/package.json` 中的构建脚本
- 确保 `NEXT_PUBLIC_API_URL` 环境变量已设置
- 检查构建输出目录是否正确
