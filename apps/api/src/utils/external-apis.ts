/**
 * 外部 API 集成工具
 * DexScreener, Bitquery, Covalent 等数据源
 */

export interface TokenPrice {
  priceUsd: string;
  priceChange24h: number;
  volume24h: string;
  liquidity: string;
  marketCap: string;
  fdv: string;
}

export interface TokenInfo {
  address: string;
  chain: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUrl?: string;
  priceUsd?: string;
  marketCap?: string;
  holderCount?: number;
}

export interface DevLaunchHistory {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  chain: string;
  launchDate: number;
  athMarketCap: string;
  currentMarketCap: string;
  status: 'active' | 'graduated' | 'rugged' | 'dead';
}

// ============================================
// DexScreener API
// ============================================

const DEXSCREENER_BASE_URL = 'https://api.dexscreener.com/latest';

export async function getTokenPrice(
  chain: string,
  tokenAddress: string
): Promise<TokenPrice | null> {
  try {
    const chainMap: Record<string, string> = {
      solana: 'solana',
      base: 'base',
      ethereum: 'ethereum',
      bnb: 'bsc',
    };

    const dexChain = chainMap[chain] || chain;
    const response = await fetch(
      `${DEXSCREENER_BASE_URL}/dex/tokens/${tokenAddress}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    const pair = data.pairs?.find((p: any) => p.chainId === dexChain);

    if (!pair) return null;

    return {
      priceUsd: pair.priceUsd || '0',
      priceChange24h: pair.priceChange?.h24 || 0,
      volume24h: pair.volume?.h24 || '0',
      liquidity: pair.liquidity?.usd || '0',
      marketCap: pair.marketCap || '0',
      fdv: pair.fdv || '0',
    };
  } catch (error) {
    console.error('DexScreener API error:', error);
    return null;
  }
}

export async function getTrendingTokens(chain: string, limit = 20): Promise<TokenInfo[]> {
  try {
    const chainMap: Record<string, string> = {
      solana: 'solana',
      base: 'base',
      ethereum: 'ethereum',
      bnb: 'bsc',
    };

    const dexChain = chainMap[chain] || chain;
    const response = await fetch(
      `${DEXSCREENER_BASE_URL}/dex/search?q=chain:${dexChain}`
    );

    if (!response.ok) return [];

    const data = await response.json();
    const pairs = data.pairs?.slice(0, limit) || [];

    return pairs.map((pair: any) => ({
      address: pair.baseToken?.address,
      chain,
      name: pair.baseToken?.name,
      symbol: pair.baseToken?.symbol,
      decimals: 18,
      logoUrl: pair.info?.imageUrl,
      priceUsd: pair.priceUsd,
      marketCap: pair.marketCap,
    }));
  } catch (error) {
    console.error('DexScreener trending error:', error);
    return [];
  }
}

// ============================================
// Bitquery API (GraphQL)
// ============================================

const BITQUERY_URL = 'https://graphql.bitquery.io';

export async function getDevLaunchHistory(
  devAddress: string,
  apiKey: string
): Promise<DevLaunchHistory[]> {
  const query = `
    query ($address: String!) {
      ethereum(network: bsc) {
        smartContractCalls(
          smartContractMethod: {is: "createToken"}
          caller: {is: $address}
          options: {limit: 50, desc: "block.timestamp.time"}
        ) {
          block {
            timestamp {
              time(format: "%Y-%m-%d %H:%M:%S")
            }
          }
          smartContract {
            address {
              address
            }
          }
          transaction {
            hash
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(BITQUERY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        query,
        variables: { address: devAddress },
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    // 处理响应数据
    return [];
  } catch (error) {
    console.error('Bitquery API error:', error);
    return [];
  }
}

// ============================================
// Covalent API
// ============================================

const COVALENT_BASE_URL = 'https://api.covalenthq.com/v1';

export async function getTokenHolders(
  chain: string,
  tokenAddress: string,
  apiKey: string
): Promise<number> {
  const chainMap: Record<string, string> = {
    solana: 'solana-mainnet',
    base: 'base-mainnet',
    ethereum: 'eth-mainnet',
    bnb: 'bsc-mainnet',
  };

  const covalentChain = chainMap[chain];
  if (!covalentChain) return 0;

  try {
    const response = await fetch(
      `${COVALENT_BASE_URL}/${covalentChain}/tokens/${tokenAddress}/token_holders_v2/?key=${apiKey}&page-size=1`
    );

    if (!response.ok) return 0;

    const data = await response.json();
    return data.data?.pagination?.total_count || 0;
  } catch (error) {
    console.error('Covalent API error:', error);
    return 0;
  }
}

export async function getWalletTokenBalance(
  chain: string,
  walletAddress: string,
  tokenAddress: string,
  apiKey: string
): Promise<string> {
  const chainMap: Record<string, string> = {
    base: 'base-mainnet',
    ethereum: 'eth-mainnet',
    bnb: 'bsc-mainnet',
  };

  const covalentChain = chainMap[chain];
  if (!covalentChain) return '0';

  try {
    const response = await fetch(
      `${COVALENT_BASE_URL}/${covalentChain}/address/${walletAddress}/balances_v2/?key=${apiKey}`
    );

    if (!response.ok) return '0';

    const data = await response.json();
    const token = data.data?.items?.find(
      (item: any) => item.contract_address?.toLowerCase() === tokenAddress.toLowerCase()
    );

    return token?.balance || '0';
  } catch (error) {
    console.error('Covalent balance error:', error);
    return '0';
  }
}

// ============================================
// Solana RPC
// ============================================

export async function getSolanaTokenBalance(
  rpcUrl: string,
  walletAddress: string,
  tokenMint: string
): Promise<string> {
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [
          walletAddress,
          { mint: tokenMint },
          { encoding: 'jsonParsed' },
        ],
      }),
    });

    if (!response.ok) return '0';

    const data = await response.json();
    const account = data.result?.value?.[0];
    return account?.account?.data?.parsed?.info?.tokenAmount?.amount || '0';
  } catch (error) {
    console.error('Solana RPC error:', error);
    return '0';
  }
}
