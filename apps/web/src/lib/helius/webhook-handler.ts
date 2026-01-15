/**
 * Helius Webhook 监控服务
 * 实时监控链上活动，触发平台功能
 */

// ============================================
// Webhook 事件类型
// ============================================

export type WebhookEventType =
    | 'TOKEN_TRANSFER'
    | 'SWAP'
    | 'NFT_SALE'
    | 'NFT_MINT'
    | 'NEW_TOKEN'
    | 'WHALE_ACTIVITY'
    | 'KOL_ACTIVITY';

export interface WebhookConfig {
    webhookUrl: string;
    accountAddresses: string[];  // 监控的账户地址
    transactionTypes: string[];  // 监控的交易类型
    webhookType: 'enhanced' | 'raw';
}

export interface WebhookEvent {
    timestamp: number;
    type: WebhookEventType;
    description: string;
    signature: string;

    // 代币相关
    tokenMint?: string;
    tokenSymbol?: string;
    tokenAmount?: number;

    // 价格相关
    priceUsd?: number;
    valueUsd?: number;

    // 参与者
    sender?: string;
    receiver?: string;

    // 元数据
    metadata?: Record<string, unknown>;
}

// ============================================
// 平台事件触发器
// ============================================

export interface PlatformTrigger {
    id: string;
    name: string;
    description: string;
    condition: (event: WebhookEvent) => boolean;
    action: (event: WebhookEvent) => Promise<void>;
    priority: 'high' | 'medium' | 'low';
    enabled: boolean;
}

// 预定义触发器
export const PLATFORM_TRIGGERS: PlatformTrigger[] = [
    {
        id: 'kol-large-buy',
        name: 'KOL Large Buy Alert',
        description: 'Alert when a tracked KOL makes a large buy',
        condition: (event) =>
            event.type === 'SWAP' &&
            (event.valueUsd || 0) > 10000,
        action: async (event) => {
            console.log('🚨 KOL Large Buy Detected:', event);
            // TODO: 发送通知给订阅用户
            // TODO: 生成 Alpha 信号
        },
        priority: 'high',
        enabled: true,
    },
    {
        id: 'whale-movement',
        name: 'Whale Movement Alert',
        description: 'Alert when large token transfers occur',
        condition: (event) =>
            event.type === 'TOKEN_TRANSFER' &&
            (event.valueUsd || 0) > 100000,
        action: async (event) => {
            console.log('🐋 Whale Movement Detected:', event);
            // TODO: 更新保险风险评估
        },
        priority: 'high',
        enabled: true,
    },
    {
        id: 'popcow-stake',
        name: 'POPCOW Stake Event',
        description: 'Process POPCOW staking transactions',
        condition: (event) =>
            event.type === 'TOKEN_TRANSFER' &&
            event.tokenSymbol === 'POPCOW',
        action: async (event) => {
            console.log('🐄 POPCOW Stake Event:', event);
            // TODO: 更新用户质押状态
            // TODO: 计算奖励
        },
        priority: 'medium',
        enabled: true,
    },
    {
        id: 'new-token-alert',
        name: 'New Token Launch Alert',
        description: 'Alert when new tokens are launched',
        condition: (event) => event.type === 'NEW_TOKEN',
        action: async (event) => {
            console.log('🆕 New Token Launched:', event);
            // TODO: 评估代币风险
            // TODO: 生成 Alpha 信号
        },
        priority: 'medium',
        enabled: true,
    },
];

// ============================================
// Webhook 处理器
// ============================================

/**
 * 处理 Webhook 事件
 */
export async function processWebhookEvent(rawEvent: unknown): Promise<void> {
    try {
        const event = parseWebhookEvent(rawEvent);

        if (!event) {
            console.warn('Failed to parse webhook event');
            return;
        }

        // 检查所有触发器
        for (const trigger of PLATFORM_TRIGGERS) {
            if (!trigger.enabled) continue;

            try {
                if (trigger.condition(event)) {
                    console.log(`Trigger matched: ${trigger.name}`);
                    await trigger.action(event);
                }
            } catch (error) {
                console.error(`Error in trigger ${trigger.id}:`, error);
            }
        }
    } catch (error) {
        console.error('Error processing webhook event:', error);
    }
}

/**
 * 解析 Webhook 事件
 */
function parseWebhookEvent(rawEvent: unknown): WebhookEvent | null {
    try {
        // Helius Enhanced Transaction Format
        const data = rawEvent as Record<string, unknown>;

        if (!data || typeof data !== 'object') return null;

        const event: WebhookEvent = {
            timestamp: (data.timestamp as number) || Date.now(),
            type: determineEventType(data),
            description: (data.description as string) || 'Unknown Event',
            signature: (data.signature as string) || '',
        };

        // 解析代币转账
        if (data.tokenTransfers && Array.isArray(data.tokenTransfers)) {
            const transfer = data.tokenTransfers[0] as Record<string, unknown>;
            event.tokenMint = transfer.mint as string;
            event.tokenAmount = transfer.tokenAmount as number;
            event.sender = transfer.fromUserAccount as string;
            event.receiver = transfer.toUserAccount as string;
        }

        // 解析 Swap
        if (data.events && typeof data.events === 'object') {
            const events = data.events as Record<string, unknown>;
            if (events.swap) {
                const swap = events.swap as Record<string, unknown>;
                event.tokenMint = swap.tokenOutputMint as string;
                event.tokenAmount = swap.tokenOutputAmount as number;
            }
        }

        return event;
    } catch {
        return null;
    }
}

/**
 * 确定事件类型
 */
function determineEventType(data: Record<string, unknown>): WebhookEventType {
    const typeStr = data.type as string || '';

    if (typeStr.includes('SWAP')) return 'SWAP';
    if (typeStr.includes('TRANSFER')) return 'TOKEN_TRANSFER';
    if (typeStr.includes('NFT') && typeStr.includes('SALE')) return 'NFT_SALE';
    if (typeStr.includes('NFT') && typeStr.includes('MINT')) return 'NFT_MINT';

    return 'TOKEN_TRANSFER';
}

// ============================================
// 通知服务
// ============================================

export interface NotificationChannel {
    type: 'push' | 'email' | 'telegram' | 'discord';
    enabled: boolean;
    config: Record<string, string>;
}

export interface AlertSubscription {
    userId: string;
    tokenMints: string[];        // 监控的代币
    kolAddresses: string[];      // 监控的 KOL
    minValueUsd: number;         // 最小交易金额
    channels: NotificationChannel[];
}

/**
 * 发送交易提醒
 */
export async function sendTradeAlert(
    subscription: AlertSubscription,
    event: WebhookEvent
): Promise<void> {
    for (const channel of subscription.channels) {
        if (!channel.enabled) continue;

        switch (channel.type) {
            case 'push':
                // TODO: 实现 Push 通知
                console.log('Sending push notification');
                break;
            case 'telegram':
                // TODO: 实现 Telegram 通知
                console.log('Sending Telegram message');
                break;
            case 'discord':
                // TODO: 实现 Discord 通知
                console.log('Sending Discord message');
                break;
        }
    }
}

// ============================================
// 监控配置
// ============================================

export interface MonitoringConfig {
    // KOL 钱包监控
    kolWallets: string[];

    // 巨鲸阈值
    whaleThresholdUsd: number;

    // 更新频率
    pollIntervalMs: number;

    // 过滤器
    ignoreTokens: string[];
    onlyTokens: string[];
}

export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
    kolWallets: [
        '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1', // Raydium Treasury
        'ANULrLMRVxxHqEWYVqD92pKyqGLH4hwGTHqSqKjLRQq6', // Alameda
        '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', // Binance
    ],
    whaleThresholdUsd: 100000,
    pollIntervalMs: 30000,
    ignoreTokens: [],
    onlyTokens: [],
};

// ============================================
// 导出
// ============================================

export {
    processWebhookEvent,
    sendTradeAlert,
    PLATFORM_TRIGGERS,
    DEFAULT_MONITORING_CONFIG,
};
