# Tasks Document - Frontend Completion

## Overview

本文档将 requirements.md 和 design.md 中定义的功能分解为可执行的开发任务。任务按优先级和依赖关系组织。

## Task Priority Levels

- **P0**: 核心功能，必须完成
- **P1**: 重要功能，应该完成
- **P2**: 增强功能，可以延后

## Task Status

- ⬜ Not Started
- 🟡 In Progress
- ✅ Completed
- ❌ Blocked

---

## Phase 1: 基础设施和核心功能 (Week 1-2)

### Task 1.1: API 服务层完善 (P0)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** None

**Description:**
完善 API 服务层，统一管理所有后端 API 调用。

**Subtasks:**
1. 创建 `apps/web/src/lib/api-services.ts` 文件（如果不存在）
2. 实现所有 API 端点的类型定义和调用方法
3. 添加错误处理和重试逻辑
4. 添加请求/响应拦截器
5. 实现 API 响应缓存策略

**Acceptance Criteria:**
- WHEN 调用任何 API 方法 THEN 应该返回类型安全的响应
- WHEN API 请求失败 THEN 应该自动重试最多 3 次
- WHEN 网络错误 THEN 应该返回友好的错误信息
- THE API 服务 SHALL 支持请求取消功能

**Files to Create/Modify:**
- `apps/web/src/lib/api-services.ts`
- `apps/web/src/lib/api-types.ts`


### Task 1.2: WebSocket 实时数据服务 (P0)
**Status:** ⬜ Not Started  
**Estimated Time:** 3 days  
**Dependencies:** Task 1.1

**Description:**
实现 WebSocket 连接管理和实时数据推送服务。

**Subtasks:**
1. 创建 WebSocket 连接管理器
2. 实现自动重连机制
3. 创建实时价格数据 hook (`useRealtimeMarket`)
4. 创建鲸鱼预警 hook (`useWhaleAlerts`)
5. 创建新币发布通知 hook (`useNewTokens`)
6. 添加连接状态指示器

**Acceptance Criteria:**
- WHEN WebSocket 连接断开 THEN 应该自动重连
- WHEN 收到价格更新 THEN 应该在 2 秒内更新 UI
- THE WebSocket 服务 SHALL 支持订阅/取消订阅特定频道
- THE 系统 SHALL 显示实时连接状态

**Files to Create/Modify:**
- `apps/web/src/lib/websocket.ts`
- `apps/web/src/hooks/use-realtime-data.ts`
- `apps/web/src/components/ui/connection-status.tsx`

### Task 1.3: 多链钱包连接增强 (P0)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** None

**Description:**
增强多链钱包连接功能，支持 EVM 和 Solana 链。

**Subtasks:**
1. 集成 Solana Wallet Adapter
2. 创建统一的钱包连接 hook
3. 实现钱包切换功能
4. 添加钱包连接状态持久化
5. 创建钱包选择器 UI 组件

**Acceptance Criteria:**
- WHEN 用户连接钱包 THEN 应该支持 MetaMask、Phantom 等主流钱包
- WHEN 用户切换链 THEN 应该自动切换钱包网络
- THE 系统 SHALL 记住用户上次连接的钱包
- THE 系统 SHALL 支持同时连接 EVM 和 Solana 钱包

**Files to Create/Modify:**
- `apps/web/src/hooks/use-multi-chain-wallet.ts`
- `apps/web/src/components/wallet/wallet-selector.tsx`
- `apps/web/src/components/wallet/chain-switcher.tsx`


---

## Phase 2: 首页和仪表盘完善 (Week 2-3)

### Task 2.1: 首页数据集成 (P0)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 1.1, Task 1.2

**Description:**
将首页组件从模拟数据切换到真实 API 数据。

**Subtasks:**
1. 更新 `trending-tokens.tsx` 使用真实 API
2. 更新 `dev-leaderboard.tsx` 使用真实 API
3. 更新 `stats-overview.tsx` 使用真实 API
4. 更新 `recent-activity.tsx` 使用真实 API
5. 添加数据刷新功能
6. 添加加载状态和错误处理

**Acceptance Criteria:**
- WHEN 页面加载 THEN 应该从 API 获取真实数据
- WHEN 数据加载失败 THEN 应该显示错误信息和重试按钮
- THE 系统 SHALL 支持手动刷新数据
- THE 数据 SHALL 每 60 秒自动刷新一次

**Files to Modify:**
- `apps/web/src/components/dashboard/trending-tokens.tsx`
- `apps/web/src/components/dashboard/dev-leaderboard.tsx`
- `apps/web/src/components/dashboard/stats-overview.tsx`
- `apps/web/src/components/dashboard/recent-activity.tsx`

### Task 2.2: 投资组合图表组件 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 2.1

**Description:**
创建用户投资组合价值变化图表。

**Subtasks:**
1. 选择图表库（推荐 Recharts 或 Chart.js）
2. 创建 `portfolio-chart.tsx` 组件
3. 实现时间范围选择器（24h, 7d, 30d, 1y）
4. 添加图表交互功能（hover 显示详情）
5. 集成真实投资组合数据 API

**Acceptance Criteria:**
- WHEN 用户连接钱包 THEN 应该显示投资组合价值图表
- WHEN 用户选择时间范围 THEN 图表应该更新
- THE 图表 SHALL 显示价值变化百分比
- THE 图表 SHALL 支持响应式设计

**Files to Create:**
- `apps/web/src/components/dashboard/portfolio-chart.tsx`
- `apps/web/src/hooks/use-portfolio-history.ts`

### Task 2.3: 用户个人统计增强 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 1 day  
**Dependencies:** Task 2.1

**Description:**
增强用户个人统计信息显示。

**Subtasks:**
1. 添加更多统计指标（总盈亏、最佳交易等）
2. 添加统计数据趋势指示器
3. 实现隐私模式（隐藏余额）
4. 添加统计数据导出功能

**Acceptance Criteria:**
- WHEN 用户连接钱包 THEN 应该显示完整的个人统计
- WHEN 用户启用隐私模式 THEN 应该隐藏敏感数据
- THE 系统 SHALL 支持导出统计数据为 CSV
- THE 统计数据 SHALL 实时更新

**Files to Modify:**
- `apps/web/src/components/dashboard/stats-overview.tsx`
- `apps/web/src/hooks/use-privacy-settings.ts`


---

## Phase 3: 交易功能完善 (Week 3-4)

### Task 3.1: 多链代币选择器 (P0)
**Status:** ⬜ Not Started  
**Estimated Time:** 3 days  
**Dependencies:** Task 1.1

**Description:**
创建支持多链的代币选择器组件。

**Subtasks:**
1. 创建代币搜索 API 集成
2. 实现代币列表虚拟滚动
3. 添加链过滤功能
4. 添加代币收藏功能
5. 实现最近使用代币记录
6. 添加代币详情预览

**Acceptance Criteria:**
- WHEN 用户搜索代币 THEN 应该显示多链搜索结果
- WHEN 用户选择链 THEN 应该只显示该链的代币
- THE 系统 SHALL 支持按名称、符号、地址搜索
- THE 系统 SHALL 显示代币价格和 24h 变化

**Files to Create:**
- `apps/web/src/components/trade/token-selector.tsx`
- `apps/web/src/hooks/use-token-search.ts`
- `apps/web/src/lib/token-list.ts`

### Task 3.2: 交易界面组件 (P0)
**Status:** ⬜ Not Started  
**Estimated Time:** 4 days  
**Dependencies:** Task 3.1

**Description:**
创建完整的交易界面，集成 DEX 聚合器。

**Subtasks:**
1. 创建 Swap 界面组件
2. 集成 DEX 聚合器 API（Jupiter for Solana, 1inch for EVM）
3. 实现交易报价获取和刷新
4. 添加滑点设置
5. 添加交易截止时间设置
6. 实现交易确认流程
7. 添加交易历史记录

**Acceptance Criteria:**
- WHEN 用户输入交易金额 THEN 应该实时显示报价
- WHEN 用户执行交易 THEN 应该显示交易进度
- THE 系统 SHALL 显示价格影响和网络费用
- THE 系统 SHALL 支持自定义滑点和截止时间

**Files to Create:**
- `apps/web/src/components/trade/swap-interface.tsx`
- `apps/web/src/components/trade/slippage-settings.tsx`
- `apps/web/src/components/trade/trade-confirmation.tsx`
- `apps/web/src/hooks/use-swap.ts`
- `apps/web/src/lib/dex-aggregator.ts`

### Task 3.3: K 线图集成 (P0)
**Status:** ⬜ Not Started  
**Estimated Time:** 3 days  
**Dependencies:** Task 1.1

**Description:**
集成 TradingView 或自建 K 线图组件。

**Subtasks:**
1. 选择图表方案（TradingView Widget 或 Lightweight Charts）
2. 创建价格图表组件
3. 集成实时价格数据源（DexScreener/Birdeye）
4. 添加时间周期选择器（1m, 5m, 15m, 1h, 4h, 1d）
5. 添加技术指标（MA, RSI, MACD）
6. 实现图表交互功能

**Acceptance Criteria:**
- WHEN 用户选择代币 THEN 应该显示该代币的 K 线图
- WHEN 价格更新 THEN 图表应该实时更新
- THE 图表 SHALL 支持缩放和平移
- THE 图表 SHALL 显示交易量

**Files to Create:**
- `apps/web/src/components/trade/price-chart.tsx`
- `apps/web/src/hooks/use-chart-data.ts`
- `apps/web/src/lib/chart-config.ts`

### Task 3.4: 订单簿和交易历史 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 3.2

**Description:**
显示订单簿和最近交易历史。

**Subtasks:**
1. 创建订单簿组件
2. 创建交易历史组件
3. 集成实时订单数据
4. 添加深度图
5. 实现交易历史过滤和搜索

**Acceptance Criteria:**
- WHEN 用户查看代币 THEN 应该显示实时订单簿
- WHEN 有新交易 THEN 应该实时更新交易历史
- THE 订单簿 SHALL 显示买卖盘深度
- THE 交易历史 SHALL 支持按时间和金额过滤

**Files to Create:**
- `apps/web/src/components/trade/order-book.tsx`
- `apps/web/src/components/trade/trade-history.tsx`
- `apps/web/src/hooks/use-order-book.ts`


---

## Phase 4: Dev 信誉系统 (Week 4-5)

### Task 4.1: Dev 排行榜页面 (P0)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 1.1

**Description:**
创建 Dev 排行榜页面，显示顶级开发者。

**Subtasks:**
1. 创建 `/devs` 页面
2. 实现 Dev 列表组件
3. 添加排序功能（胜率、发币数、总交易量）
4. 添加过滤功能（链、认证级别）
5. 实现分页或无限滚动
6. 添加搜索功能

**Acceptance Criteria:**
- WHEN 用户访问 Dev 页面 THEN 应该显示 Dev 排行榜
- WHEN 用户点击排序 THEN 列表应该重新排序
- THE 系统 SHALL 支持按链过滤 Dev
- THE 系统 SHALL 显示 Dev 认证徽章

**Files to Create:**
- `apps/web/src/app/devs/page.tsx`
- `apps/web/src/components/devs/dev-list.tsx`
- `apps/web/src/components/devs/dev-card.tsx`
- `apps/web/src/hooks/use-dev-list.ts`

### Task 4.2: Dev 个人主页 (P0)
**Status:** ⬜ Not Started  
**Estimated Time:** 3 days  
**Dependencies:** Task 4.1

**Description:**
创建 Dev 个人主页，显示详细信息和历史记录。

**Subtasks:**
1. 创建 `/devs/[address]` 页面
2. 实现 Dev 资料卡组件
3. 创建发币历史列表
4. 添加信誉评分详情
5. 实现关注/取消关注功能
6. 添加 Dev 统计图表

**Acceptance Criteria:**
- WHEN 用户访问 Dev 主页 THEN 应该显示完整资料
- WHEN 用户关注 Dev THEN 应该收到新币通知
- THE 系统 SHALL 显示 Dev 的所有发币历史
- THE 系统 SHALL 显示 Dev 的胜率和 Rug 次数

**Files to Create:**
- `apps/web/src/app/devs/[address]/page.tsx`
- `apps/web/src/components/devs/dev-profile.tsx`
- `apps/web/src/components/devs/launch-history.tsx`
- `apps/web/src/components/devs/reputation-score.tsx`
- `apps/web/src/components/devs/follow-button.tsx`
- `apps/web/src/hooks/use-dev-profile.ts`

### Task 4.3: 多链数据聚合 (P0)
**Status:** ⬜ Not Started  
**Estimated Time:** 4 days  
**Dependencies:** Task 4.2

**Description:**
集成 Bitquery/Covalent API，聚合多链 Dev 数据。

**Subtasks:**
1. 集成 Bitquery GraphQL API
2. 集成 Covalent REST API
3. 实现 Dev 地址追踪
4. 实现关联地址聚类分析
5. 创建数据缓存策略
6. 实现数据同步任务

**Acceptance Criteria:**
- WHEN 查询 Dev 数据 THEN 应该聚合多链数据
- WHEN Dev 发布新币 THEN 应该自动更新数据
- THE 系统 SHALL 识别 Dev 的关联地址
- THE 系统 SHALL 缓存 Dev 数据以提高性能

**Files to Create:**
- `apps/web/src/lib/bitquery-client.ts`
- `apps/web/src/lib/covalent-client.ts`
- `apps/web/src/lib/dev-aggregator.ts`
- `apps/web/src/hooks/use-dev-data.ts`

### Task 4.4: 红V认证申请流程 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 4.2

**Description:**
实现 Dev 红V认证申请和审核流程。

**Subtasks:**
1. 创建认证申请表单
2. 实现身份验证集成（Gitcoin Passport）
3. 创建保证金质押界面
4. 实现申请状态追踪
5. 创建管理员审核界面（后台）

**Acceptance Criteria:**
- WHEN Dev 申请认证 THEN 应该提交所需信息
- WHEN Dev 质押保证金 THEN 应该锁定 $ALPHA
- THE 系统 SHALL 验证 Dev 身份
- THE 系统 SHALL 显示申请状态

**Files to Create:**
- `apps/web/src/components/devs/verification-form.tsx`
- `apps/web/src/hooks/use-verification.ts`


---

## Phase 5: 保险功能完善 (Week 5-6)

### Task 5.1: 保险市场页面 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 1.1

**Description:**
完善保险市场页面，显示所有可投保代币。

**Subtasks:**
1. 更新 `/insurance` 页面布局
2. 实现保险池列表组件
3. 添加过滤和排序功能
4. 显示实时赔率和池子大小
5. 添加保险产品搜索

**Acceptance Criteria:**
- WHEN 用户访问保险页面 THEN 应该显示所有活跃保险池
- WHEN 用户选择过滤条件 THEN 列表应该更新
- THE 系统 SHALL 显示每个池的赔率和到期时间
- THE 系统 SHALL 支持按代币名称搜索

**Files to Modify:**
- `apps/web/src/app/insurance/page.tsx`
- `apps/web/src/components/insurance/insurance-list.tsx`

### Task 5.2: 保险购买流程 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 3 days  
**Dependencies:** Task 5.1

**Description:**
实现完整的保险购买流程。

**Subtasks:**
1. 创建保险购买弹窗
2. 实现赔率计算器
3. 添加 USDC 授权流程
4. 实现保险购买交易
5. 添加购买确认和成功提示
6. 实现购买历史记录

**Acceptance Criteria:**
- WHEN 用户购买保险 THEN 应该完成 USDC 授权和购买
- WHEN 用户输入金额 THEN 应该实时计算潜在赔付
- THE 系统 SHALL 显示交易进度
- THE 系统 SHALL 记录购买历史

**Files to Create:**
- `apps/web/src/components/insurance/purchase-modal.tsx`
- `apps/web/src/components/insurance/odds-calculator.tsx`
- `apps/web/src/hooks/use-insurance-purchase.ts`

### Task 5.3: 保单管理 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 5.2

**Description:**
创建用户保单管理界面。

**Subtasks:**
1. 创建保单列表组件
2. 显示保单状态和到期时间
3. 实现理赔功能
4. 添加保单详情查看
5. 实现保单过滤和搜索

**Acceptance Criteria:**
- WHEN 用户查看保单 THEN 应该显示所有持有的保单
- WHEN 保单可理赔 THEN 应该显示理赔按钮
- THE 系统 SHALL 显示保单状态（活跃、已结算、已理赔）
- THE 系统 SHALL 支持按状态过滤保单

**Files to Create:**
- `apps/web/src/components/insurance/policy-list.tsx`
- `apps/web/src/components/insurance/policy-card.tsx`
- `apps/web/src/components/insurance/claim-modal.tsx`
- `apps/web/src/hooks/use-user-policies.ts`

### Task 5.4: 保险详情页面 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 5.1

**Description:**
创建单个保险池的详情页面。

**Subtasks:**
1. 创建 `/insurance/[poolId]` 页面
2. 显示保险池详细信息
3. 显示投注分布图表
4. 显示历史赔率变化
5. 添加快速购买入口

**Acceptance Criteria:**
- WHEN 用户访问保险详情 THEN 应该显示完整信息
- THE 系统 SHALL 显示看多/看空资金分布
- THE 系统 SHALL 显示历史赔率变化图表
- THE 系统 SHALL 提供快速购买功能

**Files to Create:**
- `apps/web/src/app/insurance/[poolId]/page.tsx`
- `apps/web/src/components/insurance/pool-details.tsx`
- `apps/web/src/components/insurance/bet-distribution.tsx`


---

## Phase 6: 积分系统完善 (Week 6-7)

### Task 6.1: 积分中心页面 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 1.1

**Description:**
完善积分中心页面，显示积分余额和任务。

**Subtasks:**
1. 更新 `/points` 页面布局
2. 显示积分余额和等级
3. 创建任务列表组件
4. 添加积分历史记录
5. 显示积分排行榜

**Acceptance Criteria:**
- WHEN 用户访问积分页面 THEN 应该显示积分余额和等级
- WHEN 用户完成任务 THEN 积分应该实时更新
- THE 系统 SHALL 显示可用任务列表
- THE 系统 SHALL 显示积分获取历史

**Files to Modify:**
- `apps/web/src/app/points/page.tsx`
- `apps/web/src/components/points/points-overview.tsx`

### Task 6.2: 任务系统 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 3 days  
**Dependencies:** Task 6.1

**Description:**
实现完整的任务系统，包括每日任务、周任务等。

**Subtasks:**
1. 创建任务列表组件
2. 实现任务完成检测
3. 添加任务进度显示
4. 实现任务奖励领取
5. 添加任务类型过滤
6. 创建任务详情弹窗

**Acceptance Criteria:**
- WHEN 用户完成任务条件 THEN 应该自动标记为可领取
- WHEN 用户领取奖励 THEN 积分应该增加
- THE 系统 SHALL 支持每日、周、一次性任务
- THE 系统 SHALL 显示任务进度条

**Files to Create:**
- `apps/web/src/components/points/task-list.tsx`
- `apps/web/src/components/points/task-card.tsx`
- `apps/web/src/hooks/use-tasks.ts`

### Task 6.3: 奖励商店 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 6.1

**Description:**
创建积分兑换商店，用户可以用积分兑换权益。

**Subtasks:**
1. 创建奖励商店组件
2. 显示可兑换物品列表
3. 实现积分兑换功能
4. 添加兑换历史记录
5. 实现库存管理

**Acceptance Criteria:**
- WHEN 用户兑换物品 THEN 应该扣除相应积分
- WHEN 物品库存不足 THEN 应该显示缺货状态
- THE 系统 SHALL 显示兑换历史
- THE 系统 SHALL 支持多种奖励类型

**Files to Create:**
- `apps/web/src/components/points/rewards-shop.tsx`
- `apps/web/src/components/points/reward-card.tsx`
- `apps/web/src/hooks/use-rewards.ts`

### Task 6.4: 等级系统 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 6.1

**Description:**
实现用户等级系统和进度显示。

**Subtasks:**
1. 创建等级进度组件
2. 显示当前等级和下一等级
3. 添加等级权益说明
4. 实现等级排行榜
5. 添加等级徽章显示

**Acceptance Criteria:**
- WHEN 用户积分增加 THEN 等级进度应该更新
- WHEN 用户升级 THEN 应该显示升级动画
- THE 系统 SHALL 显示每个等级的权益
- THE 系统 SHALL 显示等级排行榜

**Files to Create:**
- `apps/web/src/components/points/level-progress.tsx`
- `apps/web/src/components/points/level-badge.tsx`
- `apps/web/src/components/points/leaderboard.tsx`
- `apps/web/src/hooks/use-level.ts`


---

## Phase 7: 跨链 ETF 功能 (Week 7-8)

### Task 7.1: ETF 页面基础 (P0)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 1.1, Task 1.3

**Description:**
创建跨链 ETF 功能页面。

**Subtasks:**
1. 创建 `/etf` 页面
2. 显示 ETF 概览信息
3. 创建 ETF 组合列表
4. 显示用户持有的 ETF
5. 添加 ETF 统计数据

**Acceptance Criteria:**
- WHEN 用户访问 ETF 页面 THEN 应该显示 ETF 概览
- THE 系统 SHALL 显示可用的 ETF 组合
- THE 系统 SHALL 显示用户持有的 ETF 价值
- THE 系统 SHALL 显示 ETF 收益率

**Files to Create:**
- `apps/web/src/app/etf/page.tsx`
- `apps/web/src/components/etf/etf-overview.tsx`
- `apps/web/src/components/etf/etf-list.tsx`

### Task 7.2: ETF 合成器 (P0)
**Status:** ⬜ Not Started  
**Estimated Time:** 4 days  
**Dependencies:** Task 7.1

**Description:**
实现 ETF 合成功能，用户可以质押多链代币。

**Subtasks:**
1. 创建 ETF 合成器组件
2. 实现组件代币选择器
3. 集成存储证明验证
4. 实现质押交易
5. 显示挖矿权重计算
6. 添加合成确认流程

**Acceptance Criteria:**
- WHEN 用户选择组件代币 THEN 应该验证持仓
- WHEN 用户质押代币 THEN 应该计算挖矿权重
- THE 系统 SHALL 支持多链代币作为组件
- THE 系统 SHALL 使用存储证明验证持仓

**Files to Create:**
- `apps/web/src/components/etf/etf-composer.tsx`
- `apps/web/src/components/etf/component-selector.tsx`
- `apps/web/src/components/etf/mining-weight.tsx`
- `apps/web/src/hooks/use-etf-compose.ts`
- `apps/web/src/lib/storage-proof.ts`

### Task 7.3: 灰烬积分系统 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 7.2

**Description:**
实现"尸体币"销毁兑换灰烬积分功能。

**Subtasks:**
1. 创建灰烬积分转换器组件
2. 实现归零币检测
3. 实现销毁兑换交易
4. 显示灰烬积分余额
5. 添加灰烬积分使用说明

**Acceptance Criteria:**
- WHEN 用户持有归零币 THEN 应该可以销毁兑换积分
- WHEN 用户销毁代币 THEN 应该获得灰烬积分
- THE 系统 SHALL 自动检测归零币
- THE 系统 SHALL 显示兑换比例

**Files to Create:**
- `apps/web/src/components/etf/ash-converter.tsx`
- `apps/web/src/hooks/use-ash-points.ts`

### Task 7.4: ETF 投资组合管理 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 7.2

**Description:**
创建 ETF 投资组合管理界面。

**Subtasks:**
1. 创建 ETF 投资组合组件
2. 显示持有的 ETF 详情
3. 实现 ETF 赎回功能
4. 显示 ETF 收益历史
5. 添加 ETF 再平衡功能

**Acceptance Criteria:**
- WHEN 用户查看投资组合 THEN 应该显示所有 ETF
- WHEN 用户赎回 ETF THEN 应该返还组件代币
- THE 系统 SHALL 显示 ETF 实时价值
- THE 系统 SHALL 显示收益率图表

**Files to Create:**
- `apps/web/src/components/etf/etf-portfolio.tsx`
- `apps/web/src/components/etf/etf-redeem.tsx`
- `apps/web/src/hooks/use-etf-portfolio.ts`


---

## Phase 8: 跟单交易功能 (Week 8-9)

### Task 8.1: 跟单交易页面 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 1.1

**Description:**
创建跟单交易功能页面。

**Subtasks:**
1. 创建 `/copy-trade` 页面
2. 显示顶级交易者排行榜
3. 创建交易者卡片组件
4. 添加过滤和排序功能
5. 显示跟单统计数据

**Acceptance Criteria:**
- WHEN 用户访问跟单页面 THEN 应该显示交易者列表
- THE 系统 SHALL 显示交易者的胜率和收益率
- THE 系统 SHALL 支持按收益率排序
- THE 系统 SHALL 显示跟单人数

**Files to Create:**
- `apps/web/src/app/copy-trade/page.tsx`
- `apps/web/src/components/copy-trade/trader-list.tsx`
- `apps/web/src/components/copy-trade/trader-card.tsx`

### Task 8.2: 交易者详情页 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 8.1

**Description:**
创建交易者详情页面，显示完整交易历史。

**Subtasks:**
1. 创建交易者资料组件
2. 显示交易历史列表
3. 显示收益率图表
4. 显示持仓分布
5. 添加跟单按钮

**Acceptance Criteria:**
- WHEN 用户查看交易者 THEN 应该显示完整资料
- THE 系统 SHALL 显示所有历史交易
- THE 系统 SHALL 显示收益率曲线
- THE 系统 SHALL 显示当前持仓

**Files to Create:**
- `apps/web/src/components/copy-trade/trader-profile.tsx`
- `apps/web/src/components/copy-trade/trade-history.tsx`
- `apps/web/src/hooks/use-trader-profile.ts`

### Task 8.3: 跟单设置 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 3 days  
**Dependencies:** Task 8.2

**Description:**
实现跟单设置和自动跟单功能。

**Subtasks:**
1. 创建跟单设置弹窗
2. 实现跟单金额和比例设置
3. 添加止损止盈设置
4. 实现自动跟单开关
5. 创建跟单确认流程
6. 实现跟单取消功能

**Acceptance Criteria:**
- WHEN 用户设置跟单 THEN 应该保存设置
- WHEN 交易者交易 THEN 应该自动跟单（如果启用）
- THE 系统 SHALL 支持设置跟单比例
- THE 系统 SHALL 支持止损止盈

**Files to Create:**
- `apps/web/src/components/copy-trade/copy-settings.tsx`
- `apps/web/src/hooks/use-copy-trade.ts`

### Task 8.4: 跟单历史 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 8.3

**Description:**
创建用户跟单历史记录界面。

**Subtasks:**
1. 创建跟单历史组件
2. 显示跟单交易列表
3. 显示跟单收益统计
4. 添加跟单记录过滤
5. 实现跟单详情查看

**Acceptance Criteria:**
- WHEN 用户查看跟单历史 THEN 应该显示所有跟单记录
- THE 系统 SHALL 显示每笔跟单的盈亏
- THE 系统 SHALL 支持按时间和交易者过滤
- THE 系统 SHALL 显示总收益率

**Files to Create:**
- `apps/web/src/components/copy-trade/copy-history.tsx`
- `apps/web/src/hooks/use-copy-history.ts`


---

## Phase 9: Verify-to-Earn 功能 (Week 9-10)

### Task 9.1: Verify-to-Earn 页面 (P0)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 1.3

**Description:**
创建 Verify-to-Earn 功能页面。

**Subtasks:**
1. 创建 `/verify` 页面
2. 显示验证概览信息
3. 创建多链钱包连接器
4. 显示可验证代币列表
5. 显示验证奖励说明

**Acceptance Criteria:**
- WHEN 用户访问验证页面 THEN 应该显示验证说明
- THE 系统 SHALL 支持连接多个链的钱包
- THE 系统 SHALL 显示可验证的代币
- THE 系统 SHALL 显示奖励计算规则

**Files to Create:**
- `apps/web/src/app/verify/page.tsx`
- `apps/web/src/components/verify/verify-overview.tsx`

### Task 9.2: 持仓验证器 (P0)
**Status:** ⬜ Not Started  
**Estimated Time:** 4 days  
**Dependencies:** Task 9.1

**Description:**
实现多链持仓验证功能。

**Subtasks:**
1. 创建持仓验证器组件
2. 集成存储证明技术
3. 实现 EVM 链持仓验证
4. 实现 Solana 链持仓验证
5. 计算验证奖励
6. 实现批量验证功能

**Acceptance Criteria:**
- WHEN 用户验证持仓 THEN 应该使用存储证明
- WHEN 验证成功 THEN 应该获得积分奖励
- THE 系统 SHALL 支持 EVM 和 Solana 链
- THE 系统 SHALL 支持批量验证多个代币

**Files to Create:**
- `apps/web/src/components/verify/holding-verifier.tsx`
- `apps/web/src/components/verify/rewards-calculator.tsx`
- `apps/web/src/hooks/use-verify-holding.ts`
- `apps/web/src/lib/holding-proof.ts`

### Task 9.3: 验证历史 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 9.2

**Description:**
创建验证历史记录界面。

**Subtasks:**
1. 创建验证历史组件
2. 显示验证记录列表
3. 显示验证状态和过期时间
4. 添加验证记录过滤
5. 实现重新验证功能

**Acceptance Criteria:**
- WHEN 用户查看验证历史 THEN 应该显示所有记录
- THE 系统 SHALL 显示验证状态（有效、过期）
- THE 系统 SHALL 显示每次验证获得的积分
- THE 系统 SHALL 支持重新验证过期记录

**Files to Create:**
- `apps/web/src/components/verify/verification-history.tsx`
- `apps/web/src/hooks/use-verification-history.ts`

### Task 9.4: 防作弊机制 (P0)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 9.2

**Description:**
实现防止重复验证和作弊的机制。

**Subtasks:**
1. 实现验证冷却期
2. 检测重复验证
3. 实现验证频率限制
4. 添加异常检测
5. 实现黑名单机制

**Acceptance Criteria:**
- WHEN 用户重复验证 THEN 应该拒绝并提示冷却期
- THE 系统 SHALL 限制验证频率
- THE 系统 SHALL 检测异常验证行为
- THE 系统 SHALL 支持黑名单地址

**Files to Modify:**
- `apps/web/src/hooks/use-verify-holding.ts`
- `apps/web/src/lib/anti-cheat.ts`


---

## Phase 10: 设置和用户管理 (Week 10-11)

### Task 10.1: 交易设置 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** None

**Description:**
创建交易参数设置界面。

**Subtasks:**
1. 创建交易设置组件
2. 实现滑点设置
3. 实现交易截止时间设置
4. 添加 Gas 价格设置
5. 实现设置持久化
6. 添加预设配置

**Acceptance Criteria:**
- WHEN 用户修改设置 THEN 应该保存到本地存储
- THE 系统 SHALL 提供预设配置（保守、标准、激进）
- THE 系统 SHALL 验证设置值的合理性
- THE 设置 SHALL 在所有交易中生效

**Files to Create:**
- `apps/web/src/components/settings/trading-settings.tsx`
- `apps/web/src/hooks/use-trading-settings.ts`

### Task 10.2: 通知设置 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 1.2

**Description:**
创建通知偏好设置界面。

**Subtasks:**
1. 创建通知设置组件
2. 实现浏览器通知权限请求
3. 添加价格提醒设置
4. 添加鲸鱼预警设置
5. 添加 Dev 新币通知设置
6. 实现 Telegram Bot 绑定

**Acceptance Criteria:**
- WHEN 用户启用通知 THEN 应该请求浏览器权限
- THE 系统 SHALL 支持多种通知类型
- THE 系统 SHALL 支持设置通知频率
- THE 系统 SHALL 支持 Telegram 推送

**Files to Create:**
- `apps/web/src/components/settings/notification-settings.tsx`
- `apps/web/src/hooks/use-notification-settings.ts`
- `apps/web/src/lib/notification.ts`

### Task 10.3: 钱包管理 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** Task 1.3

**Description:**
创建钱包管理界面。

**Subtasks:**
1. 创建钱包管理组件
2. 显示已连接的钱包列表
3. 实现钱包添加/移除
4. 显示钱包余额
5. 实现主钱包设置
6. 添加钱包别名功能

**Acceptance Criteria:**
- WHEN 用户连接钱包 THEN 应该显示在列表中
- THE 系统 SHALL 支持同时连接多个钱包
- THE 系统 SHALL 显示每个钱包的余额
- THE 系统 SHALL 支持设置主钱包

**Files to Create:**
- `apps/web/src/components/settings/wallet-management.tsx`
- `apps/web/src/hooks/use-wallet-management.ts`

### Task 10.4: 隐私和安全设置 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** None

**Description:**
创建隐私和安全设置界面。

**Subtasks:**
1. 更新隐私设置组件
2. 添加隐藏余额功能
3. 添加隐藏活动功能
4. 实现交易确认设置
5. 添加会话超时设置
6. 实现数据导出功能

**Acceptance Criteria:**
- WHEN 用户启用隐私模式 THEN 应该隐藏敏感信息
- THE 系统 SHALL 支持交易二次确认
- THE 系统 SHALL 支持设置会话超时
- THE 系统 SHALL 支持导出用户数据

**Files to Modify:**
- `apps/web/src/components/settings/privacy-settings.tsx`
- `apps/web/src/hooks/use-privacy-settings.ts`


---

## Phase 11: 高级功能 (Week 11-12)

### Task 11.1: 数据分析工具 (P2)
**Status:** ⬜ Not Started  
**Estimated Time:** 3 days  
**Dependencies:** Task 3.3

**Description:**
创建高级数据分析工具。

**Subtasks:**
1. 集成 TradingView 高级图表
2. 添加技术指标（RSI、MACD、布林带）
3. 创建持有者分布图
4. 创建鲸鱼地址监控
5. 添加市场情绪分析
6. 实现自定义指标

**Acceptance Criteria:**
- THE 系统 SHALL 提供专业级图表工具
- THE 系统 SHALL 显示持有者分布
- THE 系统 SHALL 监控鲸鱼地址活动
- THE 系统 SHALL 提供市场情绪指标

**Files to Create:**
- `apps/web/src/components/analytics/advanced-chart.tsx`
- `apps/web/src/components/analytics/holder-distribution.tsx`
- `apps/web/src/components/analytics/whale-monitor.tsx`
- `apps/web/src/components/analytics/sentiment-analysis.tsx`

### Task 11.2: 移动端适配 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 4 days  
**Dependencies:** All previous tasks

**Description:**
优化移动端体验和 PWA 支持。

**Subtasks:**
1. 优化所有页面的移动端布局
2. 实现 PWA 配置
3. 添加移动端专用导航
4. 优化触摸交互
5. 实现离线功能
6. 添加安装提示

**Acceptance Criteria:**
- THE 系统 SHALL 在移动端正常显示和操作
- THE 系统 SHALL 支持 PWA 安装
- THE 系统 SHALL 支持基本离线功能
- THE 系统 SHALL 优化移动端性能

**Files to Create/Modify:**
- `apps/web/public/manifest.json`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/components/mobile/*`

### Task 11.3: 性能优化 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 3 days  
**Dependencies:** All previous tasks

**Description:**
全面优化应用性能。

**Subtasks:**
1. 实现代码分割和懒加载
2. 优化图片加载
3. 实现虚拟滚动
4. 优化 API 请求
5. 添加性能监控
6. 优化打包体积

**Acceptance Criteria:**
- THE 首屏加载时间 SHALL < 2 秒
- THE API 响应时间 SHALL < 200ms
- THE Lighthouse 性能分数 SHALL > 90
- THE 打包体积 SHALL < 500KB (gzipped)

**Files to Modify:**
- `apps/web/next.config.js`
- Various component files

### Task 11.4: 错误监控和日志 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 2 days  
**Dependencies:** None

**Description:**
集成错误监控和日志系统。

**Subtasks:**
1. 集成 Sentry 错误监控
2. 实现自定义错误边界
3. 添加用户行为追踪
4. 实现性能监控
5. 添加关键指标告警
6. 创建错误报告界面

**Acceptance Criteria:**
- THE 系统 SHALL 自动捕获和报告错误
- THE 系统 SHALL 追踪用户行为
- THE 系统 SHALL 监控性能指标
- THE 系统 SHALL 在关键指标异常时告警

**Files to Create:**
- `apps/web/src/lib/sentry.ts`
- `apps/web/src/components/error-boundary.tsx`
- `apps/web/src/lib/analytics.ts`


---

## Phase 12: 测试和文档 (Week 12-13)

### Task 12.1: 单元测试 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 4 days  
**Dependencies:** All previous tasks

**Description:**
编写单元测试覆盖核心功能。

**Subtasks:**
1. 设置测试环境（Jest + React Testing Library）
2. 编写组件测试
3. 编写 Hook 测试
4. 编写工具函数测试
5. 实现测试覆盖率报告
6. 达到 80% 测试覆盖率

**Acceptance Criteria:**
- THE 测试覆盖率 SHALL > 80%
- THE 所有核心功能 SHALL 有单元测试
- THE 测试 SHALL 在 CI/CD 中自动运行
- THE 测试 SHALL 包含边界条件

**Files to Create:**
- `apps/web/src/**/*.test.tsx`
- `apps/web/jest.config.js`

### Task 12.2: 集成测试 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 3 days  
**Dependencies:** Task 12.1

**Description:**
编写集成测试验证功能交互。

**Subtasks:**
1. 设置集成测试环境
2. 编写 API 集成测试
3. 编写智能合约集成测试
4. 编写跨组件交互测试
5. 实现测试数据 Mock
6. 添加测试报告

**Acceptance Criteria:**
- THE 系统 SHALL 有完整的集成测试
- THE 测试 SHALL 覆盖主要用户流程
- THE 测试 SHALL 使用 Mock 数据
- THE 测试 SHALL 验证数据一致性

**Files to Create:**
- `apps/web/src/__tests__/integration/*`

### Task 12.3: E2E 测试 (P2)
**Status:** ⬜ Not Started  
**Estimated Time:** 3 days  
**Dependencies:** Task 12.2

**Description:**
编写端到端测试验证完整流程。

**Subtasks:**
1. 设置 Playwright 测试环境
2. 编写关键用户流程测试
3. 编写跨页面测试
4. 实现测试数据准备
5. 添加视觉回归测试
6. 配置 CI/CD 集成

**Acceptance Criteria:**
- THE 系统 SHALL 有 E2E 测试覆盖主要流程
- THE 测试 SHALL 在真实浏览器中运行
- THE 测试 SHALL 包含视觉回归测试
- THE 测试 SHALL 在部署前自动运行

**Files to Create:**
- `apps/web/e2e/*`
- `apps/web/playwright.config.ts`

### Task 12.4: 文档编写 (P1)
**Status:** ⬜ Not Started  
**Estimated Time:** 3 days  
**Dependencies:** All previous tasks

**Description:**
编写完整的项目文档。

**Subtasks:**
1. 编写用户使用指南
2. 编写开发者文档
3. 编写 API 文档
4. 编写部署文档
5. 创建组件 Storybook
6. 编写故障排查指南

**Acceptance Criteria:**
- THE 文档 SHALL 覆盖所有功能
- THE 文档 SHALL 包含代码示例
- THE 文档 SHALL 包含截图和视频
- THE 文档 SHALL 易于理解和搜索

**Files to Create:**
- `docs/user-guide.md`
- `docs/developer-guide.md`
- `docs/api-reference.md`
- `docs/deployment.md`
- `apps/web/.storybook/*`


---

## Task Dependencies Graph

```
Phase 1 (Infrastructure)
├── Task 1.1 (API Services) ──┬──> Phase 2, 3, 4, 5, 6, 7, 8, 9
├── Task 1.2 (WebSocket) ─────┼──> Phase 2, 10
└── Task 1.3 (Wallet) ────────┴──> Phase 7, 9, 10

Phase 2 (Dashboard)
├── Task 2.1 (Data Integration) ──> Task 2.2, 2.3
├── Task 2.2 (Portfolio Chart)
└── Task 2.3 (User Stats)

Phase 3 (Trading)
├── Task 3.1 (Token Selector) ──> Task 3.2
├── Task 3.2 (Swap Interface) ──> Task 3.4
├── Task 3.3 (Price Chart)
└── Task 3.4 (Order Book)

Phase 4 (Dev Reputation)
├── Task 4.1 (Dev List) ──> Task 4.2
├── Task 4.2 (Dev Profile) ──> Task 4.3, 4.4
├── Task 4.3 (Data Aggregation)
└── Task 4.4 (Verification)

Phase 5 (Insurance)
├── Task 5.1 (Insurance Market) ──> Task 5.2, 5.4
├── Task 5.2 (Purchase Flow) ──> Task 5.3
├── Task 5.3 (Policy Management)
└── Task 5.4 (Pool Details)

Phase 6 (Points)
├── Task 6.1 (Points Center) ──> Task 6.2, 6.3, 6.4
├── Task 6.2 (Task System)
├── Task 6.3 (Rewards Shop)
└── Task 6.4 (Level System)

Phase 7 (ETF)
├── Task 7.1 (ETF Page) ──> Task 7.2, 7.4
├── Task 7.2 (ETF Composer) ──> Task 7.3
├── Task 7.3 (Ash Points)
└── Task 7.4 (ETF Portfolio)

Phase 8 (Copy Trade)
├── Task 8.1 (Copy Trade Page) ──> Task 8.2
├── Task 8.2 (Trader Profile) ──> Task 8.3
├── Task 8.3 (Copy Settings) ──> Task 8.4
└── Task 8.4 (Copy History)

Phase 9 (Verify-to-Earn)
├── Task 9.1 (Verify Page) ──> Task 9.2
├── Task 9.2 (Holding Verifier) ──> Task 9.3, 9.4
├── Task 9.3 (Verification History)
└── Task 9.4 (Anti-Cheat)

Phase 10 (Settings)
├── Task 10.1 (Trading Settings)
├── Task 10.2 (Notification Settings)
├── Task 10.3 (Wallet Management)
└── Task 10.4 (Privacy Settings)

Phase 11 (Advanced)
├── Task 11.1 (Analytics Tools)
├── Task 11.2 (Mobile Optimization)
├── Task 11.3 (Performance)
└── Task 11.4 (Error Monitoring)

Phase 12 (Testing & Docs)
├── Task 12.1 (Unit Tests) ──> Task 12.2
├── Task 12.2 (Integration Tests) ──> Task 12.3
├── Task 12.3 (E2E Tests)
└── Task 12.4 (Documentation)
```

---

## Task Summary

### By Priority

**P0 (Critical - Must Have):**
- 15 tasks
- Estimated time: 38 days
- Focus: Core functionality, data integration, blockchain interaction

**P1 (Important - Should Have):**
- 28 tasks
- Estimated time: 62 days
- Focus: User experience, advanced features, settings

**P2 (Nice to Have - Could Have):**
- 3 tasks
- Estimated time: 9 days
- Focus: Advanced analytics, optimization

**Total:** 46 tasks, ~109 days (with parallel work, can be completed in 13 weeks)

### By Phase

| Phase | Tasks | Days | Status |
|-------|-------|------|--------|
| Phase 1: Infrastructure | 3 | 7 | ⬜ |
| Phase 2: Dashboard | 3 | 5 | ⬜ |
| Phase 3: Trading | 4 | 12 | ⬜ |
| Phase 4: Dev Reputation | 4 | 11 | ⬜ |
| Phase 5: Insurance | 4 | 9 | ⬜ |
| Phase 6: Points | 4 | 9 | ⬜ |
| Phase 7: ETF | 4 | 10 | ⬜ |
| Phase 8: Copy Trade | 4 | 9 | ⬜ |
| Phase 9: Verify-to-Earn | 4 | 10 | ⬜ |
| Phase 10: Settings | 4 | 8 | ⬜ |
| Phase 11: Advanced | 4 | 12 | ⬜ |
| Phase 12: Testing & Docs | 4 | 13 | ⬜ |

---

## Next Steps

1. **Review and Approve Tasks**: 请审查任务列表，确认优先级和时间估算
2. **Assign Resources**: 分配开发人员到各个任务
3. **Setup Project Board**: 在 GitHub Projects 或 Jira 中创建任务看板
4. **Start Phase 1**: 从基础设施任务开始实施
5. **Weekly Reviews**: 每周审查进度，调整计划

## Notes

- 任务时间估算基于单个开发者的工作量
- 多个任务可以并行开发
- 建议每个 Phase 完成后进行代码审查和测试
- 优先完成 P0 任务，确保核心功能可用
- P2 任务可以根据实际情况延后或取消
