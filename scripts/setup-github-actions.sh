#!/bin/bash

# GitHub Actions 自动配置脚本
# 用于自动配置 Cloudflare 部署所需的 GitHub Secrets

set -e

echo "🚀 GitHub Actions 自动配置脚本"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 GitHub CLI
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) 未安装${NC}"
    echo ""
    echo "请先安装 GitHub CLI:"
    echo "  macOS: brew install gh"
    echo "  Linux: sudo apt install gh 或访问 https://cli.github.com/"
    echo ""
    exit 1
fi

# 检查是否已登录
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  未登录 GitHub CLI${NC}"
    echo "正在登录..."
    gh auth login
fi

# 获取仓库信息
REPO=$(git remote get-url origin | sed -E 's/.*github.com[:/]([^/]+\/[^/]+)(\.git)?$/\1/')
echo -e "${GREEN}✓${NC} 仓库: $REPO"
echo ""

# 检查 Wrangler
if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}⚠️  Wrangler 未安装，将使用 Cloudflare Dashboard 手动配置${NC}"
    USE_WRANGLER=false
else
    USE_WRANGLER=true
    echo -e "${GREEN}✓${NC} Wrangler 已安装"
fi

echo ""
echo "开始配置 GitHub Secrets..."
echo ""

# 1. 获取 Cloudflare Account ID
echo "📋 步骤 1: 获取 Cloudflare Account ID"
echo "-----------------------------------"
echo "请在 Cloudflare Dashboard 右侧边栏找到 Account ID"
echo "或访问: https://dash.cloudflare.com/"
read -p "请输入 Cloudflare Account ID: " ACCOUNT_ID

if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Account ID 不能为空${NC}"
    exit 1
fi

# 2. 获取 Cloudflare API Token
echo ""
echo "📋 步骤 2: 获取 Cloudflare API Token"
echo "-----------------------------------"
echo "请访问: https://dash.cloudflare.com/profile/api-tokens"
echo "创建新 Token，使用 'Edit Cloudflare Workers' 模板"
echo "或自定义权限:"
echo "  - Account → Cloudflare Workers → Edit"
echo "  - Account → Cloudflare Pages → Edit"
echo ""
read -p "请输入 Cloudflare API Token: " API_TOKEN

if [ -z "$API_TOKEN" ]; then
    echo -e "${RED}❌ API Token 不能为空${NC}"
    exit 1
fi

# 3. 获取 API URL (可选)
echo ""
echo "📋 步骤 3: API URL (可选)"
echo "-----------------------------------"
read -p "请输入 API URL (默认: https://alphanest-api.dappweb.workers.dev): " API_URL
API_URL=${API_URL:-"https://alphanest-api.dappweb.workers.dev"}

# 4. 设置 GitHub Secrets
echo ""
echo "🔐 正在设置 GitHub Secrets..."
echo "-----------------------------------"

# 设置 CLOUDFLARE_ACCOUNT_ID
echo -n "设置 CLOUDFLARE_ACCOUNT_ID... "
if gh secret set CLOUDFLARE_ACCOUNT_ID --repo "$REPO" --body "$ACCOUNT_ID" 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}❌ 失败${NC}"
    exit 1
fi

# 设置 CLOUDFLARE_API_TOKEN
echo -n "设置 CLOUDFLARE_API_TOKEN... "
if gh secret set CLOUDFLARE_API_TOKEN --repo "$REPO" --body "$API_TOKEN" 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}❌ 失败${NC}"
    exit 1
fi

# 设置 NEXT_PUBLIC_API_URL (可选)
echo -n "设置 NEXT_PUBLIC_API_URL... "
if gh secret set NEXT_PUBLIC_API_URL --repo "$REPO" --body "$API_URL" 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠️  跳过（可选）${NC}"
fi

# 5. 验证配置
echo ""
echo "🔍 验证配置..."
echo "-----------------------------------"

SECRETS=$(gh secret list --repo "$REPO" 2>/dev/null || echo "")

if echo "$SECRETS" | grep -q "CLOUDFLARE_ACCOUNT_ID"; then
    echo -e "${GREEN}✓${NC} CLOUDFLARE_ACCOUNT_ID 已配置"
else
    echo -e "${RED}❌ CLOUDFLARE_ACCOUNT_ID 未找到${NC}"
fi

if echo "$SECRETS" | grep -q "CLOUDFLARE_API_TOKEN"; then
    echo -e "${GREEN}✓${NC} CLOUDFLARE_API_TOKEN 已配置"
else
    echo -e "${RED}❌ CLOUDFLARE_API_TOKEN 未找到${NC}"
fi

# 6. 测试工作流
echo ""
echo "✅ 配置完成！"
echo "================================"
echo ""
echo "下一步："
echo "1. 推送代码到 main 分支触发自动部署"
echo "2. 查看 GitHub Actions: https://github.com/$REPO/actions"
echo "3. 或手动触发: gh workflow run deploy.yml --repo $REPO"
echo ""
echo "要手动触发部署，运行："
echo "  gh workflow run deploy.yml --repo $REPO"
echo ""
