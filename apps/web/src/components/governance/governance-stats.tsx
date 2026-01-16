'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, FileText, CheckCircle } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  totalVoters: number;
  totalVotes: number;
}

export function GovernanceStats() {
  const [stats, setStats] = useState<GovernanceStats>({
    totalProposals: 0,
    activeProposals: 0,
    totalVoters: 0,
    totalVotes: 0,
  });

  useEffect(() => {
    // TODO: Fetch from governance contract
    // For now, use mock data
    setStats({
      totalProposals: 24,
      activeProposals: 3,
      totalVoters: 1247,
      totalVotes: 12500000,
    });
  }, []);

  const statsData = [
    {
      name: 'Total Proposals',
      value: stats.totalProposals,
      icon: FileText,
      format: 'number',
    },
    {
      name: 'Active Proposals',
      value: stats.activeProposals,
      icon: TrendingUp,
      format: 'number',
    },
    {
      name: 'Total Voters',
      value: stats.totalVoters,
      icon: Users,
      format: 'number',
    },
    {
      name: 'Total Votes',
      value: stats.totalVotes,
      icon: CheckCircle,
      format: 'number',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, index) => (
        <Card key={index} className="hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                <p className="text-2xl font-bold">{formatNumber(stat.value)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
