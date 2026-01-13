'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Bot as BotIcon, Plus, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BotCard, Bot, CreateBotModal, BotConfig, BotsOverview } from '@/components/bots';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { getAuthHeaders } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';
const mockBots: Bot[] = [
  {
    id: '1',
    name: 'PEPE Sniper',
    type: 'sniper',
    status: 'running',
    pnl: 2450,
    pnlPercent: 24.5,
    trades: 47,
    winRate: 72,
    investment: 10000,
    currentValue: 12450,
    chain: 'Base',
    config: {},
  },
  {
    id: '2',
    name: 'ETH DCA Bot',
    type: 'dca',
    status: 'running',
    pnl: 890,
    pnlPercent: 8.9,
    trades: 12,
    winRate: 100,
    investment: 10000,
    currentValue: 10890,
    chain: 'Ethereum',
    config: { interval: '1d' },
  },
  {
    id: '3',
    name: 'SOL Grid Trader',
    type: 'grid',
    status: 'paused',
    pnl: -150,
    pnlPercent: -3.0,
    trades: 89,
    winRate: 48,
    investment: 5000,
    currentValue: 4850,
    chain: 'Solana',
    config: { gridLevels: 15 },
  },
  {
    id: '4',
    name: 'Whale Copy Bot',
    type: 'copy',
    status: 'running',
    pnl: 1250,
    pnlPercent: 12.5,
    trades: 23,
    winRate: 65,
    investment: 10000,
    currentValue: 11250,
    chain: 'Base',
    config: { traderAddress: '0x1234...5678' },
  },
];

export default function BotsPage() {
  const { isConnected, address } = useAccount();
  const [bots, setBots] = useState<Bot[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch bots from API
  useEffect(() => {
    if (!isConnected || !address) {
      setBots([]);
      return;
    }

    const fetchBots = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/api/v1/bots`, {
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setBots(result.data);
          } else {
            setBots([]);
          }
        } else {
          throw new Error('Failed to fetch bots');
        }
      } catch (err) {
        console.error('Error fetching bots:', err);
        setError('Failed to load bots');
        setBots([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBots();
  }, [isConnected, address]);

  const handleToggleBot = async (bot: Bot) => {
    const newStatus = bot.status === 'running' ? 'paused' : 'running';
    
    // Optimistic update
    setBots(prev => prev.map(b => 
      b.id === bot.id ? { ...b, status: newStatus } : b
    ));

    // Update on server
    try {
      const response = await fetch(`${API_URL}/api/v1/bots/${bot.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        // Revert on error
        setBots(prev => prev.map(b => 
          b.id === bot.id ? { ...b, status: bot.status } : b
        ));
        throw new Error('Failed to update bot');
      }
    } catch (err) {
      console.error('Error updating bot:', err);
      alert('Failed to update bot status');
    }
  };

  const handleConfigureBot = (bot: Bot) => {
    // TODO: Open configuration modal
    console.log('Configure bot:', bot);
  };

  const handleCreateBot = async (config: BotConfig) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/bots`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: config.name,
          type: config.type,
          investment: config.investment,
          chain: config.chain,
          config: {
            targetToken: config.targetToken,
            interval: config.interval,
            gridLevels: config.gridLevels,
            traderAddress: config.traderAddress,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setBots((prev) => [...prev, result.data]);
          setIsCreateModalOpen(false);
        } else {
          throw new Error('Failed to create bot');
        }
      } else {
        throw new Error('Failed to create bot');
      }
    } catch (err) {
      console.error('Error creating bot:', err);
      alert('Failed to create bot. Please try again.');
    }
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BotIcon className="h-8 w-8 text-primary" />
            Trading Bots
          </h1>
          <p className="mt-2 text-muted-foreground">
            Automated trading strategies to maximize your returns
          </p>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
            <p className="text-muted-foreground mt-2 mb-4">
              Connect a wallet to create and manage trading bots
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BotIcon className="h-8 w-8 text-primary" />
            Trading Bots
          </h1>
          <p className="mt-2 text-muted-foreground">
            Automated trading strategies to maximize your returns
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Bot
        </Button>
      </div>

      {/* Overview Stats */}
      <BotsOverview bots={bots} />

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-12">
            <Loading text="Loading bots..." />
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Bots Grid */}
      {!isLoading && !error && bots.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={<BotIcon className="h-16 w-16 text-muted-foreground" />}
              title="No Bots Yet"
              description="Create your first trading bot to start automating your trades"
              action={{
                label: 'Create Your First Bot',
                onClick: () => setIsCreateModalOpen(true),
              }}
            />
          </CardContent>
        </Card>
      ) : !isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bots.map((bot) => (
            <BotCard
              key={bot.id}
              bot={bot}
              onToggle={handleToggleBot}
              onConfigure={handleConfigureBot}
            />
          ))}
        </div>
      )}

      {/* Create Bot Modal */}
      <CreateBotModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateBot}
      />
    </div>
  );
}
