# 自动配置 GitHub Actions 指南

## 方法 1: 交互式配置脚本（推荐）

使用交互式脚本，按提示输入信息：

```bash
./scripts/setup-github-actions.sh
```

脚本会引导你：
1. 登录 GitHub CLI（如果未登录）
2. 输入 Cloudflare Account ID
3. 输入 Cloudflare API Token
4. 输入 API URL（可选）
5. 自动设置 GitHub Secrets

## 方法 2: 使用环境变量快速配置

如果你已经有 Cloudflare 凭证，可以使用环境变量快速配置：

```bash
# 设置环境变量
export CLOUDFLARE_ACCOUNT_ID="your_account_id"
export CLOUDFLARE_API_TOKEN="your_api_token"
export NEXT_PUBLIC_API_URL="https://alphanest-api.dappweb.workers.dev"  # 可选

# 运行快速配置脚本
./scripts/quick-setup-secrets.sh
```

## 前置要求

### 1. 安装 GitHub CLI

**macOS:**
```bash
brew install gh
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install gh

# 或从官网下载
# https://cli.github.com/
```

**Windows:**
```powershell
# 使用 Chocolatey
choco install gh

# 或从官网下载安装包
# https://cli.github.com/
```

### 2. 登录 GitHub CLI

```bash
gh auth login
```

按照提示选择：
- GitHub.com
- HTTPS
- 登录方式（浏览器或 token）

### 3. 获取 Cloudflare 凭证

#### Account ID
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 右侧边栏可以看到 **Account ID**

#### API Token
1. 访问 [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. 点击 **Create Token**
3. 使用 **Edit Cloudflare Workers** 模板
4. 或自定义权限：
   - Account → Cloudflare Workers → Edit
   - Account → Cloudflare Pages → Edit
5. 复制生成的 Token

## 验证配置

配置完成后，验证 Secrets 是否已设置：

```bash
gh secret list
```

应该看到：
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `NEXT_PUBLIC_API_URL` (如果设置了)

## 测试自动部署

### 方法 1: 推送代码触发

```bash
# 做一个小改动
echo "# Test" >> README.md
git add README.md
git commit -m "test: trigger deployment"
git push origin main
```

### 方法 2: 手动触发工作流

```bash
gh workflow run deploy.yml
```

### 查看部署状态

```bash
# 查看工作流运行状态
gh run list --workflow=deploy.yml

# 查看最新运行的日志
gh run watch
```

或在 GitHub 网页查看：
- 进入仓库 → Actions 标签页
- 查看 "Deploy to Cloudflare" 工作流

## 故障排查

### 问题：GitHub CLI 未安装

**解决方案：**
```bash
# macOS
brew install gh

# Linux
sudo apt install gh

# 或访问 https://cli.github.com/
```

### 问题：未登录 GitHub

**解决方案：**
```bash
gh auth login
```

### 问题：权限不足

**错误信息：**
```
Resource not accessible by integration
```

**解决方案：**
1. 确保 GitHub CLI 使用正确的账户登录
2. 确保账户有仓库的管理员权限
3. 重新登录：`gh auth login`

### 问题：Secret 设置失败

**可能原因：**
- Token 格式错误
- 网络问题
- 权限不足

**解决方案：**
1. 检查 Token 是否正确复制（没有多余空格）
2. 检查网络连接
3. 确认账户权限

## 手动配置（备用方案）

如果脚本无法使用，可以手动配置：

1. 访问 GitHub 仓库
2. Settings → Secrets and variables → Actions
3. 点击 New repository secret
4. 添加以下 Secrets：
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
   - `NEXT_PUBLIC_API_URL` (可选)

## 下一步

配置完成后：

1. ✅ 推送代码到 `main` 分支
2. ✅ 查看 GitHub Actions 自动运行
3. ✅ 验证部署是否成功
4. ✅ 测试 API 和 Web 应用

## 相关文档

- [GitHub CLI 文档](https://cli.github.com/manual/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
