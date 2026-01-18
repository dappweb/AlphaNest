# 页面数据来源全面检查报告

## 1. 首页 (page.tsx)

### 数据来源
- ✅ **热门代币**: `useTrendingTokens()` 
  - 主数据源: `https://frontend-api.pump.fun/coins`
  - 增强数据: Helius API (Jupiter Price API + DexScreener)
  - 状态: ✅ 已优化，使用 Helius 增强

- ✅ **新代币**: `useNewTokens()`
  - 主数据源: `https://frontend-api.pump.fun/coins`
  - 增强数据: Helius API (Jupiter Price API + DexScreener)
  - 状态: ✅ 已优化，使用 Helius 增强

## 2. 质押页面 (staking/page.tsx)

### 数据来源
- ✅ **质押信息**: `useSolanaStaking()`
  - 数据源: Solana 链上数据 (通过 Helius RPC)
  - 价格数据: Helius API (Jupiter Price API)
  - 余额数据: `useHeliusTokenBalances()`
  - 状态: ✅ 正确配置

- ✅ **推荐系统**: `useStakingReferral()`
  - 数据源: Solana 链上数据 (推荐系统程序)
  - 状态: ✅ 正确配置

## 3. 保险页面 (insurance/page.tsx)

### 数据来源
- ✅ **保险产品**: `useSolanaProductInfo()`
  - 数据源: Solana 链上数据 (保险程序)
  - 状态: ✅ 正确配置

- ✅ **我的保单**: `useSolanaPolicies()`
  - 数据源: Solana 链上数据 (保险程序)
  - 状态: ✅ 正确配置

- ⚠️ **保险服务**: `lib/api.ts` 中有 mock 数据作为后备
  - 状态: ⚠️ 需要检查，确保优先使用真实 API

## 4. 仪表板 (dashboard/stats-overview.tsx)

### 数据来源
- ✅ **平台统计**: `ApiService.getPlatformStats()`
  - API: `${API_URL}/api/v1/analytics/platform-stats`
  - 后备: 默认数据（静默失败）
  - 状态: ✅ 正确配置

- ✅ **用户统计**: `ApiService.getUserStats()`
  - API: `${API_URL}/api/v1/analytics/user-stats`
  - 后备: 默认数据（静默失败）
  - 状态: ✅ 正确配置

- ⚠️ **默认数据**: 硬编码的默认值
  - 状态: ⚠️ 正常，作为后备数据

## 5. 交易历史 (use-transaction-history.ts)

### 数据来源
- ✅ **交易历史**: 
  - API: `${API_URL}/api/v1/account/transactions`
  - 状态: ✅ 正确配置

## 6. 代币余额 (use-token-balances.ts)

### 数据来源
- ✅ **代币余额**: 
  - API: `${API_URL}/api/v1/blockchain/balance`
  - Solana 原生余额: 通过 `connection.getBalance()`
  - 状态: ✅ 正确配置

## 7. 推荐系统 (use-referral.ts, use-solana-referral.ts)

### 数据来源
- ✅ **推荐信息**: 
  - 数据源: Solana 链上数据 (推荐系统程序)
  - 状态: ✅ 正确配置

## 8. 通知中心 (notifications/notification-center.tsx)

### 数据来源
- ⚠️ **通知数据**: 当前使用 mock 数据
  - 状态: ⚠️ 需要连接到真实 API

## API 配置检查

### 环境变量
- ✅ `NEXT_PUBLIC_API_URL`: 默认 `https://alphanest-api.dappweb.workers.dev`
- ✅ `NEXT_PUBLIC_HELIUS_API_KEY`: 已配置
- ✅ `NEXT_PUBLIC_SOLANA_NETWORK`: 已配置
- ✅ `NEXT_PUBLIC_SOLANA_RPC_URL`: 已配置（优先使用 Helius）

### 外部 API
- ✅ **pump.fun API**: `https://frontend-api.pump.fun`
- ✅ **Jupiter Price API**: `https://price.jup.ag/v6`
- ✅ **DexScreener API**: `https://api.dexscreener.com`
- ✅ **Helius API**: 通过配置使用

## 发现的问题

1. ⚠️ **lib/api.ts** 中有 mock 数据作为后备
   - 位置: `getMockInsuranceProducts()`
   - 建议: 确保 API 失败时才有后备，优先使用真实数据

2. ⚠️ **notifications/notification-center.tsx** 使用 mock 数据
   - 建议: 连接到真实通知 API

3. ✅ **stats-overview.tsx** 有默认数据
   - 状态: 正常，作为后备数据

## 建议优化

1. 统一 API 错误处理
2. 添加数据源标识（显示数据来自哪个 API）
3. 优化缓存策略
4. 添加数据刷新机制
