# Design Document - Frontend Completion

## Introduction

本设计文档基于 requirements.md 中定义的 15 个需求模块，提供详细的技术架构设计、组件设计方案、API 集成方案和数据流设计。

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Pages      │  │  Components  │  │    Hooks     │          │
│  │  (Routes)    │  │   (UI/UX)    │  │  (Logic)     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│         └─────────────────┴──────────────────┘                   │
│                           │                                      │
│  ┌────────────────────────┴────────────────────────┐            │
│  │           State Management Layer                │            │
│  │  (React Context + Wagmi + TanStack Query)       │            │
│  └────────────────────────┬────────────────────────┘            │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                    API & Integration Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Backend API │  │  Smart       │  │  External    │          │
│  │  (REST/WS)   │  │  Contracts   │  │  APIs        │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└──────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | Next.js 14 (App Router) | SSR/SSG, Routing, Performance |
| **UI Components** | shadcn/ui + TailwindCSS | Consistent design system |
| **State Management** | React Context + Zustand | Global state (settings, user prefs) |
| **Blockchain Integration** | Wagmi + Viem | EVM chain interactions |
| **Solana Integration** | @solana/wallet-adapter | Solana wallet & transactions |
| **Data Fetching** | TanStack Query (React Query) | Server state, caching, refetching |
| **Real-time Data** | WebSocket + Server-Sent Events | Price updates, notifications |
| **Charts** | TradingView Lightweight Charts | K-line charts, technical analysis |
| **Forms** | React Hook Form + Zod | Form validation |
| **Internationalization** | next-intl | Multi-language support |

## Component Architecture

### Component Hierarchy

```
app/
├── (dashboard)/
│   ├── page.tsx                    # 首页仪表盘
│   └── components/
│       ├── stats-overview.tsx      # ✅ 已实现 - 需要增强
│       ├── trending-tokens.tsx     # ✅ 已实现 - 需要增强
│       ├── dev-leaderboard.tsx     # ✅ 已实现 - 需要增强
│       ├── recent-activity.tsx     # ✅ 已实现 - 需要增强
│       ├── staking-banner.tsx      # ✅ 已实现
│       └── portfolio-chart.tsx     # ❌ 新增 - 投资组合图表
│
├── trade/
│   ├── page.tsx                    # 交易页面
│   └── components/
│       ├── token-selector.tsx      # ❌ 新增 - 多链代币选择器
│       ├── swap-interface.tsx      # ❌ 新增 - 交易界面
│       ├── price-chart.tsx         # ❌ 新增 - K线图
│       ├── order-book.tsx          # ❌ 新增 - 订单簿
│       ├── trade-history.tsx       # ❌ 新增 - 交易历史
│       └── slippage-settings.tsx   # ❌ 新增 - 滑点设置
│
├── devs/
│   ├── page.tsx                    # Dev 排行榜页面
│   ├── [address]/
│   │   └── page.tsx                # Dev 个人主页
│   └── components/
│       ├── dev-card.tsx            # ❌ 新增 - Dev 卡片
│       ├── dev-stats.tsx           # ❌ 新增 - Dev 统计
│       ├── launch-history.tsx      # ❌ 新增 - 发币历史
│       ├── reputation-score.tsx    # ❌ 新增 - 信誉评分
│       └── follow-button.tsx       # ❌ 新增 - 关注按钮
│
├── insurance/
│   ├── page.tsx                    # 保险市场页面
│   ├── [poolId]/
│   │   └── page.tsx                # 保险详情页
│   └── components/
│       ├── insurance-card.tsx      # ✅ 已实现 - 需要增强
│       ├── purchase-modal.tsx      # ❌ 新增 - 购买弹窗
│       ├── policy-list.tsx         # ❌ 新增 - 保单列表
│       ├── claim-modal.tsx         # ❌ 新增 - 理赔弹窗
│       └── odds-calculator.tsx     # ❌ 新增 - 赔率计算器
│
├── points/
│   ├── page.tsx                    # 积分中心页面
│   └── components/
│       ├── points-balance.tsx      # ✅ 已实现 - 需要增强
│       ├── task-list.tsx           # ❌ 新增 - 任务列表
│       ├── leaderboard.tsx         # ❌ 新增 - 积分排行榜
│       ├── rewards-shop.tsx        # ❌ 新增 - 奖励商店
│       └── level-progress.tsx      # ❌ 新增 - 等级进度
│
├── etf/
│   ├── page.tsx                    # ❌ 新增 - ETF 页面
│   └── components/
│       ├── etf-composer.tsx        # ❌ 新增 - ETF 合成器
│       ├── component-selector.tsx  # ❌ 新增 - 组件选择器
│       ├── mining-weight.tsx       # ❌ 新增 - 挖矿权重显示
│       ├── ash-converter.tsx       # ❌ 新增 - 灰烬积分转换
│       └── etf-portfolio.tsx       # ❌ 新增 - ETF 投资组合
│
├── copy-trade/
│   ├── page.tsx                    # ❌ 新增 - 跟单交易页面
│   └── components/
│       ├── trader-list.tsx         # ❌ 新增 - 交易者列表
│       ├── trader-profile.tsx      # ❌ 新增 - 交易者资料
│       ├── copy-settings.tsx       # ❌ 新增 - 跟单设置
│       └── copy-history.tsx        # ❌ 新增 - 跟单历史
│
├── verify/
│   ├── page.tsx                    # ❌ 新增 - Verify-to-Earn 页面
│   └── components/
│       ├── wallet-connector.tsx    # ❌ 新增 - 多链钱包连接
│       ├── holding-verifier.tsx    # ❌ 新增 - 持仓验证器
│       ├── verification-history.tsx # ❌ 新增 - 验证历史
│       └── rewards-calculator.tsx  # ❌ 新增 - 奖励计算器
│
└── settings/
    ├── page.tsx                    # 设置页面
    └── components/
        ├── trading-settings.tsx    # ❌ 新增 - 交易设置
        ├── notification-settings.tsx # ❌ 新增 - 通知设置
        ├── privacy-settings.tsx    # ✅ 已实现
        ├── wallet-management.tsx   # ❌ 新增 - 钱包管理
        └── theme-settings.tsx      # ✅ 已实现
```

## Data Flow Design

### State Management Strategy

#### 1. Server State (TanStack Query)
用于管理从 API 获取的数据，具有缓存、重新验证和自动刷新功能。

```typescript
// 示例：使用 TanStack Query 管理代币数据
const useTrendingTokens = (chains: string[]) => {
  return useQuery({
    queryKey: ['trending-tokens', chains],
    queryFn: () => ApiService.getTrendingTokens(10, chains),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
};
```

#### 2. Blockchain State (Wagmi)
用于管理链上数据和交易状态。

```typescript
// 示例：使用 Wagmi 读取合约数据
const { data: stakeInfo } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: ALPHANEST_CORE_ABI,
  functionName: 'getStakeInfo',
  args: [userAddress],
});
```

#### 3. Client State (Zustand)
用于管理用户偏好设置、UI 状态等客户端状态。

```typescript
// 示例：使用 Zustand 管理设置
interface SettingsStore {
  slippage: number;
  deadline: number;
  hideBalance: boolean;
  setSlippage: (value: number) => void;
  setDeadline: (value: number) => void;
  toggleHideBalance: () => void;
}

const useSettingsStore = create<SettingsStore>((set) => ({
  slippage: 0.5,
  deadline: 20,
  hideBalance: false,
  setSlippage: (value) => set({ slippage: value }),
  setDeadline: (value) => set({ deadline: value }),
  toggleHideBalance: () => set((state) => ({ hideBalance: !state.hideBalance })),
}));
```

### Real-time Data Flow

```
WebSocket Server
      │
      ├─> Price Updates ──────────> useRealtimeMarket hook
      │                                    │
      ├─> Whale Alerts ───────────> useWhaleAlerts hook
      │                                    │
      ├─> New Token Launches ─────> useNewTokens hook
      │                                    │
      └─> Insurance Events ───────> useInsuranceEvents hook
                                           │
                                           ▼
                                    React Components
                                    (Auto re-render)
```

## API Integration Design

### Backend API Endpoints

#### 1. Platform Stats API
```typescript
GET /api/v1/stats/platform
Response: {
  totalVolume24h: number;
  volumeChange24h: number;
  totalUsers: number;
  usersChange24h: number;
  totalTransactions: number;
  transactionsChange24h: number;
  activeTokens: number;
}
```

#### 2. User Stats API
```typescript
GET /api/v1/stats/user/:address
Response: {
  portfolioValue: number;
  portfolioChange: number;
  pointsBalance: number;
  activePolicies: number;
  totalTrades: number;
  winRate: number;
}
```

#### 3. Trending Tokens API
```typescript
GET /api/v1/tokens/trending?chains[]=solana&chains[]=base&limit=10
Response: {
  success: boolean;
  data: Array<{
    contract_address: string;
    chain: string;
    name: string;
    symbol: string;
    logo_url?: string;
    price_usd: string;
    price_change_24h: number;
    volume_24h: number;
    market_cap: number;
    url?: string;
  }>;
}
```

#### 4. Dev Reputation API
```typescript
GET /api/v1/devs/:address/reputation
Response: {
  address: string;
  alias?: string;
  reputationScore: number;
  totalLaunches: number;
  successfulLaunches: number;
  rugCount: number;
  winRate: number;
  totalVolume: number;
  verificationLevel: 'none' | 'basic' | 'verified' | 'red-v';
  isHighRisk: boolean;
  launchHistory: Array<{
    tokenAddress: string;
    chain: string;
    launchDate: string;
    status: 'active' | 'rugged' | 'graduated';
    marketCap: number;
  }>;
}
```

#### 5. Insurance Pools API
```typescript
GET /api/v1/insurance/pools
Response: {
  pools: Array<{
    poolId: number;
    tokenAddress: string;
    tokenName: string;
    tokenSymbol: string;
    chain: string;
    totalRugBets: string;
    totalSafeBets: string;
    rugOdds: number;
    safeOdds: number;
    expiresAt: number;
    status: 'active' | 'resolved' | 'cancelled';
  }>;
}
```

#### 6. Points & Tasks API
```typescript
GET /api/v1/points/tasks
Response: {
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    points: number;
    type: 'daily' | 'weekly' | 'one-time';
    completed: boolean;
    progress?: number;
    maxProgress?: number;
  }>;
}

POST /api/v1/points/tasks/:taskId/complete
Response: {
  success: boolean;
  pointsEarned: number;
  newBalance: number;
}
```

#### 7. Trading API (DEX Aggregator)
```typescript
GET /api/v1/trade/quote
Query: {
  fromToken: string;
  toToken: string;
  amount: string;
  chain: string;
  slippage: number;
}
Response: {
  quote: {
    fromAmount: string;
    toAmount: string;
    priceImpact: number;
    estimatedGas: string;
    route: Array<{
      dex: string;
      percentage: number;
    }>;
  };
}

POST /api/v1/trade/execute
Body: {
  quoteId: string;
  userAddress: string;
}
Response: {
  txHash: string;
  status: 'pending' | 'success' | 'failed';
}
```

### External API Integration

#### 1. Bitquery (Multi-chain Data)
```typescript
// GraphQL query for Dev launch history
query GetDevLaunches($devAddress: String!) {
  ethereum(network: ethereum) {
    dexTrades(
      options: {limit: 100}
      txSender: {is: $devAddress}
      tradeAmountUsd: {gt: 1000}
    ) {
      token {
        address
        symbol
        name
      }
      tradeAmount(in: USD)
      transaction {
        hash
        txFrom {
          address
        }
      }
    }
  }
}
```

#### 2. DexScreener (Price & Chart Data)
```typescript
GET https://api.dexscreener.com/latest/dex/tokens/:tokenAddress
Response: {
  pairs: Array<{
    chainId: string;
    dexId: string;
    priceUsd: string;
    volume: {
      h24: number;
    };
    priceChange: {
      h24: number;
    };
  }>;
}
```

#### 3. Herodotus/Axiom (Storage Proofs)
```typescript
// Verify user holding on another chain
POST /api/v1/verify/holding
Body: {
  userAddress: string;
  tokenAddress: string;
  chain: string;
  blockNumber: number;
}
Response: {
  verified: boolean;
  balance: string;
  proof: string; // Storage proof
}
```

## Smart Contract Integration

### Contract Interaction Patterns

#### 1. Read Operations (View Functions)
使用 `useReadContract` hook 进行链上数据读取，自动缓存和刷新。

```typescript
// Pattern: Read contract data
const { data, isLoading, refetch } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'getStakeInfo',
  args: [userAddress],
  query: {
    enabled: !!userAddress,
    staleTime: 10000, // 10 seconds
  },
});
```

#### 2. Write Operations (Transactions)
使用 `useWriteContract` + `useWaitForTransactionReceipt` 进行交易提交和确认。

```typescript
// Pattern: Write to contract
const { writeContract, data: hash, isPending } = useWriteContract();
const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

const handleStake = async (amount: string) => {
  writeContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'stake',
    args: [parseEther(amount)],
  });
};
```

#### 3. Multi-step Transactions (Approve + Execute)
处理需要授权的交易流程。

```typescript
// Pattern: Approve + Execute
const [step, setStep] = useState<'idle' | 'approving' | 'executing'>('idle');

const { writeContract: approve } = useWriteContract();
const { writeContract: execute } = useWriteContract();

const handlePurchaseInsurance = async (amount: string) => {
  // Step 1: Check allowance
  const allowance = await readContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress, INSURANCE_CONTRACT],
  });

  // Step 2: Approve if needed
  if (allowance < parseUnits(amount, 6)) {
    setStep('approving');
    approve({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [INSURANCE_CONTRACT, parseUnits(amount, 6)],
    });
    // Wait for approval confirmation...
  }

  // Step 3: Execute main transaction
  setStep('executing');
  execute({
    address: INSURANCE_CONTRACT,
    abi: INSURANCE_ABI,
    functionName: 'purchasePolicy',
    args: [poolId, position, parseUnits(amount, 6)],
  });
};
```

## UI/UX Design Patterns

### Design System

#### Color Palette
```typescript
// Primary colors
const colors = {
  primary: {
    orange: '#F97316', // PopCow brand color
    orangeLight: '#FB923C',
    orangeDark: '#EA580C',
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  chain: {
    base: '#0052FF',
    solana: '#9945FF',
    bnb: '#F3BA2F',
    ethereum: '#627EEA',
  },
};
```

#### Typography
```typescript
// Font sizes
const typography = {
  h1: 'text-3xl font-bold',
  h2: 'text-2xl font-semibold',
  h3: 'text-xl font-semibold',
  body: 'text-base',
  small: 'text-sm',
  xs: 'text-xs',
};
```

#### Spacing
```typescript
// Consistent spacing
const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem',  // 8px
  md: '1rem',    // 16px
  lg: '1.5rem',  // 24px
  xl: '2rem',    // 32px
};
```

### Component Patterns

#### 1. Loading States
```typescript
// Pattern: Skeleton loading
{isLoading ? (
  <ListSkeleton count={5} />
) : (
  <DataList items={data} />
)}
```

#### 2. Error Handling
```typescript
// Pattern: Error boundary with retry
{error ? (
  <ErrorState
    message={error.message}
    onRetry={() => refetch()}
  />
) : (
  <Content />
)}
```

#### 3. Empty States
```typescript
// Pattern: Empty state with CTA
{data.length === 0 ? (
  <EmptyState
    icon={<Inbox />}
    title="No data found"
    description="Get started by..."
    action={<Button>Create New</Button>}
  />
) : (
  <DataList items={data} />
)}
```

#### 4. Confirmation Dialogs
```typescript
// Pattern: Dangerous action confirmation
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Continue
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Performance Optimization

### Code Splitting
```typescript
// Lazy load heavy components
const TradingViewChart = dynamic(
  () => import('@/components/charts/trading-view-chart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
```

### Memoization
```typescript
// Memoize expensive calculations
const miningWeight = useMemo(() => {
  return calculateMiningWeight(stakeAmount, etfComponents);
}, [stakeAmount, etfComponents]);

// Memoize components
const TokenCard = memo(({ token }: { token: Token }) => {
  return <Card>...</Card>;
});
```

### Virtual Scrolling
```typescript
// Use virtual scrolling for long lists
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: tokens.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80,
});
```

### Image Optimization
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src={token.logo_url}
  alt={token.symbol}
  width={40}
  height={40}
  loading="lazy"
/>
```

## Security Considerations

### Input Validation
```typescript
// Validate all user inputs
const amountSchema = z.string()
  .regex(/^\d+(\.\d+)?$/, 'Invalid amount')
  .refine((val) => parseFloat(val) > 0, 'Amount must be positive')
  .refine((val) => parseFloat(val) <= maxAmount, 'Amount exceeds maximum');
```

### Transaction Safety
```typescript
// Always show transaction preview
<TransactionPreview
  action="Stake"
  amount={amount}
  estimatedGas={gasEstimate}
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
```

### Rate Limiting
```typescript
// Implement client-side rate limiting
const { mutate, isLoading } = useMutation({
  mutationFn: submitTransaction,
  onMutate: () => {
    // Prevent double submission
    if (isLoading) throw new Error('Transaction in progress');
  },
});
```

## Correctness Properties

### Property 1: Data Consistency
**Property:** 用户在不同页面看到的相同数据应该保持一致。

**Implementation:**
- 使用 TanStack Query 的全局缓存
- 使用相同的 queryKey 确保数据共享
- 在数据变更后使用 `invalidateQueries` 刷新相关数据

**Test Strategy:**
```typescript
// Property-based test
test('user balance should be consistent across pages', async () => {
  const balance1 = await getBalanceFromDashboard();
  const balance2 = await getBalanceFromTradePage();
  expect(balance1).toBe(balance2);
});
```

### Property 2: Transaction Atomicity
**Property:** 多步骤交易（如 Approve + Execute）应该要么全部成功，要么全部失败。

**Implementation:**
- 使用状态机管理交易流程
- 在每个步骤失败时提供回滚或重试选项
- 记录交易状态到本地存储，页面刷新后可恢复

**Test Strategy:**
```typescript
// Property-based test
test('approve + execute should be atomic', async () => {
  const initialState = await getContractState();
  
  try {
    await approveAndExecute();
    const finalState = await getContractState();
    // Both should succeed
    expect(finalState.approved).toBe(true);
    expect(finalState.executed).toBe(true);
  } catch (error) {
    const finalState = await getContractState();
    // Both should fail (rollback)
    expect(finalState).toEqual(initialState);
  }
});
```

### Property 3: Real-time Data Freshness
**Property:** 实时数据（价格、余额等）的延迟应该小于 2 秒。

**Implementation:**
- 使用 WebSocket 进行实时数据推送
- 设置合理的 `staleTime` 和 `refetchInterval`
- 在用户操作后立即刷新相关数据

**Test Strategy:**
```typescript
// Property-based test
test('price updates should arrive within 2 seconds', async () => {
  const startTime = Date.now();
  const priceUpdate = await waitForPriceUpdate();
  const latency = Date.now() - startTime;
  expect(latency).toBeLessThan(2000);
});
```

### Property 4: Input Validation
**Property:** 所有用户输入应该在客户端和服务端都进行验证。

**Implementation:**
- 使用 Zod schema 定义验证规则
- 在表单提交前进行客户端验证
- 在 API 端点进行服务端验证

**Test Strategy:**
```typescript
// Property-based test
import { fc } from 'fast-check';

test('all inputs should be validated', () => {
  fc.assert(
    fc.property(fc.string(), (input) => {
      const result = validateInput(input);
      // Should either pass validation or return error
      expect(result.success || result.error).toBeDefined();
    })
  );
});
```

### Property 5: Error Recovery
**Property:** 系统应该能够从错误状态恢复，不会永久卡住。

**Implementation:**
- 所有异步操作都有超时机制
- 提供明确的错误信息和重试按钮
- 使用 Error Boundary 捕获组件错误

**Test Strategy:**
```typescript
// Property-based test
test('system should recover from errors', async () => {
  // Simulate various error conditions
  const errors = [NetworkError, TimeoutError, ContractError];
  
  for (const ErrorType of errors) {
    simulateError(ErrorType);
    await waitForRecovery();
    const state = await getSystemState();
    expect(state.isOperational).toBe(true);
  }
});
```

## Testing Strategy

### Unit Tests
- 测试单个组件的渲染和交互
- 测试 hooks 的逻辑
- 测试工具函数

### Integration Tests
- 测试组件之间的交互
- 测试 API 集成
- 测试智能合约交互

### E2E Tests
- 测试完整的用户流程
- 测试跨页面的数据一致性
- 测试实时数据更新

### Property-Based Tests
- 测试系统的不变性质
- 使用 fast-check 生成随机测试数据
- 验证边界条件和异常情况

## Deployment Strategy

### Staging Environment
- 使用测试网（Sepolia, Solana Devnet）
- 模拟真实数据和交易
- 进行完整的 E2E 测试

### Production Rollout
1. **Phase 1**: 部署核心功能（首页、交易、保险）
2. **Phase 2**: 部署 Dev 信誉系统和积分系统
3. **Phase 3**: 部署 ETF 和跟单功能
4. **Phase 4**: 部署高级功能（分析工具、治理）

### Monitoring
- 使用 Sentry 进行错误监控
- 使用 Google Analytics 进行用户行为分析
- 使用 Grafana 进行性能监控
- 设置关键指标告警（API 响应时间、错误率等）

## Conclusion

本设计文档提供了前端完善工作的详细技术方案。下一步将创建 tasks.md，将设计分解为可执行的开发任务。
