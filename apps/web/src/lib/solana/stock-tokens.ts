import { PublicKey } from '@solana/web3.js';

/**
 * Solana 股票代币化产品
 * 
 * 主要来源:
 * - xStocks by Backed Finance: 60+ 美国股票和 ETF
 * - Ondo Finance: 美国国债代币
 * - Parcl: 房地产指数
 */

// ============================================
// xStocks by Backed Finance
// ============================================

/**
 * xStocks 代币化股票
 * 
 * 注意: 以下地址为示例，实际部署后需要更新为真实地址
 * 获取地址: https://xstocks.backed.fi/tokens
 */
export const XSTOCKS_TOKENS = {
  // 科技股
  AAPLx: {
    mint: new PublicKey('11111111111111111111111111111111'), // TODO: 更新为真实地址
    symbol: 'AAPLx',
    name: 'Apple Stock Token',
    decimals: 6,
    source: 'xStocks',
    underlying: 'AAPL',
    type: 'stock',
  },
  TSLAx: {
    mint: new PublicKey('11111111111111111111111111111111'), // TODO: 更新
    symbol: 'TSLAx',
    name: 'Tesla Stock Token',
    decimals: 6,
    source: 'xStocks',
    underlying: 'TSLA',
    type: 'stock',
  },
  MSFTx: {
    mint: new PublicKey('11111111111111111111111111111111'), // TODO: 更新
    symbol: 'MSFTx',
    name: 'Microsoft Stock Token',
    decimals: 6,
    source: 'xStocks',
    underlying: 'MSFT',
    type: 'stock',
  },
  GOOGLx: {
    mint: new PublicKey('11111111111111111111111111111111'), // TODO: 更新
    symbol: 'GOOGLx',
    name: 'Google Stock Token',
    decimals: 6,
    source: 'xStocks',
    underlying: 'GOOGL',
    type: 'stock',
  },
  NVDAx: {
    mint: new PublicKey('11111111111111111111111111111111'), // TODO: 更新
    symbol: 'NVDAx',
    name: 'NVIDIA Stock Token',
    decimals: 6,
    source: 'xStocks',
    underlying: 'NVDA',
    type: 'stock',
  },
  
  // ETF
  SPYx: {
    mint: new PublicKey('11111111111111111111111111111111'), // TODO: 更新
    symbol: 'SPYx',
    name: 'S&P 500 ETF Token',
    decimals: 6,
    source: 'xStocks',
    underlying: 'SPY',
    type: 'etf',
  },
  QQQx: {
    mint: new PublicKey('11111111111111111111111111111111'), // TODO: 更新
    symbol: 'QQQx',
    name: 'Nasdaq ETF Token',
    decimals: 6,
    source: 'xStocks',
    underlying: 'QQQ',
    type: 'etf',
  },
};

// ============================================
// Ondo Finance
// ============================================

export const ONDO_TOKENS = {
  USDY: {
    mint: new PublicKey('11111111111111111111111111111111'), // TODO: 更新
    symbol: 'USDY',
    name: 'Ondo USD Yield',
    decimals: 6,
    source: 'Ondo',
    type: 'treasury',
    description: '美国国债支持的稳定币',
  },
  OUSG: {
    mint: new PublicKey('11111111111111111111111111111111'), // TODO: 更新
    symbol: 'OUSG',
    name: 'Ondo Short-Term US Government',
    decimals: 6,
    source: 'Ondo',
    type: 'treasury',
    description: '短期美国国债基金',
  },
};

// ============================================
// Parcl
// ============================================

export const PARCL_TOKEN = {
  PRCL: {
    mint: new PublicKey('11111111111111111111111111111111'), // TODO: 更新
    symbol: 'PRCL',
    name: 'Parcl Real Estate Index',
    decimals: 9,
    source: 'Parcl',
    type: 'real-estate',
    description: '城市级房地产价格指数',
  },
};

// ============================================
// 合并所有股票代币
// ============================================

export const ALL_STOCK_TOKENS = {
  ...XSTOCKS_TOKENS,
  ...ONDO_TOKENS,
  ...PARCL_TOKEN,
};

// ============================================
// 辅助函数
// ============================================

/**
 * 获取所有股票代币列表
 */
export function getAllStockTokens() {
  return Object.values(ALL_STOCK_TOKENS);
}

/**
 * 根据符号查找股票代币
 */
export function getStockTokenBySymbol(symbol: string) {
  return Object.values(ALL_STOCK_TOKENS).find(
    token => token.symbol.toLowerCase() === symbol.toLowerCase()
  );
}

/**
 * 根据 Mint 地址查找股票代币
 */
export function getStockTokenByMint(mint: string | PublicKey) {
  const mintStr = typeof mint === 'string' ? mint : mint.toBase58();
  return Object.values(ALL_STOCK_TOKENS).find(
    token => token.mint.toBase58() === mintStr
  );
}

/**
 * 检查是否为股票代币
 */
export function isStockToken(mint: string | PublicKey): boolean {
  return getStockTokenByMint(mint) !== undefined;
}

/**
 * 按类型筛选股票代币
 */
export function getStockTokensByType(type: 'stock' | 'etf' | 'treasury' | 'real-estate') {
  return Object.values(ALL_STOCK_TOKENS).filter(
    token => token.type === type
  );
}

// ============================================
// 价格数据获取
// ============================================

/**
 * 获取股票代币价格
 * 
 * 数据源:
 * - Birdeye API (链上价格)
 * - xStocks API (基础资产价格)
 */
export async function getStockTokenPrice(
  mint: string | PublicKey,
  useUnderlyingPrice = false
): Promise<number | null> {
  const token = getStockTokenByMint(mint);
  if (!token) return null;

  try {
    if (useUnderlyingPrice && 'underlying' in token) {
      // 使用基础资产价格（如 AAPL 股票价格）
      // 需要集成股票价格 API（如 Alpha Vantage, Yahoo Finance）
      // 这里返回 null，需要实现
      return null;
    } else {
      // 使用链上代币价格（Birdeye）
      const mintStr = typeof mint === 'string' ? mint : mint.toBase58();
      const response = await fetch(
        `https://public-api.birdeye.so/defi/token_overview?address=${mintStr}`
      );
      const data = await response.json();
      return data.price || null;
    }
  } catch (error) {
    console.error('Failed to fetch stock token price:', error);
    return null;
  }
}

/**
 * 批量获取股票代币价格
 */
export async function getStockTokenPrices(
  mints: (string | PublicKey)[]
): Promise<Record<string, number | null>> {
  const prices: Record<string, number | null> = {};
  
  await Promise.all(
    mints.map(async (mint) => {
      const mintStr = typeof mint === 'string' ? mint : mint.toBase58();
      prices[mintStr] = await getStockTokenPrice(mint);
    })
  );
  
  return prices;
}
