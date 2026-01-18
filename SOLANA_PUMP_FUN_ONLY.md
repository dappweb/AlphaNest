# 项目简化说明 - 仅支持 Solana pump.fun 代币

## 📌 项目定位

**本项目仅针对 Solana 链上 pump.fun 发行的代币，其他链（BSC、Base、Ethereum 等）均不支持。**

## 🔧 已完成的简化调整

### 1. **Rug Pull 检测函数** (`apps/api/src/services/blockchain.ts`)

#### `checkRugStatus()` 函数
- ✅ **移除多链支持**：不再判断 chainId，直接使用 pump.fun 检测逻辑
- ✅ **简化参数**：`chainId` 参数改为可选
- ✅ **专用检测**：直接调用 `checkPumpFunRugStatus()` 函数

**修改前：**
```typescript
export async function checkRugStatus(
  payload: { tokenAddress: string; chainId: number },
  env: Env
): Promise<RugCheckResult> {
  const isPumpFun = chainId === 101 || chainId === 1399811149;
  if (isPumpFun) {
    return await checkPumpFunRugStatus(...);
  }
  // 其他链的检测逻辑...
}
```

**修改后：**
```typescript
export async function checkRugStatus(
  payload: { tokenAddress: string; chainId?: number },
  env: Env
): Promise<RugCheckResult> {
  // 本项目仅支持 Solana 上的 pump.fun 代币
  return await checkPumpFunRugStatus(tokenAddress, env, result);
}
```

### 2. **代币统计更新函数** (`updateTokenStats()`)

- ✅ **移除 DexScreener 通用接口**：不再使用多链的 DexScreener API
- ✅ **直接使用 pump.fun API**：从 `https://frontend-api.pump.fun/coins/{mint}` 获取数据
- ✅ **固定 chainId**：所有代币的 chainId 固定为 101 (Solana)

**主要改进：**
- 直接从 pump.fun API 获取代币详情
- 计算 bonding curve 阶段的价格和流动性
- 支持 Raydium 池阶段的统计

### 3. **定时任务** (`apps/api/src/scheduled/index.ts`)

#### `detectRugPulls()` 函数
- ✅ **仅查询 Solana 链**：SQL 查询中添加 `AND chain = 'solana'` 条件
- ✅ **移除链判断逻辑**：不再判断 BSC、Base、Ethereum 等链
- ✅ **简化调用**：直接调用 `checkRugStatus()`，无需传入 chainId

**修改前：**
```typescript
const tokens = await env.DB.prepare(`
  SELECT ... FROM tokens 
  WHERE status = 'active' AND created_at > ?
`).all();

// 判断链类型
const isPumpFun = token.chain === 'solana';
const chainId = isPumpFun ? 101 : (token.chain === 'bsc' ? 56 : 1);
```

**修改后：**
```typescript
const tokens = await env.DB.prepare(`
  SELECT ... FROM tokens 
  WHERE status = 'active' 
  AND chain = 'solana'  -- 仅查询 Solana 链
  AND created_at > ?
`).all();

// 直接检测，无需判断链类型
const rugResult = await checkRugStatus({ tokenAddress: token.address }, env);
```

### 4. **热门代币更新** (`updateTrendingTokens()`)

- ✅ **移除多链循环**：不再遍历 Ethereum、Base、BSC 等链
- ✅ **直接使用 pump.fun API**：调用 `getPumpFunTrending()` 函数
- ✅ **固定缓存键**：使用 `trending:101` (Solana chainId)

**修改前：**
```typescript
const chains = [
  { id: 1, name: 'ethereum' },
  { id: 8453, name: 'base' },
  { id: 56, name: 'bsc' },
];
for (const chain of chains) {
  const trending = await fetchTrendingFromDexScreener(chain.name);
  // ...
}
```

**修改后：**
```typescript
const { getPumpFunTrending } = await import('./meme-platforms');
const trending = await getPumpFunTrending(50);
// 仅缓存 Solana pump.fun 代币
await env.CACHE.put(`trending:101`, ...);
```

### 5. **辅助函数简化**

#### `fetchRaydiumPoolStats()`
- ✅ **重命名函数**：`fetchTokenStatsFromDexScreener()` → `fetchRaydiumPoolStats()`
- ✅ **专用用途**：仅用于获取已迁移到 Raydium 的 pump.fun 代币池信息
- ✅ **固定链**：仅支持 Solana (chainId = 101)

## 📊 代码简化对比

| 功能 | 修改前 | 修改后 |
|------|--------|--------|
| **支持的链** | Solana, BSC, Base, Ethereum | **仅 Solana** |
| **链判断逻辑** | 需要判断 chainId | **无需判断** |
| **数据源** | DexScreener (多链) + pump.fun API | **仅 pump.fun API** |
| **定时任务查询** | 所有链的活跃代币 | **仅 Solana 链** |
| **热门代币** | 多链热门列表 | **仅 pump.fun 热门** |

## ✅ 优势

1. **代码更简洁**：移除了大量多链判断逻辑
2. **性能更好**：减少了不必要的 API 调用和数据库查询
3. **维护更容易**：专注于 pump.fun 代币的特殊机制
4. **错误更少**：减少了链类型判断错误的可能性

## 🔍 保留的功能

以下功能保持不变，但仅针对 Solana pump.fun 代币：

- ✅ Bonding curve 虚拟储备检测
- ✅ Raydium 池流动性检测
- ✅ 价格暴跌检测（>90%）
- ✅ 流动性撤走检测（>80%）
- ✅ 风险评估模型（针对 pump.fun 调整权重）

## 📝 注意事项

1. **数据库查询**：确保所有查询都包含 `chain = 'solana'` 条件
2. **API 调用**：所有代币相关 API 调用都使用 pump.fun API
3. **缓存键**：使用固定的 Solana chainId (101)
4. **错误处理**：如果检测到非 Solana 链的代币，应记录警告日志

## 🚀 后续建议

1. **数据库迁移**：可以考虑清理非 Solana 链的代币数据
2. **API 文档**：更新 API 文档，明确说明仅支持 Solana pump.fun 代币
3. **前端调整**：前端界面可以移除其他链的选择器
4. **监控告警**：添加监控，检测是否有非 Solana 链的代币被处理

---

**更新时间**：2024-12-19  
**版本**：v2.0.0 (仅支持 Solana pump.fun)
