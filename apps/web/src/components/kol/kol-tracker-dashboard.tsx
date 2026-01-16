'use client';

import { useState, useCallback } from 'react';
import { useKOLData, useKOLWallet } from '@/hooks/use-helius';
import { formatPrice, formatMarketCap } from '@/lib/helius/price';
import { KOLWallet, KOLTrade, KOLHolding } from '@/lib/helius/kol-tracker';
import { Loading } from '@/components/ui/loading';
import { Skeleton } from '@/components/ui/skeleton';
import { copyToClipboard } from '@/lib/utils';
import { Copy, ExternalLink, Check, RefreshCw } from 'lucide-react';

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
    if (!address) return '';
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// 复制按钮组件
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const success = await copyToClipboard(text);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="p-1 rounded-md hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Copy Address"
        >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
    );
}

// Solscan 链接组件
function SolscanLink({ type, id }: { type: 'address' | 'tx'; id: string }) {
    const url = `https://solscan.io/${type === 'address' ? 'account' : 'tx'}/${id}`;
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-md hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="View on Solscan"
        >
            <ExternalLink size={14} />
        </a>
    );
}

// 骨架屏组件
function TradeSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/20">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <div className="text-right space-y-2">
                        <Skeleton className="h-4 w-12 ml-auto" />
                        <Skeleton className="h-3 w-8 ml-auto" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function HoldingSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/20">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <div className="text-right space-y-2">
                        <Skeleton className="h-4 w-16 ml-auto" />
                        <Skeleton className="h-3 w-12 ml-auto" />
                    </div>
                </div>
            ))}
        </div>
    );
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
        <div
            onClick={onClick}
            className={`
        w-full p-4 rounded-xl text-left transition-all duration-200 cursor-pointer relative group
        ${isSelected
                    ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50'
                    : 'bg-zinc-800/50 hover:bg-zinc-700/50 border border-transparent'
                }
      `}
        >
            <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                    <div className="font-medium text-white truncate">{wallet.label}</div>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-zinc-500">
                            {shortenAddress(wallet.address, 6)}
                        </span>
                        <CopyButton text={wallet.address} />
                        <SolscanLink type="address" id={wallet.address} />
                    </div>
                </div>
                <div className="flex flex-wrap justify-end gap-1 ml-2">
                    {wallet.tags.slice(0, 2).map((tag) => (
                        <span
                            key={tag}
                            className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-400"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
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
            <div className="text-center py-12 rounded-xl border border-dashed border-zinc-800 text-zinc-500">
                No recent trades found
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {trades.map((item, index) => (
                <div
                    key={`${item.trade.signature}-${index}`}
                    className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/20 hover:bg-zinc-800/40 transition-colors border border-transparent hover:border-zinc-700/50 group"
                >
                    <div
                        className={`
              mt-1 w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0
              ${item.trade.type === 'buy' ? 'bg-green-500/10' : ''}
              ${item.trade.type === 'sell' ? 'bg-red-500/10' : ''}
              ${item.trade.type === 'swap' ? 'bg-blue-500/10' : ''}
              ${!['buy', 'sell', 'swap'].includes(item.trade.type) ? 'bg-zinc-800' : ''}
            `}
                    >
                        {item.trade.type === 'buy' && '🟢'}
                        {item.trade.type === 'sell' && '🔴'}
                        {item.trade.type === 'swap' && '🔄'}
                        {!['buy', 'sell', 'swap'].includes(item.trade.type) && '📤'}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className="font-semibold text-white truncate">
                                    {item.wallet.label}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${item.trade.type === 'buy' ? 'bg-green-500/20 text-green-400' :
                                    item.trade.type === 'sell' ? 'bg-red-500/20 text-red-400' :
                                        'bg-zinc-700 text-zinc-400'
                                    }`}>
                                    {item.trade.type}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] text-zinc-500">
                                    {formatTimeAgo(item.trade.timestamp)}
                                </span>
                                <SolscanLink type="tx" id={item.trade.signature} />
                            </div>
                        </div>
                        <div className="text-sm text-zinc-300 mt-1 leading-relaxed">
                            {item.trade.description}
                        </div>
                        {item.trade.tokenMint && (
                            <div className="flex items-center gap-1.5 mt-2">
                                <span className="text-[10px] text-zinc-500 font-mono">
                                    Mint: {shortenAddress(item.trade.tokenMint, 4)}
                                </span>
                                <CopyButton text={item.trade.tokenMint} />
                                <SolscanLink type="address" id={item.trade.tokenMint} />
                            </div>
                        )}
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
            <div className="text-center py-12 rounded-xl border border-dashed border-zinc-800 text-zinc-500">
                No holdings found
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
            {holdings.slice(0, 20).map((holding) => (
                <div
                    key={holding.mint}
                    className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/20 hover:bg-zinc-800/40 transition-colors border border-transparent hover:border-zinc-700/50"
                >
                    {holding.logo ? (
                        <img
                            src={holding.logo}
                            alt={holding.symbol}
                            className="w-10 h-10 rounded-full shrink-0"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${holding.symbol}&background=random`;
                            }}
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {holding.symbol.charAt(0)}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="font-semibold text-white truncate">{holding.symbol}</div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton text={holding.mint} />
                                <SolscanLink type="address" id={holding.mint} />
                            </div>
                        </div>
                        <div className="text-xs text-zinc-500 truncate">{holding.name}</div>
                    </div>

                    <div className="text-right">
                        <div className="text-sm font-bold text-white">
                            {holding.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        </div>
                        <div className="text-xs text-zinc-400 font-medium">
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
            <div className="text-center py-12 rounded-xl border border-dashed border-zinc-800 text-zinc-500">
                No common holdings found
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {holdings.slice(0, 10).map((holding) => (
                <div
                    key={holding.mint}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/20 hover:bg-zinc-800/40 transition-colors border border-transparent hover:border-zinc-700/50"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                            {holding.symbol.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="font-semibold text-white">{holding.symbol}</div>
                                <div className="flex items-center gap-0.5">
                                    <CopyButton text={holding.mint} />
                                    <SolscanLink type="address" id={holding.mint} />
                                </div>
                            </div>
                            <div className="text-xs text-zinc-500 font-mono">
                                {shortenAddress(holding.mint, 4)}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                            <span className="text-xs text-orange-400 font-bold uppercase tracking-wider">
                                🔥 {holding.holdersCount} KOLs
                            </span>
                        </div>
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

    const handleRefresh = useCallback(async () => {
        await refetch();
    }, [refetch]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-800">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent flex items-center gap-3">
                        <span className="text-4xl">🧠</span> Smart Money Tracker
                    </h2>
                    <p className="text-zinc-400 text-sm mt-2 flex items-center gap-2">
                        Real-time tracking of elite KOL wallets and institutional activity
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Live
                        </span>
                    </p>
                </div>

                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-all disabled:opacity-50 group"
                >
                    <RefreshCw size={18} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    {loading ? 'Analyzing...' : 'Refresh Feed'}
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
                    <span className="text-xl">⚠️</span> {error}
                </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: KOL List (Sticky on desktop) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            📋 Tracked Targets
                        </h3>
                        <span className="text-xs text-zinc-500 font-mono">{wallets.length} active</span>
                    </div>

                    <div className="space-y-3 lg:max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                        {loading && wallets.length === 0 ? (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="p-4 rounded-xl bg-zinc-800/10 border border-zinc-800/50 space-y-3">
                                    <Skeleton className="h-5 w-1/2" />
                                    <Skeleton className="h-3 w-3/4" />
                                </div>
                            ))
                        ) : (
                            wallets.map((wallet) => (
                                <KOLWalletCard
                                    key={wallet.address}
                                    wallet={wallet}
                                    onClick={() => setSelectedWallet(wallet.address)}
                                    isSelected={selectedWallet === wallet.address}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Middle/Right: Live Feed or Selected KOL Details */}
                <div className="lg:col-span-8 space-y-8">
                    {selectedWallet ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Selected KOL Header */}
                            <div className="flex items-center justify-between mb-8 bg-zinc-800/20 p-6 rounded-2xl border border-zinc-700/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-3xl shadow-lg">
                                        {selectedKOL.wallet?.label?.charAt(0) || '👤'}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">
                                            {selectedKOL.wallet?.label || 'Wallet Details'}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="text-sm text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded">
                                                {selectedWallet}
                                            </code>
                                            <CopyButton text={selectedWallet} />
                                            <SolscanLink type="address" id={selectedWallet} />
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedWallet(null)}
                                    className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all shadow-md"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {[
                                    { label: 'Total Value', value: selectedKOL.stats ? formatMarketCap(selectedKOL.stats.totalValue) : '-', color: 'text-white' },
                                    { label: 'Activity (100tx)', value: selectedKOL.stats?.totalTrades || 0, color: 'text-zinc-300' },
                                    { label: 'Buys', value: selectedKOL.stats?.buyTrades || 0, color: 'text-green-400' },
                                    { label: 'Sells', value: selectedKOL.stats?.sellTrades || 0, color: 'text-red-400' },
                                ].map((stat, i) => (
                                    <div key={i} className="p-5 rounded-2xl bg-zinc-800/30 border border-zinc-700/20 group hover:border-zinc-600/50 transition-all">
                                        <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{stat.label}</div>
                                        <div className={`text-2xl font-bold mt-1 ${stat.color}`}>
                                            {selectedKOL.loading ? <Skeleton className="h-8 w-16 mt-1" /> : stat.value}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Holdings */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-xl font-bold text-white flex items-center gap-2">
                                        💰 Portfolio Composition
                                    </h4>
                                    <span className="text-xs text-zinc-500">Only showing top 20 assets</span>
                                </div>
                                {selectedKOL.loading ? (
                                    <HoldingSkeleton />
                                ) : (
                                    <HoldingsList holdings={selectedKOL.holdings} />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-10 animate-in fade-in duration-700">
                            {/* Live Trade Feed */}
                            <div className="bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800/50">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    ⚡ Real-time Activity Feed
                                </h3>
                                {loading ? (
                                    <TradeSkeleton />
                                ) : (
                                    <TradeFeed trades={recentTrades} />
                                )}
                            </div>

                            {/* Common Holdings */}
                            <div className="bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800/50">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    🔥 High-Conviction Tokens
                                    <span className="text-xs font-normal text-zinc-500 ml-2">Common holdings among multiple KOLs</span>
                                </h3>
                                {loading ? (
                                    <HoldingSkeleton />
                                ) : (
                                    <CommonHoldingsPanel holdings={commonHoldings} />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
