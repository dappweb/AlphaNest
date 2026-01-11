#!/bin/bash

# ============================================
# AlphaNest 生产环境配置脚本
# ============================================
# 用法: ./scripts/setup-production.sh
# 
# 此脚本将配置:
# 1. Cloudflare Workers Secrets (环境变量)
# 2. 运行数据库迁移
# ============================================

set -e

echo "🚀 AlphaNest 生产环境配置"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 进入 API 目录
cd "$(dirname "$0")/../apps/api"

echo ""
echo -e "${BLUE}📋 步骤 1: 检查 Cloudflare 登录状态${NC}"
echo "------------------------------------------"
if ! npx wrangler whoami > /dev/null 2>&1; then
    echo -e "${RED}❌ 未登录 Cloudflare，请先运行: npx wrangler login${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 已登录 Cloudflare${NC}"

echo ""
echo -e "${BLUE}📋 步骤 2: 配置环境变量 (Secrets)${NC}"
echo "------------------------------------------"

# ============================================
# 必需的 Secrets
# ============================================

# JWT 密钥 - 自动生成安全密钥
echo -e "${YELLOW}➤ 配置 JWT_SECRET${NC}"
JWT_SECRET=$(openssl rand -base64 32)
echo "$JWT_SECRET" | npx wrangler secret put JWT_SECRET
echo -e "${GREEN}✅ JWT_SECRET 已配置${NC}"

# RPC URLs
echo ""
echo -e "${YELLOW}➤ 配置 RPC URLs${NC}"

# Ethereum RPC
echo "https://eth-mainnet.g.alchemy.com/v2/KQ2LUgUJLj4EtMsOp_poH" | npx wrangler secret put ETH_RPC_URL
echo -e "${GREEN}✅ ETH_RPC_URL 已配置${NC}"

# Base RPC
echo "https://mainnet.base.org" | npx wrangler secret put BASE_RPC_URL
echo -e "${GREEN}✅ BASE_RPC_URL 已配置${NC}"

# Solana RPC (使用公共节点)
echo "https://api.mainnet-beta.solana.com" | npx wrangler secret put SOLANA_RPC_URL
echo -e "${GREEN}✅ SOLANA_RPC_URL 已配置${NC}"

# ============================================
# 智能合约地址 (Sepolia 测试网)
# ============================================
echo ""
echo -e "${YELLOW}➤ 配置智能合约地址 (Sepolia)${NC}"

# AlphaNestCore
echo "0x0DE761C3A2e72BFa04B660395856ADc0A1252879" | npx wrangler secret put CONTRACT_ALPHANEST_CORE
echo -e "${GREEN}✅ CONTRACT_ALPHANEST_CORE 已配置${NC}"

# ReputationRegistry
echo "0xC6B671e921D4888421E200360eeD5c11BeC2ad12" | npx wrangler secret put CONTRACT_REPUTATION_REGISTRY
echo -e "${GREEN}✅ CONTRACT_REPUTATION_REGISTRY 已配置${NC}"

# AlphaGuard
echo "0xCbcE6832F5E59F90c24bFb57Fb6f1Bc8B4232f03" | npx wrangler secret put CONTRACT_ALPHAGUARD
echo -e "${GREEN}✅ CONTRACT_ALPHAGUARD 已配置${NC}"

# AlphaToken
echo "0x425845f5E29017380993119D976cBBa41990E53A" | npx wrangler secret put CONTRACT_ALPHA_TOKEN
echo -e "${GREEN}✅ CONTRACT_ALPHA_TOKEN 已配置${NC}"

# MockUSDC (Sepolia)
echo "0xceCC6D1dA322b6AC060D3998CA58e077CB679F79" | npx wrangler secret put CONTRACT_USDC
echo -e "${GREEN}✅ CONTRACT_USDC 已配置${NC}"

# TokenFactory
echo "0x350ca479821D4eDA3e4bF41021f6736598378f0c" | npx wrangler secret put CONTRACT_TOKEN_FACTORY
echo -e "${GREEN}✅ CONTRACT_TOKEN_FACTORY 已配置${NC}"

# CrossChainVerifier
echo "0x326c44a65d6A75217FA4064776864bc8983c1e9c" | npx wrangler secret put CONTRACT_CROSS_CHAIN_VERIFIER
echo -e "${GREEN}✅ CONTRACT_CROSS_CHAIN_VERIFIER 已配置${NC}"

# AlphaGuardOracle
echo "0x493b00F67e560c1eAb11e340f9648eE19B2Eb693" | npx wrangler secret put CONTRACT_ALPHAGUARD_ORACLE
echo -e "${GREEN}✅ CONTRACT_ALPHAGUARD_ORACLE 已配置${NC}"

# ============================================
# 可选的 API 密钥 (设置占位符)
# ============================================
echo ""
echo -e "${YELLOW}➤ 配置 API 密钥 (如需要请稍后更新)${NC}"

# DexScreener (免费，无需密钥)
echo "free" | npx wrangler secret put DEXSCREENER_API_KEY
echo -e "${GREEN}✅ DEXSCREENER_API_KEY 已配置 (免费)${NC}"

# Bitquery (需要注册获取)
echo "placeholder" | npx wrangler secret put BITQUERY_API_KEY
echo -e "${YELLOW}⚠️ BITQUERY_API_KEY 需要替换为真实密钥${NC}"

# Covalent (需要注册获取)
echo "placeholder" | npx wrangler secret put COVALENT_API_KEY
echo -e "${YELLOW}⚠️ COVALENT_API_KEY 需要替换为真实密钥${NC}"

# 1inch (需要注册获取)
echo "placeholder" | npx wrangler secret put ONE_INCH_API_KEY
echo -e "${YELLOW}⚠️ ONE_INCH_API_KEY 需要替换为真实密钥${NC}"

echo ""
echo -e "${BLUE}📋 步骤 3: 运行数据库迁移${NC}"
echo "------------------------------------------"

# 列出迁移状态
echo -e "${YELLOW}➤ 检查迁移状态${NC}"
npx wrangler d1 migrations list alphanest-db --remote

# 应用迁移
echo ""
echo -e "${YELLOW}➤ 应用数据库迁移${NC}"
npx wrangler d1 migrations apply alphanest-db --remote

echo ""
echo -e "${BLUE}📋 步骤 4: 验证数据库表${NC}"
echo "------------------------------------------"
npx wrangler d1 execute alphanest-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

echo ""
echo -e "${BLUE}📋 步骤 5: 部署 API${NC}"
echo "------------------------------------------"
echo -e "${YELLOW}➤ 部署到 Cloudflare Workers${NC}"
npm run deploy

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 生产环境配置完成!${NC}"
echo "=========================================="
echo ""
echo "📌 已配置的 Secrets:"
echo "   ✅ JWT_SECRET (自动生成)"
echo "   ✅ ETH_RPC_URL"
echo "   ✅ BASE_RPC_URL"
echo "   ✅ SOLANA_RPC_URL"
echo "   ✅ CONTRACT_ALPHANEST_CORE"
echo "   ✅ CONTRACT_REPUTATION_REGISTRY"
echo "   ✅ CONTRACT_ALPHAGUARD"
echo "   ✅ CONTRACT_ALPHA_TOKEN"
echo "   ✅ CONTRACT_USDC"
echo "   ✅ CONTRACT_TOKEN_FACTORY"
echo "   ✅ CONTRACT_CROSS_CHAIN_VERIFIER"
echo "   ✅ CONTRACT_ALPHAGUARD_ORACLE"
echo "   ⚠️ BITQUERY_API_KEY (占位符)"
echo "   ⚠️ COVALENT_API_KEY (占位符)"
echo "   ⚠️ ONE_INCH_API_KEY (占位符)"
echo ""
echo "📌 下一步操作:"
echo "   1. 更新真实的 API 密钥:"
echo "      echo 'your_key' | npx wrangler secret put BITQUERY_API_KEY"
echo "      echo 'your_key' | npx wrangler secret put COVALENT_API_KEY"
echo "   2. 部署前端并配置环境变量"
echo "   3. 测试完整流程"
echo ""
