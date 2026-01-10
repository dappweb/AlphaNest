/**
 * DEX Aggregator 集成
 * 支持 0x API 和 1inch API 获取最优交易报价
 */

export interface SwapQuote {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  price: string;
  guaranteedPrice: string;
  estimatedGas: string;
  gasPrice: string;
  protocolFee: string;
  minimumProtocolFee: string;
  sources: { name: string; proportion: string }[];
  allowanceTarget: string;
  to: string;
  data: string;
  value: string;
}

export interface SwapParams {
  sellToken: string;
  buyToken: string;
  sellAmount?: string;
  buyAmount?: string;
  slippagePercentage?: number;
  takerAddress?: string;
  chainId: number;
}

// Chain-specific configurations
const CHAIN_CONFIG: Record<number, { name: string; zeroExApi: string; oneInchApi: string }> = {
  1: {
    name: 'ethereum',
    zeroExApi: 'https://api.0x.org',
    oneInchApi: 'https://api.1inch.dev/swap/v6.0/1',
  },
  8453: {
    name: 'base',
    zeroExApi: 'https://base.api.0x.org',
    oneInchApi: 'https://api.1inch.dev/swap/v6.0/8453',
  },
  11155111: {
    name: 'sepolia',
    zeroExApi: 'https://sepolia.api.0x.org',
    oneInchApi: '', // 1inch doesn't support Sepolia
  },
  56: {
    name: 'bsc',
    zeroExApi: 'https://bsc.api.0x.org',
    oneInchApi: 'https://api.1inch.dev/swap/v6.0/56',
  },
};

/**
 * 获取 0x API 报价
 */
export async function get0xQuote(params: SwapParams, apiKey?: string): Promise<SwapQuote | null> {
  const config = CHAIN_CONFIG[params.chainId];
  if (!config?.zeroExApi) {
    console.error('Unsupported chain for 0x:', params.chainId);
    return null;
  }

  try {
    const queryParams = new URLSearchParams({
      sellToken: params.sellToken,
      buyToken: params.buyToken,
      ...(params.sellAmount && { sellAmount: params.sellAmount }),
      ...(params.buyAmount && { buyAmount: params.buyAmount }),
      ...(params.slippagePercentage && { slippagePercentage: params.slippagePercentage.toString() }),
      ...(params.takerAddress && { takerAddress: params.takerAddress }),
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['0x-api-key'] = apiKey;
    }

    const response = await fetch(`${config.zeroExApi}/swap/v1/quote?${queryParams}`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('0x API error:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('0x API request failed:', error);
    return null;
  }
}

/**
 * 获取 0x API 价格预估 (不含交易数据)
 */
export async function get0xPrice(params: SwapParams, apiKey?: string): Promise<{
  price: string;
  buyAmount: string;
  sellAmount: string;
  estimatedGas: string;
} | null> {
  const config = CHAIN_CONFIG[params.chainId];
  if (!config?.zeroExApi) return null;

  try {
    const queryParams = new URLSearchParams({
      sellToken: params.sellToken,
      buyToken: params.buyToken,
      ...(params.sellAmount && { sellAmount: params.sellAmount }),
      ...(params.buyAmount && { buyAmount: params.buyAmount }),
    });

    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['0x-api-key'] = apiKey;
    }

    const response = await fetch(`${config.zeroExApi}/swap/v1/price?${queryParams}`, {
      headers,
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('0x price request failed:', error);
    return null;
  }
}

/**
 * 获取 1inch API 报价
 */
export async function get1inchQuote(params: SwapParams, apiKey: string): Promise<SwapQuote | null> {
  const config = CHAIN_CONFIG[params.chainId];
  if (!config?.oneInchApi) {
    console.error('Unsupported chain for 1inch:', params.chainId);
    return null;
  }

  try {
    const queryParams = new URLSearchParams({
      src: params.sellToken,
      dst: params.buyToken,
      amount: params.sellAmount || '0',
      from: params.takerAddress || '0x0000000000000000000000000000000000000000',
      slippage: ((params.slippagePercentage || 0.5) * 100).toString(),
      disableEstimate: 'true',
    });

    const response = await fetch(`${config.oneInchApi}/swap?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('1inch API error:', error);
      return null;
    }

    const data = await response.json();
    
    // Transform 1inch response to our format
    return {
      sellToken: params.sellToken,
      buyToken: params.buyToken,
      sellAmount: data.fromAmount,
      buyAmount: data.toAmount,
      price: (parseFloat(data.toAmount) / parseFloat(data.fromAmount)).toString(),
      guaranteedPrice: data.toAmount,
      estimatedGas: data.tx?.gas || '0',
      gasPrice: data.tx?.gasPrice || '0',
      protocolFee: '0',
      minimumProtocolFee: '0',
      sources: data.protocols?.flat()?.map((p: any) => ({
        name: p.name,
        proportion: p.part?.toString() || '0',
      })) || [],
      allowanceTarget: data.tx?.to || '',
      to: data.tx?.to || '',
      data: data.tx?.data || '',
      value: data.tx?.value || '0',
    };
  } catch (error) {
    console.error('1inch API request failed:', error);
    return null;
  }
}

/**
 * 获取最优报价 (比较多个聚合器)
 */
export async function getBestQuote(
  params: SwapParams,
  options?: { zeroExApiKey?: string; oneInchApiKey?: string }
): Promise<{ quote: SwapQuote; source: '0x' | '1inch' } | null> {
  const quotes = await Promise.all([
    get0xQuote(params, options?.zeroExApiKey),
    options?.oneInchApiKey ? get1inchQuote(params, options.oneInchApiKey) : null,
  ]);

  const [zeroXQuote, oneInchQuote] = quotes;

  if (!zeroXQuote && !oneInchQuote) {
    return null;
  }

  if (!oneInchQuote) {
    return { quote: zeroXQuote!, source: '0x' };
  }

  if (!zeroXQuote) {
    return { quote: oneInchQuote, source: '1inch' };
  }

  // Compare buy amounts (more is better)
  const zeroXBuyAmount = BigInt(zeroXQuote.buyAmount);
  const oneInchBuyAmount = BigInt(oneInchQuote.buyAmount);

  if (oneInchBuyAmount > zeroXBuyAmount) {
    return { quote: oneInchQuote, source: '1inch' };
  }

  return { quote: zeroXQuote, source: '0x' };
}

/**
 * 常用代币地址
 */
export const COMMON_TOKENS: Record<number, Record<string, string>> = {
  1: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EescdeCB5BE1eTea',
  },
  8453: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WETH: '0x4200000000000000000000000000000000000006',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDbC: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
  },
  11155111: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WETH: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
    USDC: '0xdaA1EEEEE49b6c9Fb6ec2D990D07f1CD6281bebe', // Mock USDC
  },
};

/**
 * 格式化金额 (wei to ether)
 */
export function formatTokenAmount(amount: string, decimals: number): string {
  const value = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;
  
  if (fractionalPart === BigInt(0)) {
    return integerPart.toString();
  }
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmedFractional = fractionalStr.replace(/0+$/, '');
  
  return `${integerPart}.${trimmedFractional}`;
}

/**
 * 解析金额 (ether to wei)
 */
export function parseTokenAmount(amount: string, decimals: number): string {
  const [integerPart, fractionalPart = ''] = amount.split('.');
  const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(integerPart + paddedFractional).toString();
}
