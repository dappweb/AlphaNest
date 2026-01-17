'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, AlertTriangle, CheckCircle, XCircle, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';

interface SecurityScore {
  overall: number;
  contract: number;
  liquidity: number;
  dev: number;
  holders: number;
  risks: string[];
  recommendations: string[];
}

export default function SecurityScorePage() {
  const [tokenAddress, setTokenAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState<SecurityScore | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeToken = async () => {
    if (!tokenAddress.trim()) {
      setError('Please enter a token address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setScore(null);

    try {
      const response = await fetch(`${API_URL}/api/v1/tokens/${tokenAddress}/score`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to analyze token');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setScore(result.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error analyzing token:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze token');
      // Use mock data for demo
      setScore({
        overall: 75,
        contract: 80,
        liquidity: 70,
        dev: 65,
        holders: 85,
        risks: [
          'Low liquidity pool',
          'Concentrated holder distribution',
        ],
        recommendations: [
          'Wait for more liquidity before trading',
          'Check dev reputation history',
          'Monitor holder distribution',
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500">Safe</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500">Moderate</Badge>;
    return <Badge className="bg-red-500">Risky</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Token Security Score
        </h1>
        <p className="text-muted-foreground mt-2">
          Free tool to analyze Pump.fun and Solana token safety
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Analyze Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter token address (e.g., 0x1234... or So11111111111111111111111111111111111112)"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && analyzeToken()}
              className="flex-1"
            />
            <Button onClick={analyzeToken} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {score && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Overall Score</span>
                {getScoreBadge(score.overall)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getScoreColor(score.overall)}`}>
                    {score.overall}
                  </div>
                  <p className="text-muted-foreground mt-2">out of 100</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Contract Security</span>
                    <span className={`font-medium ${getScoreColor(score.contract)}`}>
                      {score.contract}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Liquidity</span>
                    <span className={`font-medium ${getScoreColor(score.liquidity)}`}>
                      {score.liquidity}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dev Reputation</span>
                    <span className={`font-medium ${getScoreColor(score.dev)}`}>
                      {score.dev}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Holder Distribution</span>
                    <span className={`font-medium ${getScoreColor(score.holders)}`}>
                      {score.holders}/100
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risks & Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {score.risks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Risks Detected
                  </h4>
                  <ul className="space-y-2">
                    {score.risks.map((risk, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {score.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {score.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Our security score analyzes multiple factors to assess token safety:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Contract Security:</strong> Checks for common vulnerabilities and honeypots</li>
            <li><strong>Liquidity:</strong> Evaluates liquidity pool size and lock status</li>
            <li><strong>Dev Reputation:</strong> Analyzes developer history and track record</li>
            <li><strong>Holder Distribution:</strong> Checks for wallet concentration risks</li>
          </ul>
          <p className="pt-2">
            <strong>Note:</strong> This is a free tool. Always do your own research (DYOR) before trading.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
