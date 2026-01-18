# PopCowDefi 生产环境部署检查清单

## ✅ 已完成功能

### 前端页面
| 页面 | 路径 | 状态 | 功能 |
|------|------|------|------|
| 首页 | `/` | ✅ | Dashboard, 统计概览, 快速入口 |
| 质押 | `/staking` | ✅ | BSC/Solana 双链质押, Chainlink 价格, 锁定期 |
| 保险 | `/insurance` | ✅ | 5种保险产品, Four.meme/pump.fun 支持 |
| 推荐 | `/referral` | ✅ | 5级等级, 分享链接, 返佣追踪 |
| 设置 | `/settings` | ✅ | 链偏好, 质押设置 |
| 管理后台 | `/admin` | ✅ | 代币管理, 保险产品, 资金分配 |
| 隐私政策 | `/privacy` | ✅ | 法律文档 |
| 服务条款 | `/terms` | ✅ | 法律文档 |
| 风险披露 | `/risk` | ✅ | 法律文档 |

### 智能合约集成
| 合约 | 链 | 前端 Hook | 状态 |
|------|------|------|------|
| MultiAssetStaking | BSC | `use-multi-asset-staking.ts` | ✅ |
| CowGuardInsurance | BSC | `use-cowguard-insurance.ts` | ✅ |
| multi-asset-staking | Solana | `use-solana-staking.ts` | ✅ |
| cowguard-insurance | Solana | `use-solana-insurance.ts` | ✅ |
| Referral System | BSC | `use-staking-referral.ts` | ✅ |

### 价格预言机
| 来源 | 链 | 状态 |
|------|------|------|
| Chainlink | BSC | ✅ 集成 |
| Pyth Network | Solana | ✅ 集成 |
| Helius API | Solana | ✅ 集成 |

### 核心功能
- [x] 钱包连接 (RainbowKit + Solana Wallet Adapter)
- [x] 链切换 (BSC ↔ Solana 自动切换)
- [x] 多资产质押 (BNB, FOUR, SOL, SPL tokens)
- [x] 保险购买与理赔
- [x] 推荐返佣系统
- [x] 新用户必须绑定推荐人 (默认管理员)
- [x] 响应式设计 (移动端 + PC)
- [x] 多语言支持 (中/英)
- [x] 主题切换 (深色/浅色)

---

## 🔧 生产环境变量配置

在 Cloudflare Pages 或部署平台中设置以下环境变量：

### 必需变量
```bash
# 网站 URL
NEXT_PUBLIC_SITE_URL=https://popcowdefi.pages.dev

# WalletConnect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

# 管理员钱包 (推荐系统默认推荐人)
NEXT_PUBLIC_ADMIN_WALLET_ADDRESS=0x管理员BSC钱包地址
NEXT_PUBLIC_ADMIN_SOLANA_ADDRESS=管理员Solana钱包地址

# API
NEXT_PUBLIC_API_URL=https://alphanest-api.dappweb.workers.dev
```

### BSC 合约地址
```bash
# BSC Mainnet
NEXT_PUBLIC_MULTI_ASSET_STAKING_ADDRESS=0x质押合约地址
NEXT_PUBLIC_COWGUARD_INSURANCE_ADDRESS=0x保险合约地址
NEXT_PUBLIC_FOUR_MEME_TOKEN_ADDRESS=0xFour.meme代币地址
NEXT_PUBLIC_BSC_USDT_ADDRESS=0x55d398326f99059fF775485246999027B3197955

# BSC Testnet
NEXT_PUBLIC_STAKING_CONTRACT_BSC_TESTNET=0x测试网质押合约
NEXT_PUBLIC_INSURANCE_CONTRACT_BSC_TESTNET=0x测试网保险合约
NEXT_PUBLIC_TESTNET_STAKING_ADDRESS=0x测试网质押合约
NEXT_PUBLIC_TESTNET_INSURANCE_ADDRESS=0x测试网保险合约
```

### Solana 配置
```bash
# Network: mainnet-beta / devnet / soldev
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_key

# Helius API (Solana 数据)
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_api_key
```

### Sentry 监控 (可选)
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=your_token
```

---

## 🚀 部署步骤

### 1. 部署智能合约

#### BSC Mainnet
```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url bsc --broadcast --verify
```

#### Solana
```bash
cd contracts/solana
anchor build
anchor deploy --provider.cluster mainnet
```

### 2. 配置 Chainlink 价格喂价

BSC Mainnet 地址:
- BNB/USD: `0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE`
- USDT/USD: `0xB97Ad0E74fa7d920791E90258A6E2085088b4320`
- USDC/USD: `0x51597f405303C4377E36123cBc172b13269EA163`

### 3. 部署前端

```bash
cd apps/web
npm run build
npx wrangler pages deploy out --project-name=popcowdefi
```

### 4. 配置 Cloudflare Pages 环境变量

在 Cloudflare Dashboard → Pages → Settings → Environment Variables 添加所有必需变量

---

## ✅ 部署前检查清单

### 合约
- [ ] BSC 质押合约已部署并验证
- [ ] BSC 保险合约已部署并验证
- [ ] Solana 质押程序已部署
- [ ] Solana 保险程序已部署
- [ ] Chainlink 价格喂价已配置
- [ ] 合约所有者已设置为管理员钱包

### 环境变量
- [ ] `NEXT_PUBLIC_ADMIN_WALLET_ADDRESS` 已设置
- [ ] `NEXT_PUBLIC_ADMIN_SOLANA_ADDRESS` 已设置
- [ ] `NEXT_PUBLIC_MULTI_ASSET_STAKING_ADDRESS` 已设置
- [ ] `NEXT_PUBLIC_COWGUARD_INSURANCE_ADDRESS` 已设置
- [ ] `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` 已设置
- [ ] `NEXT_PUBLIC_HELIUS_API_KEY` 已设置

### 前端
- [ ] 构建成功无错误
- [ ] 所有页面可访问
- [ ] 钱包连接正常
- [ ] BSC 网络切换正常
- [ ] Solana 网络连接正常

### 安全
- [ ] 合约已审计
- [ ] 管理员私钥安全保管
- [ ] 环境变量不包含敏感信息
- [ ] HTTPS 强制启用

---

## 📊 功能测试清单

### 质押功能
- [ ] 连接 BSC 钱包
- [ ] 选择锁定期
- [ ] 输入质押金额
- [ ] 新用户绑定推荐人提示
- [ ] 质押交易成功
- [ ] 查看质押信息
- [ ] 解除质押
- [ ] 领取奖励

### 保险功能
- [ ] 查看保险产品列表
- [ ] 平台筛选 (Four.meme/pump.fun)
- [ ] 购买保险
- [ ] 查看我的保单
- [ ] 提交理赔
- [ ] 取消保单

### 推荐功能
- [ ] 查看推荐码
- [ ] 复制推荐链接
- [ ] 分享到社交媒体
- [ ] 查看推荐统计
- [ ] 查看推荐等级
- [ ] 领取推荐奖励

### 管理后台
- [ ] 管理员登录
- [ ] 添加质押代币
- [ ] 创建保险产品
- [ ] 设置资金分配比例
- [ ] 暂停/恢复合约

---

## 🔗 相关链接

- **主网**: https://popcowdefi.pages.dev
- **API**: https://alphanest-api.dappweb.workers.dev
- **BscScan**: https://bscscan.com
- **Solana Explorer**: https://explorer.solana.com
- **GitHub**: https://github.com/dappweb/AlphaNest

---

## 📞 支持

- Twitter: @popcowxyz
- Telegram: @popcowxyz
- Discord: discord.gg/popcow

---

**最后更新**: 2026-01-18
**版本**: 1.0.0
