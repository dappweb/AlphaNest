/**
 * 交易模块路由
 */

import { Hono } from 'hono';

const app = new Hono();

// Chain-specific 0x API configurations
const ZEROX_APIS: Record<string, string> = {
  '1': 'https://api.0x.org',
  '8453': 'https://base.api.0x.org',
  '11155111': 'https://sepolia.api.0x.org',
  '56': 'https://bsc.api.0x.org',
};

const CHAIN_NAMES: Record<string, string> = {
  'ethereum': '1',
  'base': '8453',
  'sepolia': '11155111',
  'bsc': '56',
  'bsc-testnet': '97',
};

/**
 * GET /quote
 * 获取交易报价 (使用 0x API)
 */
app.get('/quote', async (c) => {
  const tokenIn = c.req.query('token_in');
  const tokenOut = c.req.query('token_out');
  const amount = c.req.query('amount');
  const chain = c.req.query('chain') || 'base';
  const slippage = c.req.query('slippage') || '0.5';

  if (!tokenIn || !tokenOut || !amount) {
    return c.json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: 'Missing required parameters' },
    }, 400);
  }

  try {
    // Get chain ID
    const chainId = CHAIN_NAMES[chain.toLowerCase()] || chain;
    const zeroXApi = ZEROX_APIS[chainId];

    if (!zeroXApi) {
      return c.json({
        success: false,
        error: { code: 'UNSUPPORTED_CHAIN', message: `Chain ${chain} is not supported` },
      }, 400);
    }

    // Fetch quote from 0x API
    const queryParams = new URLSearchParams({
      sellToken: tokenIn,
      buyToken: tokenOut,
      sellAmount: amount,
      slippagePercentage: slippage,
    });

    const response = await fetch(`${zeroXApi}/swap/v1/quote?${queryParams}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ reason: 'Unknown error' }));
      return c.json({
        success: false,
        error: { code: 'QUOTE_FAILED', message: error.reason || 'Failed to get quote' },
      }, response.status);
    }

    const quoteData = await response.json();

    // Transform 0x response to our format
    const quote = {
      token_in: tokenIn,
      token_out: tokenOut,
      amount_in: quoteData.sellAmount,
      amount_out: quoteData.buyAmount,
      price: quoteData.price,
      price_impact: quoteData.estimatedPriceImpact ? parseFloat(quoteData.estimatedPriceImpact) * 100 : 0,
      route: quoteData.sources || [],
      gas_estimate: quoteData.estimatedGas || '0',
      gas_price: quoteData.gasPrice || '0',
      to: quoteData.to,
      data: quoteData.data,
      value: quoteData.value || '0',
      allowance_target: quoteData.allowanceTarget,
      expires_at: Date.now() + 30000, // 30 seconds
    };

    return c.json({ success: true, data: quote });
  } catch (error) {
    console.error('Quote error:', error);
    return c.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch quote' },
    }, 500);
  }
});

/**
 * POST /execute
 * 执行交易 (返回交易数据，由前端发送)
 */
app.post('/execute', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  const { token_in, token_out, amount, chain, quote } = body;

  if (!token_in || !token_out || !amount) {
    return c.json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: 'Missing required parameters' },
    }, 400);
  }

  // Note: Actual transaction execution happens on the client side
  // This endpoint can be used for logging/analytics
  if (user) {
    // Log trade attempt to database
    try {
      await c.env.DB.prepare(`
        INSERT INTO trade_logs (user_id, token_in, token_out, amount, chain, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        user.id,
        token_in,
        token_out,
        amount,
        chain || 'base',
        Date.now()
      ).run();
    } catch (error) {
      console.error('Failed to log trade:', error);
      // Don't fail the request if logging fails
    }
  }

  return c.json({
    success: true,
    data: {
      message: 'Trade data prepared. Please sign and send transaction from your wallet.',
      quote: quote || null,
    },
  });
});

export { app as tradeRoutes };
