/**
 * Helius API 客户端
 * 封装所有 Helius API 调用
 */

const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY || '';
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const HELIUS_API_URL = `https://api.helius.xyz/v0`;

// ============================================
// 类型定义
// ============================================

export interface HeliusAsset {
    id: string;
    interface: string;
    content: {
        $schema?: string;
        json_uri?: string;
        files?: Array<{
            uri: string;
            cdn_uri?: string;
            mime?: string;
        }>;
        metadata: {
            name: string;
            symbol: string;
            description?: string;
            image?: string;
        };
        links?: {
            image?: string;
            external_url?: string;
        };
    };
    authorities?: Array<{
        address: string;
        scopes: string[];
    }>;
    compression?: {
        eligible: boolean;
        compressed: boolean;
        data_hash?: string;
        creator_hash?: string;
        asset_hash?: string;
        tree?: string;
        seq?: number;
        leaf_id?: number;
    };
    grouping?: Array<{
        group_key: string;
        group_value: string;
    }>;
    royalty?: {
        royalty_model: string;
        target?: string;
        percent: number;
        basis_points: number;
        primary_sale_happened: boolean;
        locked: boolean;
    };
    creators?: Array<{
        address: string;
        share: number;
        verified: boolean;
    }>;
    ownership: {
        frozen: boolean;
        delegated: boolean;
        delegate?: string;
        ownership_model: string;
        owner: string;
    };
    supply?: {
        print_max_supply: number;
        print_current_supply: number;
        edition_nonce?: number;
    };
    mutable: boolean;
    burnt: boolean;
    token_info?: {
        symbol: string;
        balance: number;
        supply: number;
        decimals: number;
        token_program: string;
        associated_token_address: string;
        price_info?: {
            price_per_token: number;
            total_price: number;
            currency: string;
        };
    };
}

export interface HeliusTransaction {
    signature: string;
    slot: number;
    timestamp: number;
    fee: number;
    feePayer: string;
    type: string;
    source: string;
    description: string;
    accountData: Array<{
        account: string;
        nativeBalanceChange: number;
        tokenBalanceChanges: Array<{
            userAccount: string;
            tokenAccount: string;
            rawTokenAmount: {
                tokenAmount: string;
                decimals: number;
            };
            mint: string;
        }>;
    }>;
    tokenTransfers: Array<{
        fromUserAccount: string;
        toUserAccount: string;
        fromTokenAccount: string;
        toTokenAccount: string;
        tokenAmount: number;
        decimals: number;
        tokenStandard: string;
        mint: string;
    }>;
    nativeTransfers: Array<{
        fromUserAccount: string;
        toUserAccount: string;
        amount: number;
    }>;
    events?: {
        nft?: any;
        swap?: any;
        compressed?: any;
    };
}

export interface GetAssetsByOwnerParams {
    ownerAddress: string;
    page?: number;
    limit?: number;
    displayOptions?: {
        showFungible?: boolean;
        showNativeBalance?: boolean;
        showInscription?: boolean;
        showZeroBalance?: boolean;
    };
    sortBy?: {
        sortBy: 'created' | 'updated' | 'recent_action' | 'none';
        sortDirection: 'asc' | 'desc';
    };
}

export interface SearchAssetsParams {
    ownerAddress?: string;
    tokenType?: 'fungible' | 'nonFungible' | 'regularNft' | 'compressedNft' | 'all';
    creatorAddress?: string;
    grouping?: [string, string];
    page?: number;
    limit?: number;
    displayOptions?: {
        showFungible?: boolean;
        showNativeBalance?: boolean;
    };
}

// ============================================
// API 调用方法
// ============================================

/**
 * 发送 JSON-RPC 请求到 Helius
 */
async function heliusRpcCall<T>(method: string, params: any): Promise<T> {
    const response = await fetch(HELIUS_RPC_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: `helius-${Date.now()}`,
            method,
            params,
        }),
    });

    if (!response.ok) {
        throw new Error(`Helius RPC error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
        throw new Error(`Helius RPC error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    return data.result;
}

/**
 * 发送 REST API 请求到 Helius
 */
async function heliusApiCall<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${HELIUS_API_URL}${endpoint}`);
    url.searchParams.set('api-key', HELIUS_API_KEY);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error(`Helius API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

// ============================================
// 导出的 API 方法
// ============================================

/**
 * 获取单个资产/代币的详细信息
 */
export async function getAsset(mintAddress: string): Promise<HeliusAsset> {
    return heliusRpcCall<HeliusAsset>('getAsset', {
        id: mintAddress,
        displayOptions: {
            showFungible: true,
        },
    });
}

/**
 * 获取多个资产的详细信息
 */
export async function getAssetBatch(mintAddresses: string[]): Promise<HeliusAsset[]> {
    return heliusRpcCall<HeliusAsset[]>('getAssetBatch', {
        ids: mintAddresses,
        displayOptions: {
            showFungible: true,
        },
    });
}

/**
 * 获取钱包拥有的所有资产
 */
export async function getAssetsByOwner(params: GetAssetsByOwnerParams): Promise<{
    total: number;
    limit: number;
    page: number;
    items: HeliusAsset[];
    nativeBalance?: {
        lamports: number;
        price_per_sol: number;
        total_price: number;
    };
}> {
    return heliusRpcCall('getAssetsByOwner', {
        ownerAddress: params.ownerAddress,
        page: params.page || 1,
        limit: params.limit || 100,
        displayOptions: {
            showFungible: true,
            showNativeBalance: true,
            showZeroBalance: false,
            ...params.displayOptions,
        },
        sortBy: params.sortBy,
    });
}

/**
 * 搜索资产
 */
export async function searchAssets(params: SearchAssetsParams): Promise<{
    total: number;
    limit: number;
    page: number;
    items: HeliusAsset[];
}> {
    return heliusRpcCall('searchAssets', {
        ownerAddress: params.ownerAddress,
        tokenType: params.tokenType || 'fungible',
        creatorAddress: params.creatorAddress,
        grouping: params.grouping,
        page: params.page || 1,
        limit: params.limit || 100,
        displayOptions: {
            showFungible: true,
            showNativeBalance: true,
            ...params.displayOptions,
        },
    });
}

/**
 * 获取地址的交易历史
 */
export async function getTransactionsForAddress(
    address: string,
    options?: {
        before?: string;
        until?: string;
        limit?: number;
        type?: string;
    }
): Promise<HeliusTransaction[]> {
    const params: Record<string, string> = {};
    if (options?.before) params.before = options.before;
    if (options?.until) params.until = options.until;
    if (options?.limit) params.limit = options.limit.toString();
    if (options?.type) params.type = options.type;

    return heliusApiCall<HeliusTransaction[]>(`/addresses/${address}/transactions`, params);
}

/**
 * 解析交易签名为可读格式
 */
export async function parseTransactions(signatures: string[]): Promise<HeliusTransaction[]> {
    const response = await fetch(`${HELIUS_API_URL}/transactions?api-key=${HELIUS_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            transactions: signatures,
        }),
    });

    if (!response.ok) {
        throw new Error(`Helius API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

/**
 * 获取代币持有者列表
 */
export async function getTokenHolders(mintAddress: string, limit = 100): Promise<{
    total: number;
    result: Array<{
        owner: string;
        balance: number;
    }>;
}> {
    // 使用 searchAssets 来查找持有某个代币的所有账户
    // 注意：这是一个简化实现，实际可能需要更复杂的查询
    return heliusRpcCall('getTokenAccounts', {
        mint: mintAddress,
        limit,
    });
}

/**
 * 获取 RPC 端点 URL
 */
export function getHeliusRpcUrl(): string {
    return HELIUS_RPC_URL;
}

/**
 * 检查 API Key 是否已配置
 */
export function isHeliusConfigured(): boolean {
    return HELIUS_API_KEY.length > 0;
}
