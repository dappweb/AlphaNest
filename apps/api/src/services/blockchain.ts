/**
 * Blockchain Service - 链上数据索引与处理
 */

import { Env } from '../index';

// 简单的日志工具（避免频繁的 console.log）
const isDev = process.env.NODE_ENV === 'development';
const log = {
  info: (msg: string, ...args: any[]) => {
    if (isDev) console.log(`[INFO] ${msg}`, ...args);
  },
  error: (msg: string, ...args: any[]) => {
    console.error(`[ERROR] ${msg}`, ...args);
  },
  warn: (msg: string, ...args: any[]) => {
    if (isDev) console.warn(`[WARN] ${msg}`, ...args);
  },
};

// ============================================
// Types
// ============================================

interface DevHistoryData {
  address: string;
  chainId: number;
  launches: TokenLaunch[];
  totalVolume: string;
  winRate: number;
}

interface TokenLaunch {
  tokenAddress: string;
  name: string;
  symbol: string;
  launchTime: number;
  initialLiquidity: string;
  athMarketCap: string;
  currentMarketCap: string;
  isRugged: boolean;
  isGraduated: boolean;
  holderCount: number;
}

interface TokenStats {
  address: string;
  chainId: number;
  price: string;
  priceChange24h: number;
  volume24h: string;
  marketCap: string;
  holderCount: number;
  liquidity: string;
}

interface RugCheckResult {
  tokenAddress: string;
  isRugged: boolean;
  rugIndicators: {
    liquidityRemoved: boolean;
    ownershipRenounced: boolean;
    largeSellerDetected: boolean;
    priceDropPercent: number;
  };
  timestamp: number;
}

// ============================================
// Dev History Indexing
// ============================================

export async function indexDevHistory(
  payload: { devAddress: string; chainId?: number },
  env: Env
): Promise<void> {
  const { devAddress, chainId } = payload;
  
  log.info(`Indexing dev history for ${devAddress} on chain ${chainId || 'all'}`);
  
  try {
    // Fetch data from Bitquery
    const historyData = await fetchDevHistoryFromBitquery(devAddress, chainId, env);
    
    if (!historyData) {
      log.info(`No history found for dev ${devAddress}`);
      return;
    }
    
    // Store in database
    await storeDevHistory(historyData, env);
    
    // Calculate and update score
    const score = calculateDevScore(historyData);
    await updateDevScore(devAddress, score, env);
    
    // Cache the result
    await env.CACHE.put(
      `dev_history:${devAddress}`,
      JSON.stringify(historyData),
      { expirationTtl: 300 } // 5 minutes
    );
    
    log.info(`Dev history indexed successfully for ${devAddress}`);
  } catch (error) {
    log.error(`Error indexing dev history for ${devAddress}:`, error);
    throw error;
  }
}

async function fetchDevHistoryFromBitquery(
  devAddress: string,
  chainId: number | undefined,
  env: Env
): Promise<DevHistoryData | null> {
  const query = `
    query DevTokenCreations($creator: String!) {
      ethereum(network: ${chainId === 1 ? 'ethereum' : chainId === 8453 ? 'base' : 'bsc'}) {
        smartContractCalls(
          smartContractMethod: {is: "constructor"}
          caller: {is: $creator}
          options: {limit: 100, desc: "block.timestamp.time"}
        ) {
          block {
            timestamp {
              time
            }
          }
          smartContract {
            address {
              address
            }
            contractType
          }
          transaction {
            hash
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://graphql.bitquery.io', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': env.BITQUERY_API_KEY,
      },
      body: JSON.stringify({
        query,
        variables: { creator: devAddress },
      }),
    });

    if (!response.ok) {
      throw new Error(`Bitquery API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform and return
    return transformBitqueryResponse(devAddress, chainId || 1, data);
  } catch (error) {
    log.error('Bitquery fetch error:', error);
    return null;
  }
}

function transformBitqueryResponse(
  devAddress: string,
  chainId: number,
  data: any
): DevHistoryData {
  const launches: TokenLaunch[] = [];
  let totalVolume = BigInt(0);
  let successCount = 0;
  
  const calls = data?.data?.ethereum?.smartContractCalls || [];
  
  for (const call of calls) {
    const launch: TokenLaunch = {
      tokenAddress: call.smartContract?.address?.address || '',
      name: '',
      symbol: '',
      launchTime: new Date(call.block?.timestamp?.time).getTime(),
      initialLiquidity: '0',
      athMarketCap: '0',
      currentMarketCap: '0',
      isRugged: false,
      isGraduated: false,
      holderCount: 0,
    };
    
    launches.push(launch);
  }
  
  const winRate = launches.length > 0 ? (successCount / launches.length) * 100 : 0;
  
  return {
    address: devAddress,
    chainId,
    launches,
    totalVolume: totalVolume.toString(),
    winRate,
  };
}

async function storeDevHistory(data: DevHistoryData, env: Env): Promise<void> {
  // Check if dev exists
  const existing = await env.DB.prepare(
    'SELECT id FROM devs WHERE wallet_address = ?'
  ).bind(data.address).first();
  
  if (!existing) {
    // Insert new dev
    await env.DB.prepare(`
      INSERT INTO devs (id, wallet_address, created_at, updated_at, score, tier, total_launches, total_volume)
      VALUES (?, ?, ?, ?, 50, 'bronze', ?, ?)
    `).bind(
      crypto.randomUUID(),
      data.address,
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000),
      data.launches.length,
      data.totalVolume
    ).run();
  } else {
    // Update existing
    await env.DB.prepare(`
      UPDATE devs 
      SET total_launches = ?, total_volume = ?, updated_at = ?
      WHERE wallet_address = ?
    `).bind(
      data.launches.length,
      data.totalVolume,
      Math.floor(Date.now() / 1000),
      data.address
    ).run();
  }
}

function calculateDevScore(data: DevHistoryData): number {
  let score = 50; // Base score
  
  // Win rate impact (+/- 20 points)
  score += (data.winRate - 50) * 0.4;
  
  // Launch count impact (+5 points per launch, max 15)
  score += Math.min(data.launches.length * 5, 15);
  
  // Volume impact (logarithmic)
  const volume = BigInt(data.totalVolume);
  if (volume > BigInt(0)) {
    const volumeScore = Math.log10(Number(volume) / 1e18) * 2;
    score += Math.min(volumeScore, 10);
  }
  
  // Rug penalty (-15 per rug)
  const rugCount = data.launches.filter(l => l.isRugged).length;
  score -= rugCount * 15;
  
  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 获取 SOL 价格（USD）
 * 使用 Jupiter Price API，带缓存和重试机制
 */
async function getSolPriceUsd(env: Env): Promise<number | null> {
  const SOL_MINT = 'So11111111111111111111111111111111111111112';
  const cacheKey = `sol_price_usd`;
  
  // 检查缓存（5分钟有效期）
  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    try {
      const cachedData = JSON.parse(cached);
      if (Date.now() - cachedData.timestamp < 5 * 60 * 1000) {
        return cachedData.price;
      }
    } catch (e) {
      // 忽略解析错误
    }
  }
  
  // 从 Jupiter Price API 获取
  try {
    const response = await fetch(
      `https://price.jup.ag/v6/price?ids=${SOL_MINT}&vsToken=USDC`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (response.ok) {
      const data = await response.json();
      const price = data.data?.[SOL_MINT]?.price;
      
      if (price && price > 0) {
        // 缓存价格
        await env.CACHE.put(
          cacheKey,
          JSON.stringify({ price, timestamp: Date.now() }),
          { expirationTtl: 300 } // 5分钟
        );
        return price;
      }
    }
  } catch (error) {
    // 静默失败，使用回退价格
    if (isDev) log.warn('Failed to fetch SOL price from Jupiter, using fallback');
  }
  
  return null; // 返回 null，让调用者使用回退值
}

async function updateDevScore(address: string, score: number, env: Env): Promise<void> {
  const tier = score >= 95 ? 'diamond' :
               score >= 80 ? 'platinum' :
               score >= 60 ? 'gold' :
               score >= 40 ? 'silver' : 'bronze';
  
  await env.DB.prepare(`
    UPDATE devs SET score = ?, tier = ?, updated_at = ? WHERE wallet_address = ?
  `).bind(score, tier, Math.floor(Date.now() / 1000), address).run();
}

// ============================================
// Token Stats Update
// ============================================

/**
 * 更新 pump.fun 代币统计信息
 * 本项目仅支持 Solana 链上的 pump.fun 代币
 */
// 请求去重：防止同一代币的并发更新请求
const pendingUpdates = new Map<string, Promise<void>>();

export async function updateTokenStats(
  payload: { tokenAddress: string; chainId?: number },
  env: Env
): Promise<void> {
  const { tokenAddress } = payload;
  
  // 检查是否有正在进行的更新
  const pendingKey = `update:${tokenAddress}`;
  const pending = pendingUpdates.get(pendingKey);
  if (pending) {
    return pending; // 返回现有的 Promise
  }
  
  // 创建新的更新 Promise
  const updatePromise = (async () => {
    try {
      await performTokenStatsUpdate(tokenAddress, env);
    } finally {
      pendingUpdates.delete(pendingKey);
    }
  })();
  
  pendingUpdates.set(pendingKey, updatePromise);
  return updatePromise;
}

async function performTokenStatsUpdate(
  tokenAddress: string,
  env: Env
): Promise<void> {
  // 检查缓存（避免频繁更新）
  const cacheKey = `token_stats:101:${tokenAddress}`;
  const cached = await env.CACHE.get(cacheKey);
  if (cached) {
    try {
      const cachedStats = JSON.parse(cached);
      // 如果缓存少于 10 秒，跳过更新
      const cacheAge = Date.now() - (cachedStats._timestamp || 0);
      if (cacheAge < 10000) {
        return; // 缓存仍然新鲜
      }
    } catch (e) {
      // 忽略解析错误
    }
  }
  
  try {
    // 从 pump.fun API 获取代币详情（带重试机制）
    let tokenData = null;
    let lastError = null;
    
    for (let retry = 0; retry < 3; retry++) {
      try {
        const response = await fetch(`https://frontend-api.pump.fun/coins/${tokenAddress}`, {
          signal: AbortSignal.timeout(10000), // 10秒超时
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (response.ok) {
          tokenData = await response.json();
          break;
        } else if (response.status === 404) {
          // 404 不重试
          log.info(`Pump.fun token not found: ${tokenAddress}`);
          return;
        } else if (response.status >= 500 && retry < 2) {
          // 服务器错误，等待后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)));
          continue;
        } else {
          lastError = new Error(`HTTP ${response.status}`);
          break;
        }
      } catch (error) {
        lastError = error;
        if (retry < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)));
        }
      }
    }
    
    if (!tokenData) {
      log.error(`Failed to fetch pump.fun token after retries: ${tokenAddress}`, lastError);
      return;
    }
    
    // 获取实时 SOL 价格（从 Jupiter Price API）
    const SOL_PRICE_USD = await getSolPriceUsd(env) || 150; // 回退到 150 如果获取失败
    const priceInSol = tokenData.virtual_sol_reserves / (tokenData.virtual_token_reserves || 1);
    const priceUsd = priceInSol * SOL_PRICE_USD;
    const marketCap = tokenData.usd_market_cap || (priceUsd * tokenData.total_supply / Math.pow(10, 6));
    
    // 计算流动性（bonding curve 阶段使用虚拟储备）
    let liquidity = 0;
    if (tokenData.complete && tokenData.raydium_pool) {
      // 已完成 bonding curve，从 Raydium 池获取流动性
      const raydiumStats = await fetchRaydiumPoolStats(tokenData.raydium_pool, env);
      liquidity = raydiumStats ? parseFloat(raydiumStats.liquidity) : 0;
    } else {
      // bonding curve 阶段：使用虚拟储备估算流动性
      liquidity = tokenData.virtual_sol_reserves * SOL_PRICE_USD * 2;
    }

    // 计算 24h 价格变化（从缓存中获取历史价格）
    const cachedStats = await env.CACHE.get(`token_stats:101:${tokenAddress}`);
    let priceChange24h = 0;
    if (cachedStats) {
      try {
        const prevStats = JSON.parse(cachedStats);
        const prevPrice = parseFloat(prevStats.price || '0');
        if (prevPrice > 0) {
          priceChange24h = ((priceUsd - prevPrice) / prevPrice) * 100;
        }
      } catch (e) {
        // 忽略解析错误
      }
    }

    // 从 pump.fun API 获取交易量（如果可用）
    const volume24h = tokenData.volume_24h?.toString() || tokenData.usd_volume_24h?.toString() || '0';
    
    // 从 pump.fun API 获取持币数量（如果可用）
    const holderCount = tokenData.holder_count || 0;
    
    const stats: TokenStats = {
      address: tokenAddress,
      chainId: 101, // Solana
      price: priceUsd.toString(),
      priceChange24h,
      volume24h,
      marketCap: marketCap.toString(),
      holderCount,
      liquidity: liquidity.toString(),
    };
    
    // Store in database
    await storeTokenStats(stats, env);
    
    // Cache for real-time access
    await env.CACHE.put(
      `token_stats:101:${tokenAddress}`,
      JSON.stringify(stats),
      { expirationTtl: 10 } // 10 seconds for price data
    );
    
    // 仅在开发环境记录详细信息
    if (isDev) {
      log.info(`Token stats updated: ${tokenAddress}`, {
        price: stats.price,
        mcap: stats.marketCap,
        liquidity: stats.liquidity,
      });
    }
  } catch (error) {
    log.error(`Error updating pump.fun token stats for ${tokenAddress}:`, error);
    throw error;
  }
}

/**
 * 从 DexScreener 获取 Raydium 池的统计信息
 * 仅用于已迁移到 Raydium 的 pump.fun 代币
 */
async function fetchRaydiumPoolStats(
  raydiumPoolAddress: string,
  env: Env
): Promise<TokenStats | null> {
  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/pairs/solana/${raydiumPoolAddress}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`);
    }

    const data = await response.json();
    const pair = data.pairs?.[0];
    
    if (!pair) return null;
    
    return {
      address: raydiumPoolAddress,
      chainId: 101, // Solana
      price: pair.priceUsd || '0',
      priceChange24h: pair.priceChange?.h24 || 0,
      volume24h: pair.volume?.h24?.toString() || '0',
      marketCap: pair.fdv?.toString() || '0',
      holderCount: 0, // DexScreener doesn't provide this
      liquidity: pair.liquidity?.usd?.toString() || '0',
    };
  } catch (error) {
    log.error('DexScreener fetch error after retries:', error);
    return null;
  }
}

async function storeTokenStats(stats: TokenStats, env: Env): Promise<void> {
  await env.DB.prepare(`
    UPDATE tokens 
    SET market_cap = ?, liquidity = ?, holder_count = ?, updated_at = ?
    WHERE contract_address = ? AND chain = ?
  `).bind(
    stats.marketCap,
    stats.liquidity,
    stats.holderCount,
    Math.floor(Date.now() / 1000),
    stats.address,
    stats.chainId.toString()
  ).run();
}

// ============================================
// Rug Status Check
// ============================================

/**
 * 检查 pump.fun 代币的 Rug Pull 状态
 * 本项目仅支持 Solana 链上的 pump.fun 代币
 */
export async function checkRugStatus(
  payload: { tokenAddress: string; chainId?: number },
  env: Env
): Promise<RugCheckResult> {
  const { tokenAddress } = payload;
  
  log.info(`Checking pump.fun rug status for ${tokenAddress}`);
  
  const result: RugCheckResult = {
    tokenAddress,
    isRugged: false,
    rugIndicators: {
      liquidityRemoved: false,
      ownershipRenounced: false,
      largeSellerDetected: false,
      priceDropPercent: 0,
    },
    timestamp: Date.now(),
  };
  
  try {
    // 本项目仅支持 Solana 上的 pump.fun 代币
    // 直接使用 pump.fun 专用检测逻辑
    return await checkPumpFunRugStatus(tokenAddress, env, result);
  } catch (error) {
    console.error(`Error checking pump.fun rug status for ${tokenAddress}:`, error);
    throw error;
  }
}

/**
 * pump.fun 专用 Rug Pull 检测
 * 考虑 bonding curve 机制的特殊性
 */
async function checkPumpFunRugStatus(
  tokenAddress: string,
  env: Env,
  result: RugCheckResult
): Promise<RugCheckResult> {
  try {
    // 从 pump.fun API 获取代币详情
    const response = await fetch(`https://frontend-api.pump.fun/coins/${tokenAddress}`);
    
    if (!response.ok) {
      log.warn(`Cannot fetch pump.fun token: ${tokenAddress}`);
      return result;
    }
    
    const tokenData = await response.json();
    
    // 检查 bonding curve 是否完成
    const isComplete = tokenData.complete === true;
    
    if (isComplete) {
      // 已完成 bonding curve，迁移到 Raydium 池
      // 使用标准流动性检测（Raydium 池）
      if (tokenData.raydium_pool) {
        // 检查 Raydium 池的流动性
        const raydiumStats = await fetchRaydiumPoolStats(
          tokenData.raydium_pool,
          env
        );
        
        if (raydiumStats) {
          const liq = parseFloat(raydiumStats.liquidity);
          // Raydium 池流动性 < 1000 USD 可能是 rug
          if (liq < 1000 && tokenData.usd_market_cap > 10000) {
            result.rugIndicators.liquidityRemoved = true;
            result.isRugged = true;
          }
        }
      }
    } else {
      // 仍在 bonding curve 阶段
      // 检查虚拟储备是否异常
      const virtualSolReserves = tokenData.virtual_sol_reserves || 0;
      const virtualTokenReserves = tokenData.virtual_token_reserves || 0;
      
      // 获取缓存的之前状态
      const cachedKey = `pumpfun_stats_prev:${tokenAddress}`;
      const prevStatsJson = await env.CACHE.get(cachedKey);
      
      if (prevStatsJson) {
        const prevStats = JSON.parse(prevStatsJson);
        const prevSolReserves = prevStats.virtual_sol_reserves || 0;
        
        // 检查 SOL 储备是否大幅下降（>80%）
        if (prevSolReserves > 1 && virtualSolReserves < prevSolReserves * 0.2) {
          result.rugIndicators.liquidityRemoved = true;
          result.isRugged = true;
          log.warn(`Pump.fun bonding curve rug detected: ${tokenAddress}`);
        }
        
        // 检查价格暴跌（基于虚拟储备计算）
        const prevPrice = prevSolReserves / (prevStats.virtual_token_reserves || 1);
        const currentPrice = virtualSolReserves / (virtualTokenReserves || 1);
        
        if (prevPrice > 0 && currentPrice > 0) {
          const dropPercent = ((prevPrice - currentPrice) / prevPrice) * 100;
          result.rugIndicators.priceDropPercent = dropPercent;
          
          if (dropPercent > 90) {
            result.isRugged = true;
          }
        }
      }
      
      // 缓存当前状态
      await env.CACHE.put(
        cachedKey,
        JSON.stringify({
          virtual_sol_reserves: virtualSolReserves,
          virtual_token_reserves: virtualTokenReserves,
          timestamp: Date.now(),
        }),
        { expirationTtl: 3600 }
      );
    }
    
    // 如果检测到 rug，更新数据库
    if (result.isRugged) {
      await env.DB.prepare(`
        UPDATE tokens SET status = 'rugged', rug_detected_at = ? WHERE contract_address = ?
      `).bind(Math.floor(Date.now() / 1000), tokenAddress).run();
      
      log.error(`🚨 PUMP.FUN RUG DETECTED: ${tokenAddress}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error checking pump.fun rug status for ${tokenAddress}:`, error);
    return result;
  }
}

// ============================================
// Trending Tokens Update
// ============================================

/**
 * 更新 pump.fun 热门代币列表
 * 本项目仅支持 Solana 链上的 pump.fun 代币
 */
export async function updateTrendingTokens(env: Env): Promise<void> {
  log.info('Updating pump.fun trending tokens...');
  
  try {
    // 从 pump.fun API 获取热门代币
    const { getPumpFunTrending } = await import('./meme-platforms');
    const trending = await getPumpFunTrending(50);
    
    // 转换为统一格式
    const formattedTrending = trending.map(token => ({
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      price: token.priceUsd,
      marketCap: token.marketCap,
      logo: token.logo,
      source: 'pump.fun',
    }));
    
    if (formattedTrending && formattedTrending.length > 0) {
      await env.CACHE.put(
        `trending:101`, // Solana chainId
        JSON.stringify({
          tokens: formattedTrending,
          updatedAt: Date.now(),
        }),
        { expirationTtl: 60 } // 1 minute
      );
      
      log.info(`Updated ${formattedTrending.length} pump.fun trending tokens`);
    }
  } catch (error) {
    log.error('Error updating pump.fun trending tokens:', error);
  }
}

async function fetchTrendingFromDexScreener(chain: string): Promise<any[]> {
  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${chain}`,
      {
        headers: { 'Accept': 'application/json' },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.pairs?.slice(0, 50) || [];
  } catch {
    return [];
  }
}

// ============================================
// Dev Scores Update (Batch)
// ============================================

export async function updateDevScores(env: Env): Promise<void> {
  log.info('Batch updating dev scores...');
  
  try {
    // Get all devs that need score update
    const devs = await env.DB.prepare(`
      SELECT wallet_address FROM devs 
      WHERE updated_at < ? 
      ORDER BY updated_at ASC 
      LIMIT 100
    `).bind(Math.floor(Date.now() / 1000) - 3600).all(); // Updated more than 1 hour ago
    
    for (const dev of devs.results || []) {
      const address = dev.wallet_address as string;
      
      // Queue the indexing job
      if (env.TASK_QUEUE) {
        await env.TASK_QUEUE.send({
          type: 'INDEX_DEV_HISTORY',
          payload: { devAddress: address },
        });
      } else {
        // Direct execution if no queue
        await indexDevHistory({ devAddress: address }, env);
      }
    }
    
    log.info(`Queued ${devs.results?.length || 0} devs for score update`);
  } catch (error) {
    log.error('Error in batch dev score update:', error);
    throw error;
  }
}

// ============================================
// Cleanup Expired Data
// ============================================

export async function cleanupExpiredData(env: Env): Promise<void> {
  log.info('Cleaning up expired data...');
  
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
  const oneYearAgo = now - (365 * 24 * 60 * 60);
  
  try {
    // Clean up old transactions (keep 1 year)
    const txResult = await env.DB.prepare(`
      DELETE FROM transactions WHERE created_at < ?
    `).bind(oneYearAgo).run();
    
    log.info(`Deleted ${txResult.meta?.changes || 0} old transactions`);
    
    // Clean up expired insurance policies (30 days after expiry)
    const policyResult = await env.DB.prepare(`
      DELETE FROM insurance_policies 
      WHERE status = 'expired' AND expires_at < ?
    `).bind(thirtyDaysAgo).run();
    
    log.info(`Deleted ${policyResult.meta?.changes || 0} expired policies`);
    
    // Clean up old points history (keep 1 year)
    const pointsResult = await env.DB.prepare(`
      DELETE FROM points_history WHERE created_at < ?
    `).bind(oneYearAgo).run();
    
    log.info(`Deleted ${pointsResult.meta?.changes || 0} old points records`);
    
    log.info('Cleanup completed');
  } catch (error) {
    log.error('Error during cleanup:', error);
    throw error;
  }
}
