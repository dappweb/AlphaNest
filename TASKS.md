# AlphaNest 开发任务跟踪

**创建日期**: 2026-01-10  
**最后更新**: 2026-01-10 12:51  
**当前阶段**: Phase 2 - 核心功能开发

---

## 项目进度概览

### 已完成 ✅

#### Web 前端
| 任务 | 文件/说明 | 状态 |
|------|----------|------|
| Next.js 15 工程初始化 | `apps/web/` | ✅ |
| TailwindCSS + shadcn/ui 配置 | - | ✅ |
| RainbowKit 钱包连接集成 | - | ✅ |
| Solana 钱包集成 | `solana-provider.tsx` | ✅ |
| Dashboard 页面框架 | `app/page.tsx` | ✅ |
| Trade 交易页面 | `app/trade/` | ✅ |
| Dev 详情页 | `app/devs/[address]/` | ✅ |
| 保险市场页 | `app/insurance/` | ✅ |
| 积分系统页面 | `app/points/` | ✅ |
| K线图表 (Lightweight Charts) | `components/trade/` | ✅ |
| DEX Aggregator (0x/1inch) | `use-swap.ts` | ✅ |
| Jupiter Swap 集成 | `use-jupiter-swap.ts` | ✅ |
| 保险合约 Hooks | `use-alphaguard.ts` | ✅ |
| **质押系统 Hooks** | `use-alphanest-core.ts` | ✅ **NEW** |
| **Dev 信誉 Hooks** | `use-reputation.ts` | ✅ **NEW** |
| **验证挖矿 Hooks** | `use-verify-to-earn.ts` | ✅ **NEW** |
| WebSocket 客户端 Hook | `use-websocket.ts` | ✅ |
| 多语言支持 (i18n) | `i18n/` | ✅ |
| PWA 移动端优化 | - | ✅ |
| 部署到 Cloudflare Pages | - | ✅ |

#### API 后端
| 任务 | 文件/说明 | 状态 |
|------|----------|------|
| Hono 框架搭建 | `apps/api/src/index.ts` | ✅ |
| 路由模块结构 | `routes/*.ts` | ✅ |
| 中间件 (CORS, Auth, Rate Limit, GeoBlock) | `middleware/*.ts` | ✅ |
| WebSocket Durable Object | `index.ts` | ✅ |
| Cron 定时任务 | `scheduled/` | ✅ |
| **blockchain 服务** | `services/blockchain.ts` | ✅ **NEW** |
| **notifications 服务** | `services/notifications.ts` | ✅ **NEW** |
| 签名验证工具 | `utils/signature.ts` | ✅ |
| 外部API集成工具 | `utils/external-api.ts` | ✅ |

#### 智能合约
| 任务 | 文件/说明 | 状态 |
|------|----------|------|
| AlphaGuard 保险合约 | `AlphaGuard.sol` | ✅ |
| AlphaGuardOracle 预言机 | `AlphaGuardOracle.sol` | ✅ |
| **AlphaNestCore 核心合约** | `AlphaNestCore.sol` | ✅ **NEW** |
| **ReputationRegistry 信誉合约** | `ReputationRegistry.sol` | ✅ **NEW** |
| **CrossChainVerifier 跨链验证** | `CrossChainVerifier.sol` | ✅ **NEW** |
| **TokenFactory 代币工厂** | `TokenFactory.sol` | ✅ **NEW** |
| **AlphaToken $ALPHA 代币** | `AlphaToken.sol` | ✅ **NEW** |
| **Sepolia 部署脚本** | `script/Deploy.s.sol` | ✅ **NEW** |
| Foundry 测试脚本 | `test/*.t.sol` | ✅ |

#### Telegram Bot
| 任务 | 文件/说明 | 状态 |
|------|----------|------|
| 基础命令 (/start, /help) | `telegram-bot/src/index.ts` | ✅ |
| 订阅系统 (/subscribe) | - | ✅ |
| **安全评分 (/score)** | 代币安全分析 | ✅ **NEW** |
| **鲸鱼预警 (/whale)** | 大户交易监控 | ✅ **NEW** |
| **Dev 查询 (/dev)** | API 集成 | ✅ **NEW** |
| **价格查询 (/price)** | API 集成 | ✅ **NEW** |

#### 其他
| 任务 | 状态 |
|------|------|
| D1 Schema 设计 (001_init.sql) | ✅ |
| The Graph 索引器 | ✅ |
| E2E Playwright 测试套件 | ✅ |
| PRD 产品需求文档 | ✅ |
| 工程文档 (ENGINEERING.md) | ✅ |
| 白皮书 | ✅ |

### 进行中 🚧

| 模块 | 任务 | 优先级 |
|-----|------|--------|
| **智能合约** | Sepolia 测试网部署验证 | P0 |
| **智能合约** | 部署到 Base 主网 | P1 |

### 待开发 📋

详见下方各阶段任务清单。

---

## Phase 1: 基础设施完善 ✅ 已完成

### 1.1 API 核心功能

- [x] **签名验证** - 实现 EVM/Solana 签名验证
  - `apps/api/src/utils/signature.ts`
  - 支持 EIP-191, EIP-712 签名
  - 支持 Solana 签名验证

- [x] **外部 API 集成**
  - [x] DexScreener API - 代币价格数据 (`services/blockchain.ts`)
  - [x] Bitquery API - 链上历史数据 (`services/blockchain.ts`)
  - [x] Covalent API - 多链数据聚合

### 1.2 数据库与缓存

- [x] **D1 数据库设计**
  - Schema 设计完成 (`infrastructure/database/migrations/`)
  - 索引优化

- [x] **KV 缓存策略** (已在 `services/blockchain.ts` 实现)
  - 代币价格缓存 (TTL: 10s)
  - Dev 评分缓存 (TTL: 5min)
  - 热门列表缓存 (TTL: 1min)

### 1.3 前端页面

- [x] **交易页面** `/trade`
  - 代币搜索
  - K 线图表 (Lightweight Charts)
  - 交易面板 + Jupiter/0x 集成

- [x] **Dev 详情页** `/devs/[address]`
  - 信誉评分展示
  - 发币历史列表
  - 跟单订阅按钮 (`use-reputation.ts`)

- [x] **保险市场页** `/insurance`
  - 可投保代币列表
  - 赔率计算器
  - 保单管理 (`use-alphaguard.ts`)

---

## Phase 2: 核心功能开发 🚧 进行中

### 2.1 Dev 信誉系统 ✅

- [x] **评分算法实现** (`services/blockchain.ts`)
  ```
  score = base_score 
        + win_rate_bonus 
        + volume_bonus 
        - rug_penalty 
        - inactive_penalty
  ```

- [x] **数据聚合 Worker**
  - 定时抓取发币数据 (`indexDevHistory`)
  - 定时更新代币状态 (`updateTokenStats`)
  - 检测 Rug Pull 事件 (`checkRugStatus`)

- [x] **信誉合约** (`ReputationRegistry.sol`)
  - Dev 评分存储
  - 红V认证系统
  - 跟单订阅管理

### 2.2 AlphaGuard 保险 ✅

- [x] **智能合约开发** (Solidity)
  - `AlphaGuard.sol` - 保险资金池
  - `AlphaGuardOracle.sol` - Rug 判定预言机

- [x] **前端交互** (`use-alphaguard.ts`)
  - 购买保险流程
  - 理赔申请页面
  - 保单状态追踪

### 2.3 实时数据推送 ✅

- [x] **WebSocket 频道** (`WebSocketServer` Durable Object)
  - `price:{token}` - 实时价格
  - `whale:{token}` - 鲸鱼预警
  - `dev:{address}` - Dev 新发币

- [x] **通知系统** (`services/notifications.ts`)
  - Telegram Bot 集成
  - Discord Webhook
  - 鲸鱼预警通知

### 2.4 核心合约 ✅ **NEW**

- [x] **AlphaNestCore.sol**
  - 积分系统
  - $ALPHA 质押
  - 挖矿权重计算
  - 手续费分配

- [x] **CrossChainVerifier.sol**
  - 跨链持仓验证
  - 签名消息验证
  - 状态聚合

- [x] **TokenFactory.sol**
  - Meme 代币标准化创建
  - 发行费用管理
  - 代币追踪索引

- [x] **AlphaToken.sol**
  - $ALPHA ERC-20 代币
  - 分配管理
  - 燃烧机制

---

## Phase 3: 生态扩展 (Week 9+)

### 3.1 跨链 ETF

- [ ] **虚拟质押系统**
  - Herodotus 存储证明集成
  - Chainlink CCIP 消息传递

- [ ] **ETF 合成**
  - 资产组合管理
  - 权重计算

### 3.2 高级工具

- [ ] **专业 K 线工具**
  - 技术指标
  - 绘图工具

- [ ] **狙击 Bot**
  - 新币监控
  - 自动买入

### 3.3 DAO 治理

- [ ] **投票系统**
  - 提案创建
  - 链上投票

---

## 技术债务 & 优化

| 项目 | 描述 | 优先级 |
|-----|------|--------|
| 单元测试 | API 路由测试覆盖 | P1 |
| E2E 测试 | Playwright 集成测试 | P2 |
| 性能优化 | API 响应时间 < 200ms | P1 |
| 安全审计 | 智能合约审计 | P0 |
| 监控告警 | Sentry 错误追踪 | P1 |

---

## 部署清单

### 开发环境
- [x] Web: https://alphanest.pages.dev
- [ ] API: https://api-dev.alphanest.dev

### 生产环境
- [ ] Web: https://alphanest.dev
- [ ] API: https://api.alphanest.dev
- [ ] 域名 DNS 配置
- [ ] SSL 证书
- [ ] CDN 配置

---

## 里程碑对照 (PRD)

| 编号 | 交付物 | 目标日期 | 状态 |
|-----|--------|---------|------|
| M2.1 | AlphaNest 前端 Beta 版上线 | Week 9 | 🚧 进行中 |
| M2.2 | 多链钱包连接 + 持仓验证系统 | Week 10 | 📋 待开发 |
| M2.3 | Dev 信誉评分系统 V1 | Week 11 | 📋 待开发 |
| M2.4 | 创世积分空投活动启动 | Week 12 | 📋 待开发 |
| M2.5 | 鲸鱼预警 Bot 上线 | Week 14 | 📋 待开发 |
| M2.6 | AlphaGuard 保险 V1 上线 | Week 16 | 📋 待开发 |

---

**最后更新**: 2026-01-10 14:45

---

## 新增完成任务 (2026-01-10)

### 智能合约编译
- [x] 修复 `ReputationRegistry.sol` 保留关键字 `alias` 问题
- [x] 修复 `CrossChainVerifier.sol` mapping 局部变量问题
- [x] 更新 `foundry.toml` solc 版本 (0.8.24) 和 via_ir
- [x] 所有合约编译成功 ✅

### 跟单系统 UI 组件
- [x] `copy-trade-panel.tsx` - 主面板 (标签页/搜索/统计)
- [x] `copy-trade-card.tsx` - 交易员卡片组件
- [x] `copy-trade-list.tsx` - 交易员列表
- [x] `copy-trade-modal.tsx` - 跟单设置弹窗
- [x] `trader-leaderboard.tsx` - 排行榜表格

### API 依赖
- [x] 安装 `@cloudflare/workers-types` 

### 待完成
- [ ] **Sepolia 部署** - 需要配置:
  1. 在 `contracts/.env` 中填写 `PRIVATE_KEY`
  2. 配置可用的 Sepolia RPC URL
  3. 执行: `forge script script/Deploy.s.sol:DeployAllSepolia --rpc-url sepolia --broadcast`
