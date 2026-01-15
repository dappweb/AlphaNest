'use client';

import { useState } from 'react';
import { useKOLData, useKOLWallet } from '@/hooks/use-helius';
import { formatPrice, formatMarketCap } from '@/lib/helius/price';
import { KOLWallet, KOLTrade, KOLHolding } from '@/lib/helius/kol-tracker';
import { Loading } from '@/components/ui/loading';

// 格式化时间
function formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp * 1000;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
}

// 缩短地址
function shortenAddress(address: string, chars = 4): string {
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// ============================================
// KOL 钱包卡片
// ============================================

function KOLWalletCard({
    wallet,
    onClick,
    isSelected,
}: {
    wallet: KOLWallet;
    onClick: () => void;
    isSelected: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`
        w-full p-4 rounded-xl text-left transition-all duration-200
        ${isSelected
                    ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50'
                    : 'bg-zinc-800/50 hover:bg-zinc-700/50 border border-transparent'
                }
      `}
        >
            <div className="flex items-center justify-between">
                <div>
                    <div className="font-medium text-white">{wallet.label}</div>
                    <div className="text-xs text-zinc-500 mt-1">
                        {shortenAddress(wallet.address, 6)}
                    </div>
                </div>
                <div className="flex gap-1">
                    {wallet.tags.slice(0, 2).map((tag) => (
                        <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </button>
    );
}

// ============================================
// 实时交易 Feed
// ============================================

function TradeFeed({
    trades,
}: {
    trades: Array<{ wallet: KOLWallet; trade: KOLTrade }>;
}) {
    if (trades.length === 0) {
        return (
            <div className="text-center py-8 text-zinc-500">
                No recent trades found
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {trades.map((item, index) => (
                <div
                    key={`${item.trade.signature}-${index}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-700/30 transition-colors"
                >
                    <div
                        className={`
              w-8 h-8 rounded-full flex items-center justify-center text-lg
              ${item.trade.type === 'buy' ? 'bg-green-500/20' : ''}
              ${item.trade.type === 'sell' ? 'bg-red-500/20' : ''}
              ${item.trade.type === 'swap' ? 'bg-blue-500/20' : ''}
              ${!['buy', 'sell', 'swap'].includes(item.trade.type) ? 'bg-zinc-700' : ''}
            `}
                    >
                        {item.trade.type === 'buy' && '🟢'}
                        {item.trade.type === 'sell' && '🔴'}
                        {item.trade.type === 'swap' && '🔄'}
                        {!['buy', 'sell', 'swap'].includes(item.trade.type) && '📤'}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-white truncate">
                                {item.wallet.label}
                            </span>
                            <span className="text-zinc-400 text-sm">
                                {item.trade.type === 'buy' ? 'bought' :
                                    item.trade.type === 'sell' ? 'sold' :
                                        item.trade.type}
                            </span>
                        </div>
                        <div className="text-xs text-zinc-500 truncate">
                            {item.trade.description || shortenAddress(item.trade.tokenMint)}
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-sm font-medium text-white">
                            {item.trade.tokenAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-zinc-500">
                            {formatTimeAgo(item.trade.timestamp)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================
// 持仓列表
// ============================================

function HoldingsList({ holdings }: { holdings: KOLHolding[] }) {
    if (holdings.length === 0) {
        return (
            <div className="text-center py-8 text-zinc-500">
                No holdings found
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {holdings.slice(0, 20).map((holding) => (
                <div
                    key={holding.mint}
                    className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/30"
                >
                    {holding.logo ? (
                        <img
                            src={holding.logo}
                            alt={holding.symbol}
                            className="w-8 h-8 rounded-full"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                            {holding.symbol.charAt(0)}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="font-medium text-white">{holding.symbol}</div>
                        <div className="text-xs text-zinc-500 truncate">{holding.name}</div>
                    </div>

                    <div className="text-right">
                        <div className="text-sm font-medium text-white">
                            {holding.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-zinc-500">
                            {holding.valueUsd ? formatPrice(holding.valueUsd) : '-'}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================
// 热门代币面板
// ============================================

function CommonHoldingsPanel({
    holdings,
}: {
    holdings: Array<{
        mint: string;
        symbol: string;
        holdersCount: number;
        holders: string[];
    }>;
}) {
    if (holdings.length === 0) {
        return (
            <div className="text-center py-8 text-zinc-500">
                No common holdings found
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {holdings.slice(0, 10).map((holding) => (
                <div
                    key={holding.mint}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                            {holding.symbol.charAt(0)}
                        </div>
                        <div>
                            <div className="font-medium text-white">{holding.symbol}</div>
                            <div className="text-xs text-zinc-500">
                                {shortenAddress(holding.mint)}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-orange-400 font-medium">
                            🔥 {holding.holdersCount} KOLs
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================
// 主组件
// ============================================

export function KOLTrackerDashboard() {
    const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
    const { wallets, recentTrades, commonHoldings, loading, error, refetch } = useKOLData();
    const selectedKOL = useKOLWallet(selectedWallet);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        🧠 Smart Money Tracker
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">
                        Track KOL wallets and their trading activities
                    </p>
                </div>

                <button
                    onClick={refetch}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {loading ? 'Refreshing...' : 'Refresh Data'}
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                    {error}
                </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: KOL List */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">📋 Tracked Wallets</h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {wallets.map((wallet) => (
                            <KOLWalletCard
                                key={wallet.address}
                                wallet={wallet}
                                onClick={() => setSelectedWallet(wallet.address)}
                                isSelected={selectedWallet === wallet.address}
                            />
                        ))}
                    </div>
                </div>

                {/* Middle: Live Feed or Selected KOL Details */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedWallet ? (
                        <>
                            {/* Selected KOL Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">
                                        {selectedKOL.wallet?.label || 'Wallet Details'}
                                    </h3>
                                    <p className="text-sm text-zinc-500">
                                        {shortenAddress(selectedWallet, 8)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedWallet(null)}
                                    className="text-zinc-400 hover:text-white"
                                >
                                    ✕ Close
                                </button>
                            </div>

                            {/* Stats */}
                            {selectedKOL.stats && (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-xl bg-zinc-800/50">
                                        <div className="text-zinc-500 text-sm">Total Value</div>
                                        <div className="text-xl font-bold text-white">
                                            {formatMarketCap(selectedKOL.stats.totalValue)}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-zinc-800/50">
                                        <div className="text-zinc-500 text-sm">Total Trades</div>
                                        <div className="text-xl font-bold text-white">
                                            {selectedKOL.stats.totalTrades}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-zinc-800/50">
                                        <div className="text-zinc-500 text-sm">Buys</div>
                                        <div className="text-xl font-bold text-green-400">
                                            {selectedKOL.stats.buyTrades}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-zinc-800/50">
                                        <div className="text-zinc-500 text-sm">Sells</div>
                                        <div className="text-xl font-bold text-red-400">
                                            {selectedKOL.stats.sellTrades}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Holdings */}
                            <div>
                                <h4 className="text-md font-semibold text-white mb-3">💰 Holdings</h4>
                                {selectedKOL.loading ? (
                                    <Loading className="py-8" />
                                ) : (
                                    <HoldingsList holdings={selectedKOL.holdings} />
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Live Trade Feed */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">
                                    ⚡ Live Trades
                                </h3>
                                {loading ? (
                                    <Loading className="py-8" />
                                ) : (
                                    <TradeFeed trades={recentTrades} />
                                )}
                            </div>

                            {/* Common Holdings */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">
                                    🔥 Hot Tokens Among KOLs
                                </h3>
                                <CommonHoldingsPanel holdings={commonHoldings} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
