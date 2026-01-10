/**
 * Blockchain Service - 链上数据索引与处理
 */

import { Env } from '../index';

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
  
  console.log(`Indexing dev history for ${devAddress} on chain ${chainId || 'all'}`);
  
  try {
    // Fetch data from Bitquery
    const historyData = await fetchDevHistoryFromBitquery(devAddress, chainId, env);
    
    if (!historyData) {
      console.log(`No history found for dev ${devAddress}`);
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
    
    console.log(`Dev history indexed successfully for ${devAddress}`);
  } catch (error) {
    console.error(`Error indexing dev history for ${devAddress}:`, error);
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
    console.error('Bitquery fetch error:', error);
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

export async function updateTokenStats(
  payload: { tokenAddress: string; chainId: number },
  env: Env
): Promise<void> {
  const { tokenAddress, chainId } = payload;
  
  console.log(`Updating token stats for ${tokenAddress} on chain ${chainId}`);
  
  try {
    // Fetch from DexScreener
    const stats = await fetchTokenStatsFromDexScreener(tokenAddress, chainId, env);
    
    if (!stats) {
      console.log(`No stats found for token ${tokenAddress}`);
      return;
    }
    
    // Store in database
    await storeTokenStats(stats, env);
    
    // Cache for real-time access
    await env.CACHE.put(
      `token_stats:${chainId}:${tokenAddress}`,
      JSON.stringify(stats),
      { expirationTtl: 10 } // 10 seconds for price data
    );
    
    console.log(`Token stats updated for ${tokenAddress}`);
  } catch (error) {
    console.error(`Error updating token stats for ${tokenAddress}:`, error);
    throw error;
  }
}

async function fetchTokenStatsFromDexScreener(
  tokenAddress: string,
  chainId: number,
  env: Env
): Promise<TokenStats | null> {
  const chainName = chainId === 1 ? 'ethereum' :
                    chainId === 8453 ? 'base' :
                    chainId === 56 ? 'bsc' : 'solana';
  
  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
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
      address: tokenAddress,
      chainId,
      price: pair.priceUsd || '0',
      priceChange24h: pair.priceChange?.h24 || 0,
      volume24h: pair.volume?.h24?.toString() || '0',
      marketCap: pair.fdv?.toString() || '0',
      holderCount: 0, // DexScreener doesn't provide this
      liquidity: pair.liquidity?.usd?.toString() || '0',
    };
  } catch (error) {
    console.error('DexScreener fetch error:', error);
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

export async function checkRugStatus(
  payload: { tokenAddress: string; chainId: number },
  env: Env
): Promise<RugCheckResult> {
  const { tokenAddress, chainId } = payload;
  
  console.log(`Checking rug status for ${tokenAddress} on chain ${chainId}`);
  
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
    // Fetch current stats
    const stats = await fetchTokenStatsFromDexScreener(tokenAddress, chainId, env);
    
    if (!stats) {
      console.log(`Cannot fetch stats for rug check: ${tokenAddress}`);
      return result;
    }
    
    // Get cached previous stats
    const cachedKey = `token_stats_prev:${chainId}:${tokenAddress}`;
    const prevStatsJson = await env.CACHE.get(cachedKey);
    
    if (prevStatsJson) {
      const prevStats: TokenStats = JSON.parse(prevStatsJson);
      
      // Check price drop
      const prevPrice = parseFloat(prevStats.price);
      const currentPrice = parseFloat(stats.price);
      
      if (prevPrice > 0 && currentPrice > 0) {
        const dropPercent = ((prevPrice - currentPrice) / prevPrice) * 100;
        result.rugIndicators.priceDropPercent = dropPercent;
        
        // More than 90% drop is likely a rug
        if (dropPercent > 90) {
          result.isRugged = true;
        }
      }
      
      // Check liquidity removal
      const prevLiq = parseFloat(prevStats.liquidity);
      const currentLiq = parseFloat(stats.liquidity);
      
      if (prevLiq > 1000 && currentLiq < 100) {
        result.rugIndicators.liquidityRemoved = true;
        result.isRugged = true;
      }
    }
    
    // Store current stats as previous for next check
    await env.CACHE.put(cachedKey, JSON.stringify(stats), { expirationTtl: 3600 });
    
    // If rugged, update database
    if (result.isRugged) {
      await env.DB.prepare(`
        UPDATE tokens SET status = 'rugged', rug_detected_at = ? WHERE contract_address = ?
      `).bind(Math.floor(Date.now() / 1000), tokenAddress).run();
      
      // TODO: Trigger notifications for affected users
      console.log(`RUG DETECTED: ${tokenAddress}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error checking rug status for ${tokenAddress}:`, error);
    throw error;
  }
}

// ============================================
// Trending Tokens Update
// ============================================

export async function updateTrendingTokens(env: Env): Promise<void> {
  console.log('Updating trending tokens...');
  
  const chains = [
    { id: 1, name: 'ethereum' },
    { id: 8453, name: 'base' },
    { id: 56, name: 'bsc' },
  ];
  
  for (const chain of chains) {
    try {
      const trending = await fetchTrendingFromDexScreener(chain.name);
      
      if (trending && trending.length > 0) {
        await env.CACHE.put(
          `trending:${chain.id}`,
          JSON.stringify({
            tokens: trending,
            updatedAt: Date.now(),
          }),
          { expirationTtl: 60 } // 1 minute
        );
        
        console.log(`Updated ${trending.length} trending tokens for ${chain.name}`);
      }
    } catch (error) {
      console.error(`Error updating trending for ${chain.name}:`, error);
    }
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
  console.log('Batch updating dev scores...');
  
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
    
    console.log(`Queued ${devs.results?.length || 0} devs for score update`);
  } catch (error) {
    console.error('Error in batch dev score update:', error);
    throw error;
  }
}

// ============================================
// Cleanup Expired Data
// ============================================

export async function cleanupExpiredData(env: Env): Promise<void> {
  console.log('Cleaning up expired data...');
  
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
  const oneYearAgo = now - (365 * 24 * 60 * 60);
  
  try {
    // Clean up old transactions (keep 1 year)
    const txResult = await env.DB.prepare(`
      DELETE FROM transactions WHERE created_at < ?
    `).bind(oneYearAgo).run();
    
    console.log(`Deleted ${txResult.meta?.changes || 0} old transactions`);
    
    // Clean up expired insurance policies (30 days after expiry)
    const policyResult = await env.DB.prepare(`
      DELETE FROM insurance_policies 
      WHERE status = 'expired' AND expires_at < ?
    `).bind(thirtyDaysAgo).run();
    
    console.log(`Deleted ${policyResult.meta?.changes || 0} expired policies`);
    
    // Clean up old points history (keep 1 year)
    const pointsResult = await env.DB.prepare(`
      DELETE FROM points_history WHERE created_at < ?
    `).bind(oneYearAgo).run();
    
    console.log(`Deleted ${pointsResult.meta?.changes || 0} old points records`);
    
    console.log('Cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
}
