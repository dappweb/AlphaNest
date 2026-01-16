#!/bin/bash

# 快速配置脚本 - 使用环境变量
# 使用方法:
#   export CLOUDFLARE_ACCOUNT_ID="your_account_id"
#   export CLOUDFLARE_API_TOKEN="your_api_token"
#   export NEXT_PUBLIC_API_URL="https://api.example.com"  # 可选
#   ./scripts/quick-setup-secrets.sh

set -e

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查 GitHub CLI
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) 未安装${NC}"
    echo "安装: https://cli.github.com/"
    exit 1
fi

# 检查是否已登录
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  请先登录: gh auth login${NC}"
    exit 1
fi

# 获取仓库信息
REPO=$(git remote get-url origin | sed -E 's/.*github.com[:/]([^/]+\/[^/]+)(\.git)?$/\1/')

# 检查环境变量
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo -e "${RED}❌ 请设置 CLOUDFLARE_ACCOUNT_ID 环境变量${NC}"
    exit 1
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${RED}❌ 请设置 CLOUDFLARE_API_TOKEN 环境变量${NC}"
    exit 1
fi

# 设置 Secrets
echo "🔐 设置 GitHub Secrets..."

gh secret set CLOUDFLARE_ACCOUNT_ID --repo "$REPO" --body "$CLOUDFLARE_ACCOUNT_ID"
echo -e "${GREEN}✓${NC} CLOUDFLARE_ACCOUNT_ID"

gh secret set CLOUDFLARE_API_TOKEN --repo "$REPO" --body "$CLOUDFLARE_API_TOKEN"
echo -e "${GREEN}✓${NC} CLOUDFLARE_API_TOKEN"

if [ -n "$NEXT_PUBLIC_API_URL" ]; then
    gh secret set NEXT_PUBLIC_API_URL --repo "$REPO" --body "$NEXT_PUBLIC_API_URL"
    echo -e "${GREEN}✓${NC} NEXT_PUBLIC_API_URL"
fi

echo ""
echo -e "${GREEN}✅ 配置完成！${NC}"
