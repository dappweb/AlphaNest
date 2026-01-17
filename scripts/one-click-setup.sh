#!/bin/bash

# 一键设置脚本 - 自动配置 GitHub Actions 和 Cloudflare
# 这个脚本会引导你完成所有必要的配置步骤

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   AlphaNest 一键自动配置脚本          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# 检查 GitHub CLI
echo -e "${YELLOW}📦 检查依赖...${NC}"
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) 未安装${NC}"
    echo ""
    echo "正在尝试安装 GitHub CLI..."
    
    # 检测操作系统
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install gh
        else
            echo -e "${RED}请先安装 Homebrew: https://brew.sh/${NC}"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y gh
        else
            echo -e "${RED}请手动安装 GitHub CLI: https://cli.github.com/${NC}"
            exit 1
        fi
    else
        echo -e "${RED}请手动安装 GitHub CLI: https://cli.github.com/${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓${NC} GitHub CLI 已安装"

# 检查登录状态
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  未登录 GitHub CLI${NC}"
    echo "正在登录..."
    gh auth login
fi

echo -e "${GREEN}✓${NC} GitHub CLI 已登录"

# 获取仓库信息
REPO=$(git remote get-url origin | sed -E 's/.*github.com[:/]([^/]+\/[^/]+)(\.git)?$/\1/')
echo -e "${GREEN}✓${NC} 仓库: $REPO"
echo ""

# 步骤 1: 配置 GitHub Secrets
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}步骤 1: 配置 GitHub Secrets${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 检查是否已有 Secrets
EXISTING_SECRETS=$(gh secret list --repo "$REPO" 2>/dev/null || echo "")

if echo "$EXISTING_SECRETS" | grep -q "CLOUDFLARE_ACCOUNT_ID"; then
    echo -e "${YELLOW}⚠️  CLOUDFLARE_ACCOUNT_ID 已存在${NC}"
    read -p "是否要更新? (y/N): " UPDATE_ACCOUNT_ID
    if [[ "$UPDATE_ACCOUNT_ID" =~ ^[Yy]$ ]]; then
        read -p "请输入新的 Cloudflare Account ID: " ACCOUNT_ID
        gh secret set CLOUDFLARE_ACCOUNT_ID --repo "$REPO" --body "$ACCOUNT_ID"
        echo -e "${GREEN}✓${NC} 已更新 CLOUDFLARE_ACCOUNT_ID"
    fi
else
    echo "请访问 Cloudflare Dashboard 获取 Account ID:"
    echo "  https://dash.cloudflare.com/"
    echo "  (在右侧边栏可以看到 Account ID)"
    read -p "请输入 Cloudflare Account ID: " ACCOUNT_ID
    gh secret set CLOUDFLARE_ACCOUNT_ID --repo "$REPO" --body "$ACCOUNT_ID"
    echo -e "${GREEN}✓${NC} 已设置 CLOUDFLARE_ACCOUNT_ID"
fi

if echo "$EXISTING_SECRETS" | grep -q "CLOUDFLARE_API_TOKEN"; then
    echo -e "${YELLOW}⚠️  CLOUDFLARE_API_TOKEN 已存在${NC}"
    read -p "是否要更新? (y/N): " UPDATE_TOKEN
    if [[ "$UPDATE_TOKEN" =~ ^[Yy]$ ]]; then
        echo "请访问创建 API Token:"
        echo "  https://dash.cloudflare.com/profile/api-tokens"
        echo "  使用 'Edit Cloudflare Workers' 模板"
        read -p "请输入新的 Cloudflare API Token: " API_TOKEN
        gh secret set CLOUDFLARE_API_TOKEN --repo "$REPO" --body "$API_TOKEN"
        echo -e "${GREEN}✓${NC} 已更新 CLOUDFLARE_API_TOKEN"
    fi
else
    echo "请访问创建 API Token:"
    echo "  https://dash.cloudflare.com/profile/api-tokens"
    echo "  使用 'Edit Cloudflare Workers' 模板"
    read -p "请输入 Cloudflare API Token: " API_TOKEN
    gh secret set CLOUDFLARE_API_TOKEN --repo "$REPO" --body "$API_TOKEN"
    echo -e "${GREEN}✓${NC} 已设置 CLOUDFLARE_API_TOKEN"
fi

# 可选配置
echo ""
read -p "是否要配置 API URL? (y/N): " CONFIGURE_API_URL
if [[ "$CONFIGURE_API_URL" =~ ^[Yy]$ ]]; then
    read -p "请输入 API URL (默认: https://alphanest-api.dappweb.workers.dev): " API_URL
    API_URL=${API_URL:-"https://alphanest-api.dappweb.workers.dev"}
    gh secret set NEXT_PUBLIC_API_URL --repo "$REPO" --body "$API_URL"
    echo -e "${GREEN}✓${NC} 已设置 NEXT_PUBLIC_API_URL"
fi

# 步骤 2: 验证配置
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}步骤 2: 验证配置${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

SECRETS=$(gh secret list --repo "$REPO" 2>/dev/null || echo "")

echo "已配置的 Secrets:"
if echo "$SECRETS" | grep -q "CLOUDFLARE_ACCOUNT_ID"; then
    echo -e "  ${GREEN}✓${NC} CLOUDFLARE_ACCOUNT_ID"
else
    echo -e "  ${RED}✗${NC} CLOUDFLARE_ACCOUNT_ID (缺失)"
fi

if echo "$SECRETS" | grep -q "CLOUDFLARE_API_TOKEN"; then
    echo -e "  ${GREEN}✓${NC} CLOUDFLARE_API_TOKEN"
else
    echo -e "  ${RED}✗${NC} CLOUDFLARE_API_TOKEN (缺失)"
fi

if echo "$SECRETS" | grep -q "NEXT_PUBLIC_API_URL"; then
    echo -e "  ${GREEN}✓${NC} NEXT_PUBLIC_API_URL"
else
    echo -e "  ${YELLOW}○${NC} NEXT_PUBLIC_API_URL (可选)"
fi

# 步骤 3: 测试工作流
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}步骤 3: 测试部署${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

read -p "是否要立即触发一次部署测试? (y/N): " TRIGGER_DEPLOY
if [[ "$TRIGGER_DEPLOY" =~ ^[Yy]$ ]]; then
    echo "正在触发部署工作流..."
    gh workflow run deploy.yml --repo "$REPO"
    echo -e "${GREEN}✓${NC} 已触发部署"
    echo ""
    echo "查看部署状态:"
    echo "  https://github.com/$REPO/actions"
    echo ""
    echo "或运行: gh run watch"
fi

# 完成
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✅ 配置完成！                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "下一步："
echo "1. 推送代码到 main 分支会自动触发部署"
echo "2. 查看 GitHub Actions: https://github.com/$REPO/actions"
echo "3. 手动触发部署: gh workflow run deploy.yml"
echo ""
echo "相关文档："
echo "  - docs/AUTO_SETUP_GUIDE.md"
echo "  - docs/GITHUB_ACTIONS_SETUP.md"
echo ""
