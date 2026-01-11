#!/bin/bash

# ============================================
# AlphaNest API 密钥配置脚本
# ============================================
# 用法: ./scripts/configure-api-keys.sh
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   AlphaNest API 密钥配置向导               ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
echo ""

# 进入 API 目录
cd "$(dirname "$0")/../apps/api"

echo -e "${BLUE}📋 API 密钥获取链接:${NC}"
echo ""
echo "   1. Bitquery:  https://bitquery.io/"
echo "   2. 1inch:     https://portal.1inch.dev/"
echo "   3. Covalent:  https://www.covalenthq.com/"
echo "   4. Telegram:  在 Telegram 搜索 @BotFather"
echo ""
echo -e "${YELLOW}提示: 按回车跳过不需要配置的项目${NC}"
echo ""

# Bitquery
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}1. Bitquery API Key${NC} (链上数据分析)"
echo "   用途: Dev 历史记录、代币分析"
read -p "   请输入 API Key: " BITQUERY_KEY
if [ -n "$BITQUERY_KEY" ]; then
    echo "$BITQUERY_KEY" | npx wrangler secret put BITQUERY_API_KEY 2>/dev/null
    echo -e "   ${GREEN}✅ Bitquery API Key 已配置${NC}"
else
    echo -e "   ${YELLOW}⏭️  已跳过${NC}"
fi

# 1inch
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}2. 1inch API Key${NC} (DEX 聚合交易)"
echo "   用途: EVM 链 Swap 交易"
read -p "   请输入 API Key: " ONE_INCH_KEY
if [ -n "$ONE_INCH_KEY" ]; then
    echo "$ONE_INCH_KEY" | npx wrangler secret put ONE_INCH_API_KEY 2>/dev/null
    echo -e "   ${GREEN}✅ 1inch API Key 已配置${NC}"
else
    echo -e "   ${YELLOW}⏭️  已跳过${NC}"
fi

# Covalent
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}3. Covalent API Key${NC} (多链数据聚合)"
echo "   用途: 钱包余额、交易历史"
read -p "   请输入 API Key: " COVALENT_KEY
if [ -n "$COVALENT_KEY" ]; then
    echo "$COVALENT_KEY" | npx wrangler secret put COVALENT_API_KEY 2>/dev/null
    echo -e "   ${GREEN}✅ Covalent API Key 已配置${NC}"
else
    echo -e "   ${YELLOW}⏭️  已跳过${NC}"
fi

# Telegram
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}4. Telegram Bot Token${NC}"
echo "   用途: 通知推送、鲸鱼预警"
read -p "   请输入 Bot Token: " TG_TOKEN
if [ -n "$TG_TOKEN" ]; then
    echo "$TG_TOKEN" | npx wrangler secret put TELEGRAM_BOT_TOKEN 2>/dev/null
    echo -e "   ${GREEN}✅ Telegram Bot Token 已配置${NC}"
else
    echo -e "   ${YELLOW}⏭️  已跳过${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 询问是否重新部署
read -p "是否重新部署 API? (y/n): " DEPLOY
if [ "$DEPLOY" = "y" ] || [ "$DEPLOY" = "Y" ]; then
    echo ""
    echo -e "${YELLOW}🚀 正在部署 API...${NC}"
    npm run deploy 2>&1 | tail -10
    echo ""
    echo -e "${GREEN}✅ 部署完成!${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   配置完成!                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 当前 Secrets 列表:${NC}"
npx wrangler secret list 2>/dev/null | grep -o '"name": "[^"]*"' | cut -d'"' -f4 | while read name; do
    echo "   ✅ $name"
done
echo ""
echo -e "${BLUE}🔗 API 端点:${NC}"
echo "   https://alphanest-api.suiyiwan1.workers.dev"
echo ""
