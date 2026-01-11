# AlphaNest

**去中心化 Meme 代币交易和保险平台**

AlphaNest 是一个创新的去中心化平台，专注于 Meme 代币的交易、保险和社区治理。平台提供跨链支持、智能保险、跟单交易、Dev 信誉系统等核心功能。

## 🚀 快速开始

### 前置要求

- Node.js >= 18.x
- npm >= 9.x
- Cloudflare 账户
- 钱包 (MetaMask, Coinbase Wallet, Phantom 等)

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-org/AlphaNest.git
cd AlphaNest

# 安装依赖
cd apps/web && npm install
cd ../api && npm install
```

### 开发

```bash
# 启动前端
cd apps/web
npm run dev

# 启动 API (需要配置 Cloudflare)
cd apps/api
npm run dev
```

## 📚 文档

- [设置指南](./SETUP_GUIDE.md) - 初始设置和配置
- [部署指南](./DEPLOYMENT_GUIDE.md) - 生产环境部署
- [生产检查清单](./PRODUCTION_CHECKLIST.md) - 部署前检查
- [功能可用性报告](./FUNCTIONAL_AVAILABILITY_REPORT.md) - 功能状态
- [GitBook 文档同步](./GITBOOK_SETUP.md) - GitBook 集成

## 🏗️ 项目结构

```
AlphaNest/
├── apps/
│   ├── web/          # Next.js 前端应用
│   └── api/          # Cloudflare Workers API
├── contracts/        # Solidity 智能合约
├── scripts/          # 工具脚本
└── docs/             # 文档
```

## ✨ 核心功能

- ✅ **钱包连接** - 支持 EVM 和 Solana 钱包
- ✅ **代币交易** - DEX 聚合器集成
- ✅ **保险系统** - AlphaGuard 参数化保险
- ✅ **积分系统** - $ALPHA 代币质押和奖励
- ✅ **Dev 排行** - 信誉评分系统
- ✅ **跟单交易** - 自动跟单功能
- ✅ **数据分析** - 平台统计和图表
- ✅ **推荐系统** - 邀请奖励
- ✅ **通知系统** - 实时推送

## 🔗 链接

- **Web**: https://alphanest-web-9w8.pages.dev
- **API**: https://alphanest-api.suiyiwan1.workers.dev
- **GitBook**: [查看完整文档](https://app.gitbook.com)

## 📄 许可证

MIT License

---

**最后更新**: 2026-01-11
