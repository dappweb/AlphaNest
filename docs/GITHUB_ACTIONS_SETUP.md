# GitHub Actions 自动部署设置指南

## ✅ 已完成

已创建 GitHub Actions 工作流文件：
- `.github/workflows/deploy.yml` - 自动部署到 Cloudflare
- `.github/workflows/ci.yml` - CI 检查和构建验证

## ⚠️ 需要配置

要让自动部署工作，需要在 GitHub 仓库中配置以下 Secrets：

### 1. 获取 Cloudflare API Token

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击右上角头像 → **My Profile**
3. 选择 **API Tokens** 标签页
4. 点击 **Create Token**
5. 使用 **Edit Cloudflare Workers** 模板，或自定义权限：
   - **Account** → **Cloudflare Workers** → **Edit**
   - **Account** → **Cloudflare Pages** → **Edit**
6. 复制生成的 Token

### 2. 获取 Cloudflare Account ID

1. 在 Cloudflare Dashboard 右侧边栏可以看到 **Account ID**
2. 复制这个 ID

### 3. 在 GitHub 中配置 Secrets

1. 进入 GitHub 仓库：`https://github.com/dappweb/AlphaNest`
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**，添加以下 Secrets：

#### 必需的 Secrets

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token | `your_api_token_here` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID | `your_account_id_here` |

#### 可选的 Secrets

| Secret 名称 | 说明 | 默认值 |
|------------|------|--------|
| `NEXT_PUBLIC_API_URL` | 前端 API URL | `https://alphanest-api.dappweb.workers.dev` |

### 4. 验证配置

配置完成后：

1. 推送任何更改到 `main` 分支
2. 进入 GitHub 仓库的 **Actions** 标签页
3. 应该看到工作流自动运行
4. 查看部署日志确认是否成功

## 🔄 工作流说明

### CI 工作流 (ci.yml)
- **触发时机**: Pull Request 和 Push 到 main
- **功能**: 
  - 代码检查 (Lint)
  - TypeScript 类型检查
  - 构建验证

### 部署工作流 (deploy.yml)
- **触发时机**: Push 到 main 分支
- **功能**:
  - 自动部署 API 到 Cloudflare Workers
  - 自动部署 Web 到 Cloudflare Pages

## 🚀 手动触发部署

如果需要手动触发部署：

1. 进入 GitHub 仓库 → **Actions** 标签页
2. 选择 **Deploy to Cloudflare** 工作流
3. 点击 **Run workflow**
4. 选择分支（通常是 `main`）
5. 点击 **Run workflow**

## 🔍 故障排查

### 问题：工作流没有运行

**可能原因**：
- Secrets 未配置
- 工作流文件语法错误

**解决方案**：
1. 检查 GitHub Actions 是否启用（Settings → Actions → General）
2. 检查 Secrets 是否正确配置
3. 查看 Actions 标签页是否有错误信息

### 问题：部署失败 - API Token 无效

**错误信息**：
```
Error: Invalid API Token
```

**解决方案**：
1. 检查 `CLOUDFLARE_API_TOKEN` 是否正确
2. 确认 Token 有足够的权限（Workers 和 Pages 编辑权限）
3. 重新生成 Token 并更新 Secret

### 问题：部署失败 - Account ID 错误

**错误信息**：
```
Error: Invalid Account ID
```

**解决方案**：
1. 检查 `CLOUDFLARE_ACCOUNT_ID` 是否正确
2. 确认 Account ID 来自正确的 Cloudflare 账户

### 问题：API 部署失败

**可能原因**：
- D1 数据库未创建
- KV 命名空间未创建
- wrangler.toml 配置错误

**解决方案**：
1. 检查 `apps/api/wrangler.toml` 配置
2. 确保所有资源已在 Cloudflare 中创建
3. 查看工作流日志获取详细错误信息

### 问题：Web 部署失败

**可能原因**：
- 构建失败
- Pages 项目未创建
- 环境变量未设置

**解决方案**：
1. 检查 `apps/web/package.json` 中的构建脚本
2. 确保 `NEXT_PUBLIC_API_URL` 已设置（如果需要）
3. 查看构建日志获取详细错误信息

## 📝 下一步

配置完成后：

1. ✅ 推送代码到 `main` 分支
2. ✅ 检查 GitHub Actions 是否自动运行
3. ✅ 验证部署是否成功
4. ✅ 测试 API 和 Web 应用是否正常工作

## 🔗 相关文档

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
