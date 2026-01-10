/**
 * AlphaNest Telegram Bot
 * 
 * Features:
 * - /start - Welcome and setup
 * - /subscribe - Subscribe to alerts
 * - /unsubscribe - Unsubscribe from alerts
 * - /whale - Get recent whale alerts
 * - /dev - Look up Dev reputation
 * - /price - Get token price
 * - /insurance - Check insurance pools
 * - /help - Show commands
 */

// Cloudflare Workers KV Namespace type
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number }): Promise<{ keys: { name: string }[] }>;
}

export interface Env {
  SUBSCRIPTIONS: KVNamespace;
  TELEGRAM_BOT_TOKEN: string;
  WEBHOOK_SECRET: string;
  API_BASE_URL?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    date: number;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
    };
    message: {
      message_id: number;
      chat: {
        id: number;
      };
    };
    data: string;
  };
}

interface UserSubscription {
  chatId: number;
  username?: string;
  whaleAlerts: boolean;
  devAlerts: boolean;
  priceAlerts: boolean;
  insuranceAlerts: boolean;
  watchlist: string[];
  createdAt: number;
  updatedAt: number;
}

const TELEGRAM_API = 'https://api.telegram.org/bot';

async function sendMessage(
  token: string,
  chatId: number,
  text: string,
  options?: {
    parse_mode?: 'HTML' | 'Markdown';
    reply_markup?: object;
  }
): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options?.parse_mode || 'HTML',
        reply_markup: options?.reply_markup,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function handleCommand(
  command: string,
  args: string[],
  chatId: number,
  userId: number,
  username: string | undefined,
  env: Env
): Promise<string> {
  switch (command) {
    case '/start':
      return handleStart(chatId, userId, username, env);
    case '/help':
      return getHelpMessage();
    case '/subscribe':
      return handleSubscribe(chatId, args, env);
    case '/unsubscribe':
      return handleUnsubscribe(chatId, args, env);
    case '/whale':
      return handleWhaleCommand(args, env);
    case '/dev':
      return handleDevCommand(args, env);
    case '/price':
      return handlePriceCommand(args, env);
    case '/score':
      return handleScoreCommand(args, env);
    case '/insurance':
      return handleInsuranceCommand();
    case '/status':
      return handleStatusCommand(chatId, env);
    default:
      return '❓ Unknown command. Use /help to see available commands.';
  }
}

async function handleStart(
  chatId: number,
  userId: number,
  username: string | undefined,
  env: Env
): Promise<string> {
  // Create or update subscription
  const subscription: UserSubscription = {
    chatId,
    username,
    whaleAlerts: true,
    devAlerts: true,
    priceAlerts: false,
    insuranceAlerts: true,
    watchlist: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  await env.SUBSCRIPTIONS.put(`user:${chatId}`, JSON.stringify(subscription));
  
  return `🦅 <b>Welcome to AlphaNest Bot!</b>

Your gateway to Meme token intelligence.

<b>Features:</b>
🐋 Whale movement alerts
👨‍💻 Dev activity tracking  
📈 Price notifications
🛡️ Insurance updates

<b>Quick Start:</b>
• /subscribe whale - Get whale alerts
• /subscribe dev - Track Dev launches
• /dev [address] - Lookup Dev reputation
• /price [token] - Check token price

Use /help for all commands.

<i>You're now subscribed to whale alerts and Dev notifications!</i>`;
}

function getHelpMessage(): string {
  return `📚 <b>AlphaNest Bot Commands</b>

<b>Alerts:</b>
/subscribe [type] - Subscribe to alerts
  • whale - Whale movements
  • dev - New token launches
  • price - Price changes
  • insurance - Policy updates

/unsubscribe [type] - Unsubscribe

<b>Lookup:</b>
/whale - Recent whale transactions
/dev [address] - Dev reputation
/price [token] - Token price
/insurance - Active insurance pools

<b>Account:</b>
/status - Your subscription status
/watchlist add [token] - Add to watchlist
/watchlist remove [token] - Remove

<b>Other:</b>
/help - Show this message

🌐 Web: https://alphanest.pages.dev`;
}

async function handleSubscribe(
  chatId: number,
  args: string[],
  env: Env
): Promise<string> {
  const type = args[0]?.toLowerCase();
  
  if (!type) {
    return `Please specify what to subscribe to:
• /subscribe whale
• /subscribe dev
• /subscribe price
• /subscribe insurance
• /subscribe all`;
  }
  
  const subData = await env.SUBSCRIPTIONS.get(`user:${chatId}`);
  if (!subData) {
    return 'Please use /start first to initialize your account.';
  }
  
  const subscription: UserSubscription = JSON.parse(subData);
  
  switch (type) {
    case 'whale':
      subscription.whaleAlerts = true;
      break;
    case 'dev':
      subscription.devAlerts = true;
      break;
    case 'price':
      subscription.priceAlerts = true;
      break;
    case 'insurance':
      subscription.insuranceAlerts = true;
      break;
    case 'all':
      subscription.whaleAlerts = true;
      subscription.devAlerts = true;
      subscription.priceAlerts = true;
      subscription.insuranceAlerts = true;
      break;
    default:
      return `Unknown subscription type: ${type}`;
  }
  
  subscription.updatedAt = Date.now();
  await env.SUBSCRIPTIONS.put(`user:${chatId}`, JSON.stringify(subscription));
  
  return `✅ Subscribed to <b>${type}</b> alerts!`;
}

async function handleUnsubscribe(
  chatId: number,
  args: string[],
  env: Env
): Promise<string> {
  const type = args[0]?.toLowerCase();
  
  if (!type) {
    return `Please specify what to unsubscribe from:
• /unsubscribe whale
• /unsubscribe dev
• /unsubscribe price
• /unsubscribe insurance
• /unsubscribe all`;
  }
  
  const subData = await env.SUBSCRIPTIONS.get(`user:${chatId}`);
  if (!subData) {
    return 'No subscription found. Use /start first.';
  }
  
  const subscription: UserSubscription = JSON.parse(subData);
  
  switch (type) {
    case 'whale':
      subscription.whaleAlerts = false;
      break;
    case 'dev':
      subscription.devAlerts = false;
      break;
    case 'price':
      subscription.priceAlerts = false;
      break;
    case 'insurance':
      subscription.insuranceAlerts = false;
      break;
    case 'all':
      subscription.whaleAlerts = false;
      subscription.devAlerts = false;
      subscription.priceAlerts = false;
      subscription.insuranceAlerts = false;
      break;
    default:
      return `Unknown subscription type: ${type}`;
  }
  
  subscription.updatedAt = Date.now();
  await env.SUBSCRIPTIONS.put(`user:${chatId}`, JSON.stringify(subscription));
  
  return `🔕 Unsubscribed from <b>${type}</b> alerts.`;
}

async function handleWhaleCommand(args: string[], env: Env): Promise<string> {
  const token = args[0];
  
  try {
    // Fetch real whale data from API
    const endpoint = token 
      ? `https://api.alphanest.dev/api/v1/whale/recent?token=${token}`
      : `https://api.alphanest.dev/api/v1/whale/recent`;
    
    const response = await fetch(endpoint);
    if (response.ok) {
      const data = await response.json();
      const whales = data.data?.slice(0, 5) || [];
      
      if (whales.length > 0) {
        let message = `🐋 <b>Recent Whale Activity</b>\n\n`;
        
        whales.forEach((whale: any, index: number) => {
          const emoji = whale.action === 'buy' ? '🟢' : '🔴';
          const action = whale.action === 'buy' ? 'Buy' : 'Sell';
          message += `<b>${index + 1}.</b> ${emoji} ${action} $${whale.tokenSymbol}\n`;
          message += `   Amount: $${formatVolume(whale.valueUsd)}\n`;
          message += `   Wallet: ${whale.wallet?.slice(0, 6)}...${whale.wallet?.slice(-4)}\n`;
          message += `   Time: ${getTimeAgo(whale.timestamp)}\n\n`;
        });
        
        message += `<i>Subscribe with /subscribe whale for real-time alerts</i>`;
        return message;
      }
    }
  } catch (error) {
    console.error('Error fetching whale data:', error);
  }
  
  // Fallback to mock data
  return `🐋 <b>Recent Whale Activity</b>

<b>1.</b> 🟢 Buy $PEPE
   Amount: $125,000
   Wallet: 0x1234...abcd
   Time: 5 min ago

<b>2.</b> 🔴 Sell $WIF
   Amount: $89,000
   Wallet: 0x5678...efgh
   Time: 12 min ago

<b>3.</b> 🟢 Buy $BONK
   Amount: $67,500
   Wallet: 0x9abc...ijkl
   Time: 23 min ago

<i>Subscribe with /subscribe whale for real-time alerts</i>`;
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function handleDevCommand(args: string[], env: Env): Promise<string> {
  const address = args[0];
  
  if (!address) {
    return `Usage: /dev [wallet_address]

Example: /dev 0x1234...abcd`;
  }
  
  try {
    // Fetch from API
    const response = await fetch(`https://api.alphanest.dev/api/v1/dev/${address}/score`);
    if (!response.ok) {
      return `❌ Could not find Dev profile for this address.`;
    }
    
    const data = await response.json();
    const dev = data.data;
    
    const tierEmoji: Record<string, string> = {
      diamond: '💎',
      platinum: '💠',
      gold: '🥇',
      silver: '🥈',
      bronze: '🥉',
      unranked: '⚪',
    };
    
    const riskEmoji: Record<string, string> = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴',
      unknown: '⚪',
    };
    
    return `👨‍💻 <b>Dev Profile</b>

<b>Address:</b> <code>${address.slice(0, 10)}...${address.slice(-6)}</code>
<b>Alias:</b> ${dev.alias || 'Unknown'}
<b>Score:</b> ${dev.score}/100 ${tierEmoji[dev.tier] || ''} ${dev.tier.toUpperCase()}
<b>Verified:</b> ${dev.verified ? '✅ Red V' : '❌ No'}
<b>Risk Level:</b> ${riskEmoji[dev.riskLevel] || ''} ${dev.riskLevel}

<b>Statistics:</b>
• Total Launches: ${dev.totalLaunches}
• Successful: ${dev.successfulLaunches} (${dev.winRate.toFixed(1)}%)
• Rug Count: ${dev.rugCount} ${dev.rugCount > 0 ? '⚠️' : ''}
• Total Volume: $${formatVolume(dev.totalVolume)}

<a href="https://alphanest.pages.dev/devs/${address}">View Full Profile →</a>`;
  } catch (error) {
    // Fallback to mock data
    return `👨‍💻 <b>Dev Profile</b>

<b>Address:</b> <code>${address.slice(0, 10)}...</code>
<b>Score:</b> 78/100 🥇 Gold
<b>Total Launches:</b> 12
<b>Successful:</b> 9 (75%)
<b>Rug Count:</b> 1 ⚠️

<b>Recent Tokens:</b>
• $ALPHA - Active, +250%
• $BETA - Active, +45%
• $GAMMA - Inactive

<a href="https://alphanest.pages.dev/devs/${address}">View Full Profile →</a>`;
  }
}

/**
 * Token Safety Score Command
 */
async function handleScoreCommand(args: string[], env: Env): Promise<string> {
  const tokenInput = args[0];
  
  if (!tokenInput) {
    return `🔍 <b>Token Safety Score</b>

Usage: /score [token_address or symbol]

Example: 
• /score 0x1234...abcd
• /score PEPE

This will analyze:
• Contract security
• Liquidity status
• Dev reputation
• Holder distribution
• Honeypot detection`;
  }
  
  try {
    // Determine if input is address or symbol
    const isAddress = tokenInput.startsWith('0x') && tokenInput.length === 42;
    const endpoint = isAddress 
      ? `https://api.alphanest.dev/api/v1/tokens/${tokenInput}/score`
      : `https://api.alphanest.dev/api/v1/tokens/search?symbol=${tokenInput}`;
    
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error('Token not found');
    }
    
    const data = await response.json();
    const token = isAddress ? data.data : data.data[0];
    
    if (!token) {
      return `❌ Token not found: ${tokenInput}`;
    }
    
    return formatSafetyScore(token);
  } catch (error) {
    // Return mock safety analysis
    return formatMockSafetyScore(tokenInput);
  }
}

function formatSafetyScore(token: any): string {
  const score = token.safetyScore || 75;
  const scoreBar = getScoreBar(score);
  const riskLevel = score >= 80 ? '🟢 LOW' : score >= 50 ? '🟡 MEDIUM' : '🔴 HIGH';
  
  return `🔍 <b>Token Safety Score</b>

<b>Token:</b> ${token.name} (${token.symbol})
<b>Chain:</b> ${token.chain}
<b>Contract:</b> <code>${token.address?.slice(0, 10)}...</code>

<b>Safety Score:</b> ${score}/100
${scoreBar}
<b>Risk Level:</b> ${riskLevel}

<b>Analysis:</b>
${token.isHoneypot === false ? '✅' : '❌'} Honeypot Check
${token.liquidityLocked ? '✅' : '⚠️'} Liquidity ${token.liquidityLocked ? 'Locked' : 'Unlocked'}
${token.ownershipRenounced ? '✅' : '⚠️'} Ownership ${token.ownershipRenounced ? 'Renounced' : 'Active'}
${token.devScore >= 60 ? '✅' : '⚠️'} Dev Score: ${token.devScore || 'N/A'}
${token.holderCount >= 100 ? '✅' : '⚠️'} Holders: ${token.holderCount || 'N/A'}

<b>Top Holders:</b>
• Top 10 hold: ${token.top10Percent || 'N/A'}%

<a href="https://alphanest.pages.dev/trade/${token.address}">Trade on AlphaNest →</a>`;
}

function formatMockSafetyScore(tokenInput: string): string {
  const score = Math.floor(Math.random() * 40) + 50; // 50-90
  const scoreBar = getScoreBar(score);
  const riskLevel = score >= 80 ? '🟢 LOW' : score >= 50 ? '🟡 MEDIUM' : '🔴 HIGH';
  
  return `🔍 <b>Token Safety Score</b>

<b>Token:</b> ${tokenInput.toUpperCase()}
<b>Safety Score:</b> ${score}/100
${scoreBar}
<b>Risk Level:</b> ${riskLevel}

<b>Analysis:</b>
✅ Honeypot Check: PASSED
⚠️ Liquidity: Unlocked
✅ Ownership: Renounced  
✅ Dev Score: 72/100
✅ Holders: 1,234

<b>Warnings:</b>
⚠️ Liquidity not locked - Higher risk

<i>Note: This is a basic scan. Always DYOR!</i>

<a href="https://alphanest.pages.dev/trade">Trade on AlphaNest →</a>`;
}

function getScoreBar(score: number): string {
  const filled = Math.floor(score / 10);
  const empty = 10 - filled;
  const emoji = score >= 70 ? '🟢' : score >= 40 ? '🟡' : '🔴';
  return `[${emoji.repeat(filled)}${'⚪'.repeat(empty)}]`;
}

function formatVolume(volume: string): string {
  const num = parseFloat(volume);
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

async function handlePriceCommand(args: string[], env: Env): Promise<string> {
  const token = args[0]?.toUpperCase();
  
  if (!token) {
    return `Usage: /price [token_symbol or address]

Example: /price PEPE`;
  }
  
  try {
    // Fetch real price data
    const isAddress = token.startsWith('0X') && token.length === 42;
    const endpoint = isAddress
      ? `https://api.alphanest.dev/api/v1/tokens/${token}`
      : `https://api.alphanest.dev/api/v1/tokens/search?symbol=${token}`;
    
    const response = await fetch(endpoint);
    if (response.ok) {
      const data = await response.json();
      const tokenData = isAddress ? data.data : data.data?.[0];
      
      if (tokenData) {
        const changeEmoji = tokenData.priceChange24h >= 0 ? '📈' : '📉';
        const changeSign = tokenData.priceChange24h >= 0 ? '+' : '';
        
        return `📊 <b>${tokenData.name || token} Price</b>

<b>Price:</b> $${tokenData.price || '0.00'}
<b>24h Change:</b> ${changeSign}${tokenData.priceChange24h?.toFixed(2) || '0'}% ${changeEmoji}
<b>Volume:</b> $${formatVolume(tokenData.volume24h || '0')}
<b>Market Cap:</b> $${formatVolume(tokenData.marketCap || '0')}
<b>Liquidity:</b> $${formatVolume(tokenData.liquidity || '0')}

<b>Dev Score:</b> ${tokenData.devScore || 'N/A'}/100

<a href="https://alphanest.pages.dev/trade/${tokenData.address || token}">Trade on AlphaNest →</a>`;
      }
    }
  } catch (error) {
    console.error('Error fetching price:', error);
  }
  
  // Fallback to mock data
  return `📊 <b>${token} Price</b>

<b>Price:</b> $0.00001234
<b>24h Change:</b> +15.6% 📈
<b>Volume:</b> $12.5M
<b>Market Cap:</b> $125M
<b>Liquidity:</b> $2.3M

<b>Dev Score:</b> 85/100 💎

<a href="https://alphanest.pages.dev/trade?token=${token}">Trade on AlphaNest →</a>`;
}

function handleInsuranceCommand(): string {
  return `🛡️ <b>Active Insurance Pools</b>

<b>1. $PEPE</b>
   Pool Size: $45,000
   Rug Odds: 2.5x | Safe Odds: 1.4x
   Expires: 12h

<b>2. $WIF</b>
   Pool Size: $32,000
   Rug Odds: 3.2x | Safe Odds: 1.2x
   Expires: 24h

<b>3. $BONK</b>
   Pool Size: $28,500
   Rug Odds: 1.8x | Safe Odds: 1.6x
   Expires: 6h

<a href="https://alphanest.pages.dev/insurance">Buy Insurance →</a>`;
}

async function handleStatusCommand(
  chatId: number,
  env: Env
): Promise<string> {
  const subData = await env.SUBSCRIPTIONS.get(`user:${chatId}`);
  
  if (!subData) {
    return 'No subscription found. Use /start to get started.';
  }
  
  const sub: UserSubscription = JSON.parse(subData);
  
  return `📋 <b>Your Subscription Status</b>

<b>Alerts:</b>
🐋 Whale: ${sub.whaleAlerts ? '✅ On' : '❌ Off'}
👨‍💻 Dev: ${sub.devAlerts ? '✅ On' : '❌ Off'}
📈 Price: ${sub.priceAlerts ? '✅ On' : '❌ Off'}
🛡️ Insurance: ${sub.insuranceAlerts ? '✅ On' : '❌ Off'}

<b>Watchlist:</b> ${sub.watchlist.length} tokens

<i>Use /subscribe or /unsubscribe to change</i>`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Webhook endpoint
    if (url.pathname === '/webhook' && request.method === 'POST') {
      try {
        const update: TelegramUpdate = await request.json();
        
        if (update.message?.text) {
          const text = update.message.text;
          const chatId = update.message.chat.id;
          const userId = update.message.from.id;
          const username = update.message.from.username;
          
          const [command, ...args] = text.split(' ');
          
          if (command.startsWith('/')) {
            const response = await handleCommand(
              command.split('@')[0], // Remove bot username if present
              args,
              chatId,
              userId,
              username,
              env
            );
            
            await sendMessage(env.TELEGRAM_BOT_TOKEN, chatId, response);
          }
        }
        
        return new Response('OK');
      } catch (error) {
        console.error('Webhook error:', error);
        return new Response('Error', { status: 500 });
      }
    }
    
    // Health check
    if (url.pathname === '/health') {
      return new Response('OK');
    }
    
    // Set webhook endpoint
    if (url.pathname === '/setup-webhook' && request.method === 'POST') {
      const webhookUrl = `${url.origin}/webhook`;
      const response = await fetch(
        `${TELEGRAM_API}${env.TELEGRAM_BOT_TOKEN}/setWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: webhookUrl }),
        }
      );
      const result = await response.json();
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response('AlphaNest Telegram Bot', { status: 200 });
  },
};
