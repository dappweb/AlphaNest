'use client';

import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, XCircle, Loader2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatUSD } from '@/lib/utils';
import { 
  useSolanaPolicies, 
  useSolanaProductInfo, 
  useSolanaCancelPolicy,
  useSolanaSubmitClaim,
  useSolanaInsurance,
  InsuranceType,
  INSURANCE_TYPE_ICONS,
  PolicyStatus,
  POLICY_STATUS_LABELS,
} from '@/hooks/use-solana-insurance';

interface PolicyDisplayData {
  policyId: number;
  productId: number;
  productType: InsuranceType;
  coverageAmount: string;
  premiumPaid: string;
  startTime: Date;
  endTime: Date;
  status: PolicyStatus;
  isExpired: boolean;
}

function getStatusBadge(status: PolicyStatus, isExpired: boolean) {
  if (isExpired && status === PolicyStatus.Active) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" /> Expired
      </Badge>
    );
  }

  switch (status) {
    case PolicyStatus.Active:
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
          <Clock className="h-3 w-3 mr-1" /> Active
        </Badge>
      );
    case PolicyStatus.Claimed:
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
          <CheckCircle className="h-3 w-3 mr-1" /> Claimed
        </Badge>
      );
    case PolicyStatus.Cancelled:
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
          <XCircle className="h-3 w-3 mr-1" /> Cancelled
        </Badge>
      );
    case PolicyStatus.Expired:
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" /> Expired
        </Badge>
      );
    default:
      return <Badge variant="outline">{POLICY_STATUS_LABELS[status]}</Badge>;
  }
}

function PolicyCard({ policyId, policy }: { policyId: number; policy: any }) {
  // 使用 Solana hooks
  const { cancel, submitClaim: submitClaimAction } = useSolanaInsurance();
  
  // 从 policy 对象获取信息（简化版）
  const policyInfo = policy ? {
    status: policy.status === 0 ? PolicyStatus.Active : PolicyStatus.Expired,
    isExpired: policy.isExpired,
    coverageFormatted: (policy.coverageAmount / 1e6).toFixed(2),
    premiumFormatted: (policy.premiumPaid / 1e6).toFixed(2),
    endTime: policy.endTime.toString(),
    productId: policy.product,
  } : null;
  
  const productInfo = policy ? {
    productType: InsuranceType.RugPull, // 简化，实际需要从链上获取
  } : null;
  
  const [showClaimModal, setShowClaimModal] = useState(false);
  
  const isLoading = false; // 简化（实际应该从链上加载）
  const isCancelling = cancel.isPending;
  const cancelSuccess = cancel.isSuccess;
  const isSubmitting = submitClaimAction.isPending;
  const claimSuccess = submitClaimAction.isSuccess;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 border rounded-lg">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!policyInfo) {
    return null;
  }

  const canCancel = policyInfo.status === PolicyStatus.Active && !policyInfo.isExpired;
  const canClaim = policyInfo.status === PolicyStatus.Active && !policyInfo.isExpired;

  const handleCancel = async () => {
    try {
      // cancelPolicy 只需要 policyPubkey (policyId)
      const policyPubkey = policy.policyId?.toString() || policyId.toString();
      await cancel.cancelPolicy(policyPubkey);
    } catch (error) {
      console.error('Cancel failed:', error);
    }
  };

  const handleSubmitClaim = async () => {
    try {
      // 简化示例 - 实际需要收集理赔信息
      const policyPubkey = policy.policyId?.toString() || policyId.toString();
      const evidenceHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
      await submitClaimAction.submitClaim(
        policyPubkey,
        0, // ClaimType.RugPull
        policy.coverageAmount || 0, // claimAmount
        evidenceHash
      );
    } catch (error) {
      console.error('Claim failed:', error);
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-3 sm:p-4 gap-3 ${
        cancelSuccess || claimSuccess ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg">
          {productInfo ? INSURANCE_TYPE_ICONS[productInfo.productType] : '🛡️'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm sm:text-base">Policy #{policyId}</span>
            {getStatusBadge(policyInfo.status, policyInfo.isExpired)}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Expires {new Date(Number(policyInfo.endTime) * 1000).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
        <div className="text-left sm:text-right">
          <p className="text-xs text-muted-foreground">Premium</p>
          <p className="font-medium text-sm">${policyInfo.premiumFormatted}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs text-muted-foreground">Coverage</p>
          <p className="font-medium text-sm">${policyInfo.coverageFormatted}</p>
        </div>
        
        <div className="flex gap-2">
          {canClaim && (
            <Button 
              size="sm"
              onClick={handleSubmitClaim}
              disabled={isSubmitting}
              className="bg-green-500 hover:bg-green-600 h-8"
            >
              {isSubmitting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Claim'
              )}
            </Button>
          )}
          {canCancel && (
            <Button 
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isCancelling}
              className="h-8"
            >
              {isCancelling ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Cancel'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function MyPolicies() {
  const { connected } = useWallet();
  const { policies, isLoading, refetch } = useSolanaPolicies();
  
  // 计算统计信息
  const activePolicies = policies.filter(p => 
    p.status === PolicyStatus.Active && !p.isExpired
  ).length;
  
  const totalCoverage = policies
    .filter(p => p.status === PolicyStatus.Active && !p.isExpired)
    .reduce((sum, p) => sum + (p.coverageAmount || 0), 0);
  
  const claimsFiled = policies.filter(p => 
    p.status === PolicyStatus.Claimed
  ).length;
  
  const totalPaidOut = policies
    .filter(p => p.status === PolicyStatus.Claimed)
    .reduce((sum, p) => sum + (p.coverageAmount || 0), 0);

  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            My Policies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 sm:py-12 text-center">
            <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">Connect your wallet to view your policies</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          My Policies
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          className="h-8"
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {/* Stats - 响应式网格 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Active Policies</p>
            <p className="text-lg sm:text-xl font-bold">{activePolicies}</p>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Total Coverage</p>
            <p className="text-lg sm:text-xl font-bold text-blue-500">
              {formatUSD(totalCoverage / 1e6)}
            </p>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Claims Filed</p>
            <p className="text-lg sm:text-xl font-bold">{claimsFiled}</p>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Total Paid Out</p>
            <p className="text-lg sm:text-xl font-bold text-green-500">
              {formatUSD(totalPaidOut / 1e6)}
            </p>
          </div>
        </div>

        {/* Policies List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : policies.length === 0 ? (
          <div className="py-6 sm:py-8 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">You don&apos;t have any insurance policies yet.</p>
            <p className="text-xs mt-1">Purchase coverage above to protect your investments.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {policies.map((policy, idx) => (
              <PolicyCard key={idx} policyId={idx} policy={policy} />
            ))}
          </div>
        )}

        {/* Solana 提示 */}
        <div className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-blue-500 mb-1">Solana Network</p>
              <p>Currently showing policies on Solana chain. All policy data comes from Solana blockchain.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
