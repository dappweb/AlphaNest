# AlphaNest API 密钥配置指南

## 📋 需要获取的 API 密钥

| API | 用途 | 免费额度 | 获取链接 |
|-----|------|----------|----------|
| **Bitquery** | 链上数据分析 | 免费计划可用 | https://bitquery.io/ |
| **1inch** | DEX 聚合交易 | 免费 API | https://portal.1inch.dev/ |
| **Covalent** | 多链数据聚合 | 免费计划可用 | https://www.covalenthq.com/ |
| **Jupiter** | Solana DEX | 免费 | https://station.jup.ag/docs/ |

---

## 🔧 配置步骤

### 1. Bitquery API Key (链上数据分析)

**步骤:**
1. 访问 https://bitquery.io/
2. 点击 "Get Started Free"
3. 注册账号 (支持 GitHub/Google 登录)
4. 进入 Dashboard → API Keys
5. 点击 "Create New Key"
6. 复制 API Key

**配置命令:**
```bash
cd /home/zyj_dev/AlphaNest/apps/api
echo "你的_bitquery_api_key" | npx wrangler secret put BITQUERY_API_KEY
```

---

### 2. 1inch API Key (DEX 聚合)

**步骤:**
1. 访问 https://portal.1inch.dev/
2. 注册账号
3. 创建新项目
4. 获取 API Key

**配置命令:**
```bash
echo "你的_1inch_api_key" | npx wrangler secret put ONE_INCH_API_KEY
```

---

### 3. Covalent API Key (多链数据)

**步骤:**
1. 访问 https://www.covalenthq.com/
2. 点击 "Get API Key"
3. 注册账号
4. 进入 Dashboard 获取 Key

**配置命令:**
```bash
echo "你的_covalent_api_key" | npx wrangler secret put COVALENT_API_KEY
```

---

### 4. Telegram Bot Token

**步骤:**
1. 在 Telegram 搜索 @BotFather
2. 发送 `/newbot`
3. 输入机器人名称 (如: AlphaNest Bot)
4. 输入机器人用户名 (如: AlphaNestBot)
5. 复制 Bot Token

**配置命令:**
```bash
echo "你的_telegram_bot_token" | npx wrangler secret put TELEGRAM_BOT_TOKEN
```

---

## 🚀 快速配置脚本

创建一个交互式配置脚本:

```bash
#!/bin/bash
cd /home/zyj_dev/AlphaNest/apps/api

echo "🔧 AlphaNest API 密钥配置"
echo "========================="

# Bitquery
read -p "请输入 Bitquery API Key (回车跳过): " BITQUERY_KEY
if [ -n "$BITQUERY_KEY" ]; then
    echo "$BITQUERY_KEY" | npx wrangler secret put BITQUERY_API_KEY
    echo "✅ Bitquery API Key 已配置"
fi

# 1inch
read -p "请输入 1inch API Key (回车跳过): " ONE_INCH_KEY
if [ -n "$ONE_INCH_KEY" ]; then
    echo "$ONE_INCH_KEY" | npx wrangler secret put ONE_INCH_API_KEY
    echo "✅ 1inch API Key 已配置"
fi

# Covalent
read -p "请输入 Covalent API Key (回车跳过): " COVALENT_KEY
if [ -n "$COVALENT_KEY" ]; then
    echo "$COVALENT_KEY" | npx wrangler secret put COVALENT_API_KEY
    echo "✅ Covalent API Key 已配置"
fi

# Telegram
read -p "请输入 Telegram Bot Token (回车跳过): " TG_TOKEN
if [ -n "$TG_TOKEN" ]; then
    echo "$TG_TOKEN" | npx wrangler secret put TELEGRAM_BOT_TOKEN
    echo "✅ Telegram Bot Token 已配置"
fi

echo ""
echo "🎉 配置完成! 重新部署 API..."
npm run deploy

echo "✅ 部署完成!"
```

---

## 📊 验证配置

配置完成后，可以测试 API:

```bash
# 测试 API 健康状态
curl https://alphanest-api.suiyiwan1.workers.dev/

# 测试 Trending 代币 (使用 DexScreener，免费)
curl https://alphanest-api.suiyiwan1.workers.dev/api/v1/tokens/trending | jq '.data | length'

# 查看已配置的 Secrets
npx wrangler secret list
```

---

## ⚠️ 重要提示

1. **API Key 安全**: 永远不要将 API Key 提交到 Git
2. **免费额度**: 大部分 API 都有免费额度，初期够用
3. **Rate Limit**: 注意各 API 的请求限制
4. **备用方案**: DexScreener 已经可以提供基础数据

---

## 📌 已配置的 Secrets

| Secret | 状态 | 说明 |
|--------|------|------|
| JWT_SECRET | ✅ | 自动生成 |
| ETH_RPC_URL | ✅ | Alchemy |
| BASE_RPC_URL | ✅ | Base 官方 |
| SOLANA_RPC_URL | ✅ | Solana 官方 |
| CONTRACT_* | ✅ | 8 个合约地址 |
| DEXSCREENER_API_KEY | ✅ | 免费 |
| BITQUERY_API_KEY | ⚠️ | 需要配置 |
| COVALENT_API_KEY | ⚠️ | 需要配置 |
| ONE_INCH_API_KEY | ⚠️ | 需要配置 |
| TELEGRAM_BOT_TOKEN | ⚠️ | 需要配置 |

---

**最后更新**: 2026-01-11
