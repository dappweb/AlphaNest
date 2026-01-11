/**
 * Blockchain 查询路由
 * 提供链上数据查询接口
 */

import { Hono } from 'hono';

const app = new Hono();

// RPC URLs by chain
// Note: In production, these should come from environment variables
const RPC_URLS: Record<number, string> = {
  1: 'https://eth.llamarpc.com',
  8453: 'https://mainnet.base.org',
  56: 'https://bsc-dataseed.binance.org',
  11155111: 'https://eth-sepolia.g.alchemy.com/v2/KQ2LUgUJLj4EtMsOp_poH', // Full URL for Sepolia
};

/**
 * GET /balance
 * 获取代币余额
 */
app.get('/balance', async (c) => {
  const address = c.req.query('address');
  const token = c.req.query('token');
  const chainId = parseInt(c.req.query('chainId') || '1');

  if (!address) {
    return c.json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: 'Missing address parameter' },
    }, 400);
  }

  try {
    const rpcUrl = RPC_URLS[chainId];
    if (!rpcUrl) {
      return c.json({
        success: false,
        error: { code: 'UNSUPPORTED_CHAIN', message: `Chain ${chainId} not supported` },
      }, 400);
    }

    // If token is provided, get ERC20 balance
    if (token && token !== '0x0000000000000000000000000000000000000000') {
      // ERC20 balanceOf call
      const balanceOfData = '0x70a08231' + address.slice(2).padStart(64, '0');
      
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [
            {
              to: token,
              data: balanceOfData,
            },
            'latest',
          ],
          id: 1,
        }),
      });

      if (!response.ok) {
        throw new Error('RPC call failed');
      }

      const result = await response.json();
      const balance = result.result || '0x0';

      return c.json({
        success: true,
        data: {
          address,
          token,
          chainId,
          balance: BigInt(balance).toString(),
        },
      });
    } else {
      // Native token balance (ETH/BNB)
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1,
        }),
      });

      if (!response.ok) {
        throw new Error('RPC call failed');
      }

      const result = await response.json();
      const balance = result.result || '0x0';

      return c.json({
        success: true,
        data: {
          address,
          token: 'native',
          chainId,
          balance: BigInt(balance).toString(),
        },
      });
    }
  } catch (error) {
    console.error('Balance fetch error:', error);
    return c.json({
      success: false,
      error: { code: 'RPC_ERROR', message: 'Failed to fetch balance' },
    }, 500);
  }
});

/**
 * GET /prices
 * 获取代币价格
 */
app.get('/prices', async (c) => {
  const symbols = c.req.query('symbols');
  const chainId = parseInt(c.req.query('chainId') || '1');

  if (!symbols) {
    return c.json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: 'Missing symbols parameter' },
    }, 400);
  }

  try {
    const symbolList = symbols.split(',').map((s) => s.trim().toUpperCase());
    const prices: Record<string, { price: number; change24h: number }> = {};

    // Try to fetch from cache first
    const cacheKey = `prices:${chainId}:${symbols}`;
    const cached = await c.env.CACHE.get(cacheKey, { type: 'json' });
    
    if (cached) {
      return c.json({ success: true, data: cached });
    }

    // Fetch from DexScreener or CoinGecko
    for (const symbol of symbolList) {
      try {
        // Use DexScreener for token prices
        const response = await fetch(
          `https://api.dexscreener.com/latest/dex/search?q=${symbol}`,
          {
            headers: { 'Accept': 'application/json' },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const pair = data.pairs?.[0];
          
          if (pair) {
            prices[symbol] = {
              price: parseFloat(pair.priceUsd || '0'),
              change24h: pair.priceChange?.h24 || 0,
            };
          }
        }
      } catch (err) {
        console.error(`Error fetching price for ${symbol}:`, err);
        // Use default values
        prices[symbol] = {
          price: 0,
          change24h: 0,
        };
      }
    }

    // Cache for 1 minute
    await c.env.CACHE.put(cacheKey, JSON.stringify(prices), { expirationTtl: 60 });

    return c.json({ success: true, data: prices });
  } catch (error) {
    console.error('Price fetch error:', error);
    return c.json({
      success: false,
      error: { code: 'PRICE_ERROR', message: 'Failed to fetch prices' },
    }, 500);
  }
});

export { app as blockchainRoutes };
