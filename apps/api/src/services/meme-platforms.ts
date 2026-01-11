/**
 * Meme 平台数据聚合服务
 * 集成 Pump.fun, GMGN.ai, Birdeye, DexScreener 四大数据源
 */

// ============================================
// 类型定义
// ============================================

export interface MemeToken {
  address: string;
  chain: 'solana' | 'base' | 'ethereum' | 'bsc';
  name: string;
  symbol: string;
  logo?: string;
  description?: string;
  
  // 价格数据
  priceUsd: string;
  priceChange5m?: number;
  priceChange1h?: number;
  priceChange24h?: number;
  
  // 市场数据
  marketCap?: string;
  fdv?: string;
  liquidity?: string;
  volume24h?: string;
  
  // 交易数据
  txns24h?: { buys: number; sells: number };
  holders?: number;
  
  // 元数据
  createdAt?: number;
  pairAddress?: string;
  dex?: string;
  
  // 社交链接
  website?: string;
  twitter?: string;
  telegram?: string;
  
  // 数据来源
  source: 'pump.fun' | 'gmgn' | 'birdeye' | 'dexscreener';
}

export interface PumpFunToken {
  mint: string;
  name: string;
  symbol: string;
  description?: string;
  image_uri?: string;
  metadata_uri?: string;
  creator: string;
  created_timestamp: number;
  complete: boolean;
  virtual_sol_reserves: number;
  virtual_token_reserves: number;
  bonding_curve: string;
  associated_bonding_curve: string;
  raydium_pool?: string;
  total_supply: number;
  website?: string;
  twitter?: string;
  telegram?: string;
  market_cap?: number;
  reply_count?: number;
  last_reply?: number;
  usd_market_cap?: number;
}

export interface SmartMoneyTrade {
  wallet: string;
  tokenAddress: string;
  tokenSymbol: string;
  type: 'buy' | 'sell';
  amount: string;
  amountUsd: string;
  priceUsd: string;
  timestamp: number;
  txHash: string;
  pnl?: string;
  pnlPercent?: number;
}

export interface TopTrader {
  wallet: string;
  label?: string;
  totalPnl: string;
  totalTrades: number;
  winRate: number;
  avgHoldTime: string;
  recentTokens: string[];
}

// ============================================
// Pump.fun API
// ============================================

const PUMP_FUN_API = 'https://frontend-api.pump.fun';

/**
 * 获取 Pump.fun 新发射的代币
 */
export async function getPumpFunNewTokens(limit = 50): Promise<MemeToken[]> {
  try {
    const response = await fetch(`${PUMP_FUN_API}/coins?offset=0&limit=${limit}&sort=created_timestamp&order=DESC&includeNsfw=false`);
    
    if (!response.ok) {
      console.error('Pump.fun API error:', response.status);
      return [];
    }
    
    const tokens: PumpFunToken[] = await response.json();
    
    return tokens.map(t => ({
      address: t.mint,
      chain: 'solana' as const,
      name: t.name,
      symbol: t.symbol,
      logo: t.image_uri,
      description: t.description,
      priceUsd: calculatePumpFunPrice(t).toString(),
      marketCap: t.usd_market_cap?.toString() || t.market_cap?.toString() || '0',
      createdAt: t.created_timestamp,
      website: t.website,
      twitter: t.twitter,
      telegram: t.telegram,
      source: 'pump.fun' as const,
    }));
  } catch (error) {
    console.error('Pump.fun fetch error:', error);
    return [];
  }
}

/**
 * 获取 Pump.fun 热门代币
 */
export async function getPumpFunTrending(limit = 50): Promise<MemeToken[]> {
  try {
    const response = await fetch(`${PUMP_FUN_API}/coins?offset=0&limit=${limit}&sort=market_cap&order=DESC&includeNsfw=false`);
    
    if (!response.ok) return [];
    
    const tokens: PumpFunToken[] = await response.json();
    
    return tokens.map(t => ({
      address: t.mint,
      chain: 'solana' as const,
      name: t.name,
      symbol: t.symbol,
      logo: t.image_uri,
      description: t.description,
      priceUsd: calculatePumpFunPrice(t).toString(),
      marketCap: t.usd_market_cap?.toString() || '0',
      createdAt: t.created_timestamp,
      website: t.website,
      twitter: t.twitter,
      telegram: t.telegram,
      source: 'pump.fun' as const,
    }));
  } catch (error) {
    console.error('Pump.fun trending error:', error);
    return [];
  }
}

/**
 * 获取 Pump.fun 代币详情
 */
export async function getPumpFunTokenDetail(mint: string): Promise<MemeToken | null> {
  try {
    const response = await fetch(`${PUMP_FUN_API}/coins/${mint}`);
    
    if (!response.ok) return null;
    
    const t: PumpFunToken = await response.json();
    
    return {
      address: t.mint,
      chain: 'solana',
      name: t.name,
      symbol: t.symbol,
      logo: t.image_uri,
      description: t.description,
      priceUsd: calculatePumpFunPrice(t).toString(),
      marketCap: t.usd_market_cap?.toString() || '0',
      createdAt: t.created_timestamp,
      website: t.website,
      twitter: t.twitter,
      telegram: t.telegram,
      source: 'pump.fun',
    };
  } catch (error) {
    console.error('Pump.fun token detail error:', error);
    return null;
  }
}

/**
 * 搜索 Pump.fun 代币
 */
export async function searchPumpFunTokens(query: string, limit = 20): Promise<MemeToken[]> {
  try {
    const response = await fetch(`${PUMP_FUN_API}/coins?offset=0&limit=${limit}&search=${encodeURIComponent(query)}&includeNsfw=false`);
    
    if (!response.ok) return [];
    
    const tokens: PumpFunToken[] = await response.json();
    
    return tokens.map(t => ({
      address: t.mint,
      chain: 'solana' as const,
      name: t.name,
      symbol: t.symbol,
      logo: t.image_uri,
      priceUsd: calculatePumpFunPrice(t).toString(),
      marketCap: t.usd_market_cap?.toString() || '0',
      source: 'pump.fun' as const,
    }));
  } catch (error) {
    console.error('Pump.fun search error:', error);
    return [];
  }
}

/**
 * 计算 Pump.fun 代币价格
 * 基于 bonding curve 公式
 */
function calculatePumpFunPrice(token: PumpFunToken): number {
  if (!token.virtual_sol_reserves || !token.virtual_token_reserves) return 0;
  
  // Bonding curve 价格 = SOL 储备 / 代币储备
  // 假设 SOL 价格 ~$100 (需要实时获取)
  const SOL_PRICE_USD = 100; // TODO: 从 API 获取实时价格
  const priceInSol = token.virtual_sol_reserves / token.virtual_token_reserves;
  return priceInSol * SOL_PRICE_USD;
}

// ============================================
// GMGN.ai API
// ============================================

const GMGN_API = 'https://gmgn.ai/defi/quotation/v1';

/**
 * 获取 GMGN 热门代币
 */
export async function getGMGNTrending(chain: string = 'sol', limit = 50): Promise<MemeToken[]> {
  try {
    // GMGN API 端点
    const response = await fetch(`${GMGN_API}/rank/${chain}/swaps/1h?limit=${limit}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AlphaNest/1.0',
      },
    });
    
    if (!response.ok) {
      console.error('GMGN API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    const tokens = data.data?.rank || [];
    
    return tokens.map((t: any) => ({
      address: t.address,
      chain: chain === 'sol' ? 'solana' : chain as any,
      name: t.name || 'Unknown',
      symbol: t.symbol || '???',
      logo: t.logo,
      priceUsd: t.price?.toString() || '0',
      priceChange24h: t.price_change_percent || 0,
      marketCap: t.market_cap?.toString() || '0',
      volume24h: t.volume?.toString() || '0',
      txns24h: { buys: t.buys || 0, sells: t.sells || 0 },
      holders: t.holder_count,
      source: 'gmgn' as const,
    }));
  } catch (error) {
    console.error('GMGN fetch error:', error);
    return [];
  }
}

/**
 * 获取 GMGN 新代币
 */
export async function getGMGNNewTokens(chain: string = 'sol', limit = 50): Promise<MemeToken[]> {
  try {
    const response = await fetch(`${GMGN_API}/pairs/${chain}/new_pairs?limit=${limit}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AlphaNest/1.0',
      },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const pairs = data.data?.pairs || [];
    
    return pairs.map((p: any) => ({
      address: p.base_address,
      chain: chain === 'sol' ? 'solana' : chain as any,
      name: p.base_name || 'Unknown',
      symbol: p.base_symbol || '???',
      logo: p.logo,
      priceUsd: p.price?.toString() || '0',
      liquidity: p.liquidity?.toString() || '0',
      createdAt: p.open_timestamp,
      pairAddress: p.address,
      dex: p.exchange,
      source: 'gmgn' as const,
    }));
  } catch (error) {
    console.error('GMGN new tokens error:', error);
    return [];
  }
}

/**
 * 获取 GMGN 聪明钱交易
 */
export async function getGMGNSmartMoneyTrades(chain: string = 'sol', limit = 50): Promise<SmartMoneyTrade[]> {
  try {
    const response = await fetch(`${GMGN_API}/signals/${chain}/swaps?limit=${limit}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AlphaNest/1.0',
      },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const swaps = data.data?.swaps || [];
    
    return swaps.map((s: any) => ({
      wallet: s.maker,
      tokenAddress: s.token_address,
      tokenSymbol: s.symbol || '???',
      type: s.is_buy ? 'buy' : 'sell',
      amount: s.amount?.toString() || '0',
      amountUsd: s.amount_usd?.toString() || '0',
      priceUsd: s.price?.toString() || '0',
      timestamp: s.timestamp,
      txHash: s.tx_hash,
    }));
  } catch (error) {
    console.error('GMGN smart money error:', error);
    return [];
  }
}

/**
 * 获取 GMGN 顶级交易员
 */
export async function getGMGNTopTraders(chain: string = 'sol', limit = 50): Promise<TopTrader[]> {
  try {
    const response = await fetch(`${GMGN_API}/rank/${chain}/wallets/7d?limit=${limit}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AlphaNest/1.0',
      },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const wallets = data.data?.rank || [];
    
    return wallets.map((w: any) => ({
      wallet: w.address,
      label: w.tag,
      totalPnl: w.realized_profit?.toString() || '0',
      totalTrades: w.txs || 0,
      winRate: w.win_rate || 0,
      avgHoldTime: formatHoldTime(w.avg_hold_time),
      recentTokens: w.recent_tokens || [],
    }));
  } catch (error) {
    console.error('GMGN top traders error:', error);
    return [];
  }
}

// ============================================
// Birdeye API
// ============================================

const BIRDEYE_API = 'https://public-api.birdeye.so';

interface BirdeyeConfig {
  apiKey?: string;
}

/**
 * 获取 Birdeye 热门代币
 */
export async function getBirdeyeTrending(config: BirdeyeConfig = {}, limit = 50): Promise<MemeToken[]> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    if (config.apiKey) {
      headers['X-API-KEY'] = config.apiKey;
    }
    
    const response = await fetch(`${BIRDEYE_API}/defi/tokenlist?sort_by=v24hChangePercent&sort_type=desc&offset=0&limit=${limit}`, {
      headers,
    });
    
    if (!response.ok) {
      console.error('Birdeye API error:', response.status);
      return [];
    }
    
    const data = await response.json();
    const tokens = data.data?.tokens || [];
    
    return tokens.map((t: any) => ({
      address: t.address,
      chain: 'solana' as const,
      name: t.name || 'Unknown',
      symbol: t.symbol || '???',
      logo: t.logoURI,
      priceUsd: t.price?.toString() || '0',
      priceChange24h: t.v24hChangePercent || 0,
      marketCap: t.mc?.toString() || '0',
      volume24h: t.v24hUSD?.toString() || '0',
      liquidity: t.liquidity?.toString() || '0',
      source: 'birdeye' as const,
    }));
  } catch (error) {
    console.error('Birdeye fetch error:', error);
    return [];
  }
}

/**
 * 获取 Birdeye 代币详情
 */
export async function getBirdeyeTokenDetail(address: string, config: BirdeyeConfig = {}): Promise<MemeToken | null> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    if (config.apiKey) {
      headers['X-API-KEY'] = config.apiKey;
    }
    
    const response = await fetch(`${BIRDEYE_API}/defi/token_overview?address=${address}`, {
      headers,
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const t = data.data;
    
    if (!t) return null;
    
    return {
      address: t.address,
      chain: 'solana',
      name: t.name || 'Unknown',
      symbol: t.symbol || '???',
      logo: t.logoURI,
      priceUsd: t.price?.toString() || '0',
      priceChange24h: t.v24hChangePercent || 0,
      marketCap: t.mc?.toString() || '0',
      fdv: t.fdv?.toString() || '0',
      volume24h: t.v24hUSD?.toString() || '0',
      liquidity: t.liquidity?.toString() || '0',
      holders: t.holder,
      source: 'birdeye',
    };
  } catch (error) {
    console.error('Birdeye token detail error:', error);
    return null;
  }
}

/**
 * 获取 Birdeye 代币价格历史
 */
export async function getBirdeyePriceHistory(
  address: string,
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1h',
  config: BirdeyeConfig = {}
): Promise<Array<{ time: number; price: number; volume: number }>> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    if (config.apiKey) {
      headers['X-API-KEY'] = config.apiKey;
    }
    
    const now = Math.floor(Date.now() / 1000);
    const timeframeSeconds: Record<string, number> = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '1h': 3600,
      '4h': 14400,
      '1d': 86400,
    };
    
    const interval = timeframeSeconds[timeframe] || 3600;
    const from = now - interval * 100;
    
    const response = await fetch(
      `${BIRDEYE_API}/defi/history_price?address=${address}&address_type=token&type=${timeframe}&time_from=${from}&time_to=${now}`,
      { headers }
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const items = data.data?.items || [];
    
    return items.map((item: any) => ({
      time: item.unixTime,
      price: item.value || 0,
      volume: item.volume || 0,
    }));
  } catch (error) {
    console.error('Birdeye price history error:', error);
    return [];
  }
}

/**
 * 获取 Birdeye OHLCV 数据
 */
export async function getBirdeyeOHLCV(
  address: string,
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1h',
  config: BirdeyeConfig = {}
): Promise<Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    if (config.apiKey) {
      headers['X-API-KEY'] = config.apiKey;
    }
    
    const now = Math.floor(Date.now() / 1000);
    const timeframeSeconds: Record<string, number> = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '1h': 3600,
      '4h': 14400,
      '1d': 86400,
    };
    
    const interval = timeframeSeconds[timeframe] || 3600;
    const from = now - interval * 100;
    
    const response = await fetch(
      `${BIRDEYE_API}/defi/ohlcv?address=${address}&type=${timeframe}&time_from=${from}&time_to=${now}`,
      { headers }
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const items = data.data?.items || [];
    
    return items.map((item: any) => ({
      time: item.unixTime,
      open: item.o || 0,
      high: item.h || 0,
      low: item.l || 0,
      close: item.c || 0,
      volume: item.v || 0,
    }));
  } catch (error) {
    console.error('Birdeye OHLCV error:', error);
    return [];
  }
}

// ============================================
// DexScreener API (已有，补充方法)
// ============================================

const DEXSCREENER_API = 'https://api.dexscreener.com';

/**
 * 获取 DexScreener 热门代币
 */
export async function getDexScreenerTrending(chain?: string, limit = 50): Promise<MemeToken[]> {
  try {
    const response = await fetch(`${DEXSCREENER_API}/token-profiles/latest/v1`);
    
    if (!response.ok) return [];
    
    const profiles: any[] = await response.json();
    
    let filtered = profiles;
    if (chain) {
      const chainMap: Record<string, string> = {
        solana: 'solana',
        base: 'base',
        ethereum: 'ethereum',
        bsc: 'bsc',
      };
      const dexChain = chainMap[chain] || chain;
      filtered = profiles.filter(p => p.chainId === dexChain);
    }
    
    // 去重
    const unique = new Map();
    for (const p of filtered) {
      if (!unique.has(p.tokenAddress)) {
        unique.set(p.tokenAddress, p);
      }
      if (unique.size >= limit) break;
    }
    
    // 获取价格数据
    const tokens: MemeToken[] = [];
    for (const [addr, profile] of unique) {
      try {
        const priceRes = await fetch(`${DEXSCREENER_API}/latest/dex/tokens/${addr}`);
        if (priceRes.ok) {
          const priceData = await priceRes.json();
          const pair = priceData.pairs?.[0];
          
          tokens.push({
            address: addr,
            chain: (profile.chainId || 'unknown') as any,
            name: pair?.baseToken?.name || profile.description?.split('\n')[0] || 'Unknown',
            symbol: pair?.baseToken?.symbol || '???',
            logo: profile.icon,
            description: profile.description,
            priceUsd: pair?.priceUsd || '0',
            priceChange5m: pair?.priceChange?.m5,
            priceChange1h: pair?.priceChange?.h1,
            priceChange24h: pair?.priceChange?.h24,
            marketCap: pair?.marketCap?.toString() || pair?.fdv?.toString() || '0',
            fdv: pair?.fdv?.toString() || '0',
            liquidity: pair?.liquidity?.usd?.toString() || '0',
            volume24h: pair?.volume?.h24?.toString() || '0',
            txns24h: pair?.txns?.h24,
            pairAddress: pair?.pairAddress,
            dex: pair?.dexId,
            website: profile.links?.find((l: any) => !l.type)?.url,
            twitter: profile.links?.find((l: any) => l.type === 'twitter')?.url,
            telegram: profile.links?.find((l: any) => l.type === 'telegram')?.url,
            source: 'dexscreener',
          });
        }
      } catch {
        // Skip failed token
      }
    }
    
    return tokens;
  } catch (error) {
    console.error('DexScreener trending error:', error);
    return [];
  }
}

/**
 * 获取 DexScreener 推广代币
 */
export async function getDexScreenerBoosted(limit = 50): Promise<MemeToken[]> {
  try {
    const response = await fetch(`${DEXSCREENER_API}/token-boosts/latest/v1`);
    
    if (!response.ok) return [];
    
    const boosts: any[] = await response.json();
    
    return boosts.slice(0, limit).map(b => ({
      address: b.tokenAddress,
      chain: (b.chainId || 'unknown') as any,
      name: b.description || 'Unknown',
      symbol: b.symbol || '???',
      logo: b.icon,
      priceUsd: '0',
      source: 'dexscreener' as const,
    }));
  } catch (error) {
    console.error('DexScreener boosted error:', error);
    return [];
  }
}

// ============================================
// 聚合服务
// ============================================

export interface AggregatedData {
  trending: MemeToken[];
  newTokens: MemeToken[];
  smartMoney: SmartMoneyTrade[];
  topTraders: TopTrader[];
  sources: {
    pumpfun: boolean;
    gmgn: boolean;
    birdeye: boolean;
    dexscreener: boolean;
  };
  updatedAt: number;
}

/**
 * 聚合所有平台数据
 */
export async function aggregateAllPlatforms(
  chain: string = 'solana',
  config: { birdeyeApiKey?: string } = {}
): Promise<AggregatedData> {
  const results: AggregatedData = {
    trending: [],
    newTokens: [],
    smartMoney: [],
    topTraders: [],
    sources: {
      pumpfun: false,
      gmgn: false,
      birdeye: false,
      dexscreener: false,
    },
    updatedAt: Date.now(),
  };
  
  // 并行获取所有数据源
  const [
    pumpfunTrending,
    pumpfunNew,
    gmgnTrending,
    gmgnNew,
    gmgnSmartMoney,
    gmgnTopTraders,
    birdeyeTrending,
    dexscreenerTrending,
  ] = await Promise.allSettled([
    chain === 'solana' ? getPumpFunTrending(20) : Promise.resolve([]),
    chain === 'solana' ? getPumpFunNewTokens(20) : Promise.resolve([]),
    getGMGNTrending(chain === 'solana' ? 'sol' : chain, 20),
    getGMGNNewTokens(chain === 'solana' ? 'sol' : chain, 20),
    getGMGNSmartMoneyTrades(chain === 'solana' ? 'sol' : chain, 20),
    getGMGNTopTraders(chain === 'solana' ? 'sol' : chain, 20),
    chain === 'solana' ? getBirdeyeTrending({ apiKey: config.birdeyeApiKey }, 20) : Promise.resolve([]),
    getDexScreenerTrending(chain, 20),
  ]);
  
  // 处理 Pump.fun 数据
  if (pumpfunTrending.status === 'fulfilled' && pumpfunTrending.value.length > 0) {
    results.trending.push(...pumpfunTrending.value);
    results.sources.pumpfun = true;
  }
  if (pumpfunNew.status === 'fulfilled' && pumpfunNew.value.length > 0) {
    results.newTokens.push(...pumpfunNew.value);
    results.sources.pumpfun = true;
  }
  
  // 处理 GMGN 数据
  if (gmgnTrending.status === 'fulfilled' && gmgnTrending.value.length > 0) {
    results.trending.push(...gmgnTrending.value);
    results.sources.gmgn = true;
  }
  if (gmgnNew.status === 'fulfilled' && gmgnNew.value.length > 0) {
    results.newTokens.push(...gmgnNew.value);
    results.sources.gmgn = true;
  }
  if (gmgnSmartMoney.status === 'fulfilled' && gmgnSmartMoney.value.length > 0) {
    results.smartMoney = gmgnSmartMoney.value;
    results.sources.gmgn = true;
  }
  if (gmgnTopTraders.status === 'fulfilled' && gmgnTopTraders.value.length > 0) {
    results.topTraders = gmgnTopTraders.value;
    results.sources.gmgn = true;
  }
  
  // 处理 Birdeye 数据
  if (birdeyeTrending.status === 'fulfilled' && birdeyeTrending.value.length > 0) {
    results.trending.push(...birdeyeTrending.value);
    results.sources.birdeye = true;
  }
  
  // 处理 DexScreener 数据
  if (dexscreenerTrending.status === 'fulfilled' && dexscreenerTrending.value.length > 0) {
    results.trending.push(...dexscreenerTrending.value);
    results.sources.dexscreener = true;
  }
  
  // 去重热门代币 (按地址)
  const seenAddresses = new Set<string>();
  results.trending = results.trending.filter(t => {
    if (seenAddresses.has(t.address)) return false;
    seenAddresses.add(t.address);
    return true;
  });
  
  // 去重新代币
  const seenNewAddresses = new Set<string>();
  results.newTokens = results.newTokens.filter(t => {
    if (seenNewAddresses.has(t.address)) return false;
    seenNewAddresses.add(t.address);
    return true;
  });
  
  // 按市值排序热门代币
  results.trending.sort((a, b) => {
    const mcA = parseFloat(a.marketCap || '0');
    const mcB = parseFloat(b.marketCap || '0');
    return mcB - mcA;
  });
  
  // 按创建时间排序新代币
  results.newTokens.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  
  return results;
}

// ============================================
// 工具函数
// ============================================

function formatHoldTime(seconds: number): string {
  if (!seconds) return 'N/A';
  
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export default {
  // Pump.fun
  getPumpFunNewTokens,
  getPumpFunTrending,
  getPumpFunTokenDetail,
  searchPumpFunTokens,
  
  // GMGN
  getGMGNTrending,
  getGMGNNewTokens,
  getGMGNSmartMoneyTrades,
  getGMGNTopTraders,
  
  // Birdeye
  getBirdeyeTrending,
  getBirdeyeTokenDetail,
  getBirdeyePriceHistory,
  getBirdeyeOHLCV,
  
  // DexScreener
  getDexScreenerTrending,
  getDexScreenerBoosted,
  
  // 聚合
  aggregateAllPlatforms,
};
