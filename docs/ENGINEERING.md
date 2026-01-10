# **AlphaNest 工程文档**

**版本**：v1.0  
**更新日期**：2024年  
**部署平台**：Cloudflare Pages + Workers

---

## **目录**

1. 项目结构
2. 技术栈
3. Cloudflare 部署架构
4. 环境配置
5. API 规范
6. 数据库设计
7. 开发指南
8. CI/CD 流程

---

## **1. 项目结构**

```
alphanest/
├── apps/
│   ├── web/                    # Next.js 前端应用
│   │   ├── app/                # App Router 页面
│   │   │   ├── (dashboard)/    # 仪表盘路由组
│   │   │   ├── (trade)/        # 交易页路由组
│   │   │   ├── dev/[address]/  # Dev 个人主页
│   │   │   ├── insurance/      # 保险市场
│   │   │   └── api/            # API Routes
│   │   ├── components/         # React 组件
│   │   │   ├── ui/             # 基础 UI 组件 (shadcn)
│   │   │   ├── charts/         # 图表组件
│   │   │   ├── wallet/         # 钱包相关组件
│   │   │   └── layout/         # 布局组件
│   │   ├── lib/                # 工具函数
│   │   ├── hooks/              # 自定义 Hooks
│   │   ├── stores/             # Zustand 状态管理
│   │   └── styles/             # 全局样式
│   │
│   └── api/                    # Cloudflare Workers API
│       ├── src/
│       │   ├── routes/         # API 路由
│       │   ├── services/       # 业务逻辑
│       │   ├── middleware/     # 中间件
│       │   └── utils/          # 工具函数
│       └── wrangler.toml       # Workers 配置
│
├── packages/
│   ├── contracts/              # 智能合约
│   │   ├── src/
│   │   │   ├── AlphaNestCore.sol
│   │   │   ├── ReputationRegistry.sol
│   │   │   ├── AlphaGuard.sol
│   │   │   └── CrossChainVerifier.sol
│   │   ├── test/
│   │   └── deploy/
│   │
│   ├── sdk/                    # AlphaNest SDK
│   │   ├── src/
│   │   └── package.json
│   │
│   └── shared/                 # 共享类型和工具
│       ├── types/
│       └── constants/
│
├── infrastructure/
│   ├── cloudflare/             # Cloudflare 配置
│   │   ├── workers/
│   │   └── pages/
│   └── database/               # 数据库迁移
│       └── migrations/
│
├── turbo.json                  # Turborepo 配置
├── package.json
└── README.md
```

---

## **2. 技术栈**

### 2.1 前端技术

| 技术 | 版本 | 用途 |
|-----|-----|-----|
| **Next.js** | 14.x | React 框架，SSR/SSG 支持 |
| **React** | 18.x | UI 库 |
| **TypeScript** | 5.x | 类型安全 |
| **TailwindCSS** | 3.x | 原子化 CSS |
| **shadcn/ui** | latest | UI 组件库 |
| **Zustand** | 4.x | 状态管理 |
| **TanStack Query** | 5.x | 数据请求与缓存 |
| **Lightweight Charts** | 4.x | K线图表 |
| **RainbowKit** | 2.x | EVM 钱包连接 |
| **Wagmi** | 2.x | EVM 交互 Hooks |
| **@solana/wallet-adapter** | latest | Solana 钱包连接 |

### 2.2 后端技术

| 技术 | 用途 |
|-----|-----|
| **Cloudflare Workers** | Serverless API |
| **Cloudflare D1** | SQLite 边缘数据库 |
| **Cloudflare KV** | 键值存储（缓存） |
| **Cloudflare R2** | 对象存储 |
| **Cloudflare Queues** | 消息队列 |
| **Hono** | Workers Web 框架 |

### 2.3 区块链技术

| 技术 | 用途 |
|-----|-----|
| **Viem** | EVM 链交互 |
| **@solana/web3.js** | Solana 链交互 |
| **Foundry** | 智能合约开发框架 |
| **The Graph** | 链上数据索引 |

---

## **3. Cloudflare 部署架构**

### 3.1 架构图

```
                    ┌─────────────────────────────────────┐
                    │         Cloudflare CDN/Edge         │
                    │    (全球 300+ 节点，自动就近路由)     │
                    └─────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
          ┌─────────▼─────────┐           ┌────────────▼────────────┐
          │  Cloudflare Pages │           │   Cloudflare Workers    │
          │   (前端静态资源)    │           │      (API 服务)         │
          │   alphanest.dev   │           │  api.alphanest.dev      │
          └─────────┬─────────┘           └────────────┬────────────┘
                    │                                   │
                    │                     ┌─────────────┼─────────────┐
                    │                     │             │             │
                    │              ┌──────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
                    │              │ Cloudflare  │ │   D1    │ │   Queues    │
                    │              │     KV      │ │ SQLite  │ │  消息队列   │
                    │              │   (缓存)    │ │ (数据库) │ │            │
                    │              └─────────────┘ └─────────┘ └─────────────┘
                    │
          ┌─────────▼─────────────────────────────────────────────────┐
          │                      外部服务                              │
          ├─────────────┬─────────────┬─────────────┬─────────────────┤
          │  Solana RPC │  Base RPC   │  The Graph  │  External APIs  │
          │  (Helius)   │  (Alchemy)  │  (Subgraph) │  (DexScreener)  │
          └─────────────┴─────────────┴─────────────┴─────────────────┘
```

### 3.2 服务分工

| 服务 | 职责 | 域名 |
|-----|-----|-----|
| **Cloudflare Pages** | 前端静态托管、SSR | `alphanest.dev` |
| **Cloudflare Workers** | API 服务、业务逻辑 | `api.alphanest.dev` |
| **Cloudflare D1** | 用户数据、交易记录 | 内部访问 |
| **Cloudflare KV** | 热点缓存、会话存储 | 内部访问 |
| **Cloudflare R2** | 图片、静态资源存储 | `assets.alphanest.dev` |
| **Cloudflare Queues** | 异步任务处理 | 内部访问 |

---

## **4. 环境配置**

### 4.1 环境变量

创建 `.env.local` (前端) 和 `.dev.vars` (Workers):

```bash
# ============================================
# 前端环境变量 (apps/web/.env.local)
# ============================================

# 应用配置
NEXT_PUBLIC_APP_URL=https://alphanest.dev
NEXT_PUBLIC_API_URL=https://api.alphanest.dev

# 钱包连接
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_ALCHEMY_ID=your_alchemy_id

# 链配置
NEXT_PUBLIC_BASE_CHAIN_ID=8453
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# 功能开关
NEXT_PUBLIC_ENABLE_INSURANCE=true
NEXT_PUBLIC_ENABLE_TRADING=true

# ============================================
# Workers 环境变量 (apps/api/.dev.vars)
# ============================================

# 数据库
DATABASE_URL=your_d1_database_id

# RPC 节点
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=xxx
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/xxx
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/xxx

# API 密钥
BITQUERY_API_KEY=your_bitquery_api_key
COVALENT_API_KEY=your_covalent_api_key
DEXSCREENER_API_KEY=your_dexscreener_api_key

# 安全
JWT_SECRET=your_super_secret_jwt_key
API_RATE_LIMIT=100

# 智能合约地址
CONTRACT_ALPHANEST_CORE=0x...
CONTRACT_REPUTATION_REGISTRY=0x...
CONTRACT_ALPHAGUARD=0x...
```

### 4.2 Cloudflare Wrangler 配置

**`apps/api/wrangler.toml`**:

```toml
name = "alphanest-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# 账户配置
account_id = "your_account_id"

# 路由配置
routes = [
  { pattern = "api.alphanest.dev/*", zone_name = "alphanest.dev" }
]

# D1 数据库绑定
[[d1_databases]]
binding = "DB"
database_name = "alphanest-db"
database_id = "your_database_id"

# KV 命名空间绑定
[[kv_namespaces]]
binding = "CACHE"
id = "your_kv_namespace_id"

[[kv_namespaces]]
binding = "SESSIONS"
id = "your_sessions_kv_id"

# R2 存储桶绑定
[[r2_buckets]]
binding = "ASSETS"
bucket_name = "alphanest-assets"

# Queue 绑定
[[queues.producers]]
binding = "TASK_QUEUE"
queue = "alphanest-tasks"

[[queues.consumers]]
queue = "alphanest-tasks"
max_batch_size = 10
max_batch_timeout = 30

# 环境变量
[vars]
ENVIRONMENT = "production"
LOG_LEVEL = "info"

# 开发环境配置
[env.dev]
name = "alphanest-api-dev"
routes = [
  { pattern = "api-dev.alphanest.dev/*", zone_name = "alphanest.dev" }
]

[env.dev.vars]
ENVIRONMENT = "development"
LOG_LEVEL = "debug"
```

---

## **5. API 规范**

### 5.1 通用响应格式

```typescript
// 成功响应
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// 错误响应
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

### 5.2 核心 API 端点

#### 用户模块

```typescript
// POST /api/v1/user/connect
// 钱包连接与会话创建
interface ConnectRequest {
  wallet_address: string;
  chain: 'solana' | 'base' | 'ethereum' | 'bnb';
  signature: string;
  message: string;
}

interface ConnectResponse {
  user_id: string;
  token: string;  // JWT
  expires_at: number;
}

// POST /api/v1/user/verify-holding
// 验证多链持仓
interface VerifyHoldingRequest {
  chain: string;
  token_address: string;
  proof?: string;  // 存储证明（跨链验证）
}

interface VerifyHoldingResponse {
  verified: boolean;
  balance: string;
  points_earned: number;
}
```

#### 信誉模块

```typescript
// GET /api/v1/dev/{address}/score
interface DevScoreResponse {
  address: string;
  score: number;  // 0-100
  rank: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  verified: boolean;
  stats: {
    total_launches: number;
    successful_launches: number;
    win_rate: number;
    avg_ath_multiplier: number;
    rug_count: number;
    total_volume: string;
  };
  history: LaunchRecord[];
}

// GET /api/v1/dev/leaderboard
interface LeaderboardRequest {
  page?: number;
  limit?: number;
  sort_by?: 'score' | 'win_rate' | 'volume';
  chain?: string;
}
```

#### 保险模块

```typescript
// GET /api/v1/insurance/products
interface InsuranceProduct {
  token_address: string;
  token_symbol: string;
  chain: string;
  premium_rate: number;  // 保费率
  coverage_limit: string;
  pool_size: string;
  expiry_options: number[];  // 可选到期时间（秒）
  current_odds: {
    rug: number;
    safe: number;
  };
}

// POST /api/v1/insurance/purchase
interface PurchaseInsuranceRequest {
  token_address: string;
  coverage_amount: string;
  expiry_seconds: number;
  position: 'rug' | 'safe';
}

interface PurchaseInsuranceResponse {
  policy_id: string;
  premium_paid: string;
  coverage: string;
  potential_payout: string;
  expires_at: number;
  tx_hash: string;
}
```

### 5.3 WebSocket 规范

```typescript
// 连接地址: wss://api.alphanest.dev/ws

// 订阅消息
interface SubscribeMessage {
  type: 'subscribe';
  channels: string[];  // ['price:0x...', 'whale:0x...']
}

// 取消订阅
interface UnsubscribeMessage {
  type: 'unsubscribe';
  channels: string[];
}

// 价格更新推送
interface PriceUpdate {
  type: 'price';
  token_address: string;
  price_usd: string;
  price_change_24h: number;
  volume_24h: string;
  timestamp: number;
}

// 鲸鱼预警推送
interface WhaleAlert {
  type: 'whale';
  token_address: string;
  wallet_address: string;
  action: 'buy' | 'sell';
  amount: string;
  value_usd: string;
  tx_hash: string;
  timestamp: number;
}

// Dev 新发币通知
interface DevLaunchAlert {
  type: 'dev_launch';
  dev_address: string;
  token_address: string;
  token_name: string;
  token_symbol: string;
  chain: string;
  initial_liquidity: string;
  timestamp: number;
}
```

---

## **6. 数据库设计**

### 6.1 D1 Schema (SQLite)

```sql
-- 用户表
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  
  -- 用户数据
  total_points INTEGER NOT NULL DEFAULT 0,
  reputation_score INTEGER NOT NULL DEFAULT 0,
  verification_level INTEGER NOT NULL DEFAULT 0,
  
  -- 设置
  notification_telegram TEXT,
  notification_discord TEXT,
  auto_follow_enabled INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_points ON users(total_points DESC);

-- 用户连接的链
CREATE TABLE user_chains (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  chain TEXT NOT NULL,
  chain_address TEXT NOT NULL,
  verified_at INTEGER,
  last_balance TEXT,
  
  UNIQUE(user_id, chain)
);

-- Dev 表
CREATE TABLE devs (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  alias TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  
  -- 信誉数据
  score INTEGER NOT NULL DEFAULT 50,
  tier TEXT NOT NULL DEFAULT 'bronze',
  verified INTEGER NOT NULL DEFAULT 0,
  verification_stake TEXT,
  
  -- 统计数据
  total_launches INTEGER NOT NULL DEFAULT 0,
  successful_launches INTEGER NOT NULL DEFAULT 0,
  rug_count INTEGER NOT NULL DEFAULT 0,
  total_volume TEXT NOT NULL DEFAULT '0',
  avg_ath_multiplier REAL NOT NULL DEFAULT 0
);

CREATE INDEX idx_devs_wallet ON devs(wallet_address);
CREATE INDEX idx_devs_score ON devs(score DESC);

-- 代币表
CREATE TABLE tokens (
  id TEXT PRIMARY KEY,
  contract_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimals INTEGER NOT NULL DEFAULT 18,
  
  -- 创建者
  creator_dev_id TEXT REFERENCES devs(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  
  -- 状态
  status TEXT NOT NULL DEFAULT 'active',  -- active, graduated, rugged, dead
  rug_detected_at INTEGER,
  
  -- 市场数据（定期更新）
  market_cap TEXT,
  holder_count INTEGER,
  liquidity TEXT,
  ath_market_cap TEXT,
  
  UNIQUE(contract_address, chain)
);

CREATE INDEX idx_tokens_address ON tokens(contract_address, chain);
CREATE INDEX idx_tokens_creator ON tokens(creator_dev_id);
CREATE INDEX idx_tokens_status ON tokens(status);

-- 保险保单表
CREATE TABLE insurance_policies (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token_id TEXT NOT NULL REFERENCES tokens(id),
  
  -- 保单详情
  position TEXT NOT NULL,  -- 'rug' or 'safe'
  premium_paid TEXT NOT NULL,
  coverage_amount TEXT NOT NULL,
  potential_payout TEXT NOT NULL,
  
  -- 时间
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL,
  
  -- 状态
  status TEXT NOT NULL DEFAULT 'active',  -- active, expired, claimed, settled
  settled_at INTEGER,
  payout_amount TEXT,
  settlement_tx TEXT
);

CREATE INDEX idx_policies_user ON insurance_policies(user_id);
CREATE INDEX idx_policies_token ON insurance_policies(token_id);
CREATE INDEX idx_policies_status ON insurance_policies(status);

-- 交易记录表
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  tx_hash TEXT NOT NULL,
  chain TEXT NOT NULL,
  
  -- 交易详情
  action_type TEXT NOT NULL,  -- swap, stake, claim, insurance_purchase, etc.
  token_in TEXT,
  token_out TEXT,
  amount_in TEXT,
  amount_out TEXT,
  
  -- 元数据
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, confirmed, failed
  block_number INTEGER,
  gas_used TEXT
);

CREATE INDEX idx_tx_user ON transactions(user_id);
CREATE INDEX idx_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_tx_created ON transactions(created_at DESC);

-- 用户跟单订阅
CREATE TABLE dev_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  dev_id TEXT NOT NULL REFERENCES devs(id),
  
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  
  -- 设置
  notify_telegram INTEGER NOT NULL DEFAULT 1,
  notify_discord INTEGER NOT NULL DEFAULT 0,
  auto_buy_enabled INTEGER NOT NULL DEFAULT 0,
  auto_buy_amount TEXT,
  
  UNIQUE(user_id, dev_id)
);

CREATE INDEX idx_subs_user ON dev_subscriptions(user_id);
CREATE INDEX idx_subs_dev ON dev_subscriptions(dev_id);

-- 积分记录
CREATE TABLE points_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,  -- verify_holding, quest_complete, referral, etc.
  reference_id TEXT,  -- 关联的任务/交易 ID
  
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_points_user ON points_history(user_id);
CREATE INDEX idx_points_created ON points_history(created_at DESC);
```

### 6.2 KV 存储结构

```typescript
// 缓存命名空间: CACHE

// 代币价格缓存
// Key: price:{chain}:{token_address}
// TTL: 10 seconds
interface PriceCache {
  price_usd: string;
  price_change_24h: number;
  volume_24h: string;
  updated_at: number;
}

// Dev 评分缓存
// Key: dev_score:{address}
// TTL: 5 minutes
interface DevScoreCache {
  score: number;
  tier: string;
  stats: DevStats;
  updated_at: number;
}

// 热门代币列表缓存
// Key: trending:{chain}
// TTL: 1 minute
interface TrendingCache {
  tokens: TrendingToken[];
  updated_at: number;
}

// 会话命名空间: SESSIONS

// 用户会话
// Key: session:{session_id}
// TTL: 24 hours
interface SessionData {
  user_id: string;
  wallet_address: string;
  chains: string[];
  created_at: number;
  last_active: number;
}
```

---

## **7. 开发指南**

### 7.1 本地开发环境设置

```bash
# 1. 克隆仓库
git clone https://github.com/alphanest/alphanest.git
cd alphanest

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.dev.vars.example apps/api/.dev.vars

# 4. 初始化本地数据库
cd apps/api
npx wrangler d1 create alphanest-db-local
npx wrangler d1 execute alphanest-db-local --local --file=./migrations/001_init.sql

# 5. 启动开发服务
pnpm dev
```

### 7.2 项目脚本

```json
{
  "scripts": {
    "dev": "turbo dev",
    "dev:web": "turbo dev --filter=web",
    "dev:api": "turbo dev --filter=api",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "db:migrate": "wrangler d1 migrations apply alphanest-db",
    "db:seed": "wrangler d1 execute alphanest-db --file=./seed.sql",
    "deploy:api": "wrangler deploy --env production",
    "deploy:web": "npx @cloudflare/next-on-pages",
    "contracts:compile": "forge build",
    "contracts:test": "forge test",
    "contracts:deploy": "forge script script/Deploy.s.sol --broadcast"
  }
}
```

### 7.3 代码规范

```typescript
// ESLint + Prettier 配置已预设
// 提交前会自动运行 lint-staged

// 命名规范
// - 文件名: kebab-case (user-service.ts)
// - 组件: PascalCase (UserProfile.tsx)
// - 函数/变量: camelCase (getUserScore)
// - 常量: SCREAMING_SNAKE_CASE (MAX_RETRY_COUNT)
// - 类型/接口: PascalCase (UserProfile)

// 组件结构
// components/
//   user-profile/
//     index.tsx        # 主组件
//     user-profile.tsx # 实现
//     user-profile.test.tsx
//     use-user-profile.ts  # 相关 Hook
```

---

## **8. CI/CD 流程**

### 8.1 GitHub Actions 工作流

**`.github/workflows/deploy.yml`**:

```yaml
name: Deploy AlphaNest

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test

  deploy-api:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm build --filter=api
      
      - name: Deploy to Cloudflare Workers
        working-directory: apps/api
        run: npx wrangler deploy --env production

  deploy-web:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm build --filter=web
      
      - name: Deploy to Cloudflare Pages
        working-directory: apps/web
        run: npx wrangler pages deploy .vercel/output/static --project-name=alphanest
```

### 8.2 部署检查清单

- [ ] 所有测试通过
- [ ] TypeScript 无类型错误
- [ ] ESLint 无警告
- [ ] 环境变量已配置
- [ ] 数据库迁移已执行
- [ ] 智能合约已部署并验证
- [ ] DNS 记录已配置
- [ ] SSL 证书已激活
- [ ] Rate Limiting 已启用
- [ ] 监控告警已配置

---

## **附录**

### A. 常用命令速查

```bash
# Wrangler 命令
wrangler dev                    # 本地启动 Workers
wrangler deploy                 # 部署到生产
wrangler d1 execute DB --local  # 本地执行 SQL
wrangler kv:key put CACHE key value  # KV 写入
wrangler tail                   # 实时日志

# Turborepo 命令
turbo dev                       # 启动所有开发服务
turbo build                     # 构建所有包
turbo dev --filter=web          # 仅启动前端

# Foundry 命令
forge build                     # 编译合约
forge test                      # 运行测试
forge script Deploy --broadcast # 部署合约
cast call <address> "balanceOf(address)" <user>  # 调用合约
```

### B. 故障排查

| 问题 | 可能原因 | 解决方案 |
|-----|---------|---------|
| Workers 超时 | 外部 API 响应慢 | 增加缓存，使用 Queues 异步处理 |
| D1 查询慢 | 缺少索引 | 检查并添加必要索引 |
| KV 读取失败 | 命名空间未绑定 | 检查 wrangler.toml 配置 |
| WebSocket 断连 | 超过连接限制 | 实现重连逻辑，优化连接数 |
| 前端 500 错误 | SSR 渲染失败 | 检查服务端数据获取逻辑 |

---

**文档维护**: 请在修改架构或关键配置时同步更新此文档。
