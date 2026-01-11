# Cloudflare Pages 环境变量配置指南

## 📋 在 Cloudflare Dashboard 配置环境变量

### 步骤 1: 进入 Cloudflare Dashboard
1. 访问 https://dash.cloudflare.com/
2. 选择 **Workers & Pages**
3. 点击 **alphanest-web** 项目

### 步骤 2: 配置环境变量
1. 点击 **Settings** 标签
2. 点击 **Environment variables**
3. 添加以下变量:

---

## 🔧 必需的环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NEXT_PUBLIC_API_URL` | `https://alphanest-api.suiyiwan1.workers.dev` | API 端点 |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | `c7854b44b8bb57f8ae94f0a52f17f128` | WalletConnect 项目 ID |
| `NEXT_PUBLIC_ENVIRONMENT` | `production` | 环境标识 |

---

## 📜 智能合约地址 (Sepolia 测试网)

| 变量名 | 值 |
|--------|-----|
| `NEXT_PUBLIC_ALPHAGUARD_ADDRESS` | `0xCbcE6832F5E59F90c24bFb57Fb6f1Bc8B4232f03` |
| `NEXT_PUBLIC_USDC_ADDRESS` | `0xceCC6D1dA322b6AC060D3998CA58e077CB679F79` |
| `NEXT_PUBLIC_ALPHANEST_CORE_ADDRESS` | `0x0DE761C3A2e72BFa04B660395856ADc0A1252879` |
| `NEXT_PUBLIC_ALPHA_TOKEN_ADDRESS` | `0x425845f5E29017380993119D976cBBa41990E53A` |
| `NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS` | `0xC6B671e921D4888421E200360eeD5c11BeC2ad12` |
| `NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS` | `0x350ca479821D4eDA3e4bF41021f6736598378f0c` |

---

## 🌐 Solana 配置

| 变量名 | 值 |
|--------|-----|
| `NEXT_PUBLIC_SOLANA_NETWORK` | `mainnet-beta` |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | `https://api.mainnet-beta.solana.com` |

---

## 🔗 网站配置

| 变量名 | 值 |
|--------|-----|
| `NEXT_PUBLIC_SITE_URL` | `https://alphanest-web-9w8.pages.dev` |

---

## ⚠️ 重要说明

1. **环境变量在构建时注入** - 修改后需要重新部署才能生效
2. **敏感信息不要放在 NEXT_PUBLIC_ 变量中** - 这些会暴露给客户端
3. **WalletConnect 项目 ID** - 从 https://cloud.walletconnect.com/ 获取

---

## 🚀 快速配置命令

如果您在本地开发，可以复制 `.env.production` 到 `.env.local`:

```bash
cp apps/web/.env.production apps/web/.env.local
```

---

## ✅ 配置完成后

1. 触发重新部署 (Push 代码或手动触发)
2. 验证前端功能:
   - 钱包连接
   - 保险购买
   - 合约交互

---

**最后更新**: 2026-01-11
