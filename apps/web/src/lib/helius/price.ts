/**
 * 价格服务
 * 使用 Jupiter Price API 获取代币实时价格
 * Jupiter API 是免费的，不需要 API Key
 * 包含重试机制和静默错误处理
 */

// Jupiter Price API endpoints (有多个备用)
const JUPITER_PRICE_APIS = [
    'https://price.jup.ag/v6',
    'https://lite-api.jup.ag/price/v2',
];

// 请求配置
const MAX_RETRIES = 2;
const RETRY_DELAY = 500; // ms

// 静默错误处理 - 避免频繁打印错误日志
let lastErrorTime = 0;
const ERROR_THROTTLE_MS = 60000; // 1分钟内只打印一次相同错误

function logErrorOnce(message: string, error?: any) {
    const now = Date.now();
    if (now - lastErrorTime > ERROR_THROTTLE_MS) {
        console.warn(message, error);
        lastErrorTime = now;
    }
}

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface TokenPrice {
    id: string;
    mintSymbol: string;
    vsToken: string;
    vsTokenSymbol: string;
    price: number;
    timeTaken: number;
}

export interface PriceResponse {
    data: Record<string, TokenPrice>;
    timeTaken: number;
}

// 常用代币地址
export const KNOWN_TOKENS = {
    SOL: 'So11111111111111111111111111111111111111112',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    POPCAT: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
    POPCOW: '8mrMRf8QwGh5bSrgzKsMmHPTTGqDcENU91SWuXEypump',
};

/**
 * 获取单个代币价格 (带重试)
 */
export async function getTokenPrice(mintAddress: string, vsToken = 'USDC'): Promise<number | null> {
    const vsTokenAddress = KNOWN_TOKENS[vsToken as keyof typeof KNOWN_TOKENS] || vsToken;

    for (let apiIndex = 0; apiIndex < JUPITER_PRICE_APIS.length; apiIndex++) {
        const apiUrl = JUPITER_PRICE_APIS[apiIndex];

        for (let retry = 0; retry <= MAX_RETRIES; retry++) {
            try {
                const response = await fetch(
                    `${apiUrl}/price?ids=${mintAddress}&vsToken=${vsTokenAddress}`,
                    { signal: AbortSignal.timeout(5000) } // 5 秒超时
                );

                if (response.ok) {
                    const data: PriceResponse = await response.json();
                    return data.data[mintAddress]?.price || null;
                }

                // 如果是 503 或其他服务器错误，尝试重试或切换 API
                if (response.status >= 500) {
                    if (retry < MAX_RETRIES) {
                        await delay(RETRY_DELAY * (retry + 1));
                        continue;
                    }
                } else {
                    // 客户端错误不重试
                    break;
                }
            } catch (error) {
                if (retry < MAX_RETRIES) {
                    await delay(RETRY_DELAY * (retry + 1));
                    continue;
                }
            }
        }
    }

    // 所有尝试都失败，静默返回 null
    return null;
}

/**
 * 批量获取代币价格 (带重试)
 */
export async function getTokenPrices(
    mintAddresses: string[],
    vsToken = 'USDC'
): Promise<Record<string, number>> {
    if (mintAddresses.length === 0) return {};

    const vsTokenAddress = KNOWN_TOKENS[vsToken as keyof typeof KNOWN_TOKENS] || vsToken;
    const ids = mintAddresses.join(',');

    for (let apiIndex = 0; apiIndex < JUPITER_PRICE_APIS.length; apiIndex++) {
        const apiUrl = JUPITER_PRICE_APIS[apiIndex];

        for (let retry = 0; retry <= MAX_RETRIES; retry++) {
            try {
                const response = await fetch(
                    `${apiUrl}/price?ids=${ids}&vsToken=${vsTokenAddress}`,
                    { signal: AbortSignal.timeout(10000) } // 10 秒超时
                );

                if (response.ok) {
                    const data: PriceResponse = await response.json();
                    const prices: Record<string, number> = {};

                    for (const [address, info] of Object.entries(data.data)) {
                        if (info && typeof info.price === 'number') {
                            prices[address] = info.price;
                        }
                    }

                    return prices;
                }

                // 如果是 503 或其他服务器错误，尝试重试或切换 API
                if (response.status >= 500) {
                    if (retry < MAX_RETRIES) {
                        await delay(RETRY_DELAY * (retry + 1));
                        continue;
                    }
                } else {
                    // 客户端错误不重试
                    break;
                }
            } catch (error) {
                if (retry < MAX_RETRIES) {
                    await delay(RETRY_DELAY * (retry + 1));
                    continue;
                }
            }
        }
    }

    // 所有尝试都失败，静默返回空对象
    logErrorOnce('[Jupiter Price] All API endpoints failed, prices unavailable');
    return {};
}

/**
 * 获取主流代币价格
 */
export async function getMainstreamTokenPrices(): Promise<Record<string, number>> {
    const addresses = Object.values(KNOWN_TOKENS);
    return getTokenPrices(addresses);
}

/**
 * 格式化价格显示
 */
export function formatPrice(price: number | null | undefined): string {
    if (price === null || price === undefined || isNaN(price)) {
        return '$0.00';
    }

    if (price === 0) return '$0.00';
    if (price < 0.000001) return `$${price.toExponential(2)}`;
    if (price < 0.0001) return `$${price.toFixed(8)}`;
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    if (price < 1000) return `$${price.toFixed(2)}`;
    if (price < 1000000) return `$${(price / 1000).toFixed(2)}K`;
    if (price < 1000000000) return `$${(price / 1000000).toFixed(2)}M`;
    return `$${(price / 1000000000).toFixed(2)}B`;
}

/**
 * 格式化市值显示
 */
export function formatMarketCap(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value) || value === 0) {
        return '-';
    }

    if (value < 1000) return `$${value.toFixed(0)}`;
    if (value < 1000000) return `$${(value / 1000).toFixed(1)}K`;
    if (value < 1000000000) return `$${(value / 1000000).toFixed(2)}M`;
    return `$${(value / 1000000000).toFixed(2)}B`;
}

/**
 * 计算价格变化百分比
 */
export function calculatePriceChange(currentPrice: number, previousPrice: number): number {
    if (previousPrice === 0) return 0;
    return ((currentPrice - previousPrice) / previousPrice) * 100;
}

/**
 * 格式化价格变化显示
 */
export function formatPriceChange(change: number | null | undefined): string {
    if (change === null || change === undefined || isNaN(change)) {
        return '-';
    }
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
}
