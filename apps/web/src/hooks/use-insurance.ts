/**
 * 保险系统相关Hooks
 * 提供保险产品管理、购买、理赔等功能
 */

import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { insuranceService, type InsuranceProduct, type InsurancePolicy, type InsuranceClaim } from '@/lib/insurance-service';

/**
 * 保险产品Hook
 */
export function useInsuranceProducts(chain?: string) {
  const [products, setProducts] = useState<InsuranceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const productList = await insuranceService.getInsuranceProducts(chain);
      setProducts(productList);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch insurance products';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [chain]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    error,
    refresh: fetchProducts,
  };
}

/**
 * 单个保险产品Hook
 */
export function useInsuranceProduct(productId: string) {
  const [product, setProduct] = useState<InsuranceProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const productData = await insuranceService.getInsuranceProduct(productId);
      setProduct(productData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch insurance product';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [fetchProduct, productId]);

  return {
    product,
    isLoading,
    error,
    refresh: fetchProduct,
  };
}

/**
 * 保险购买Hook
 */
export function useInsurancePurchase() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPurchase, setLastPurchase] = useState<{
    policyId?: string;
    transactionHash?: string;
  } | null>(null);

  const purchaseInsurance = useCallback(async (
    productId: string,
    coveredAmount: number,
    coveredTokens: string[],
    duration?: number
  ) => {
    if (!address) {
      return {
        success: false,
        error: 'Wallet not connected'
      };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await insuranceService.purchaseInsurance(
        productId,
        address,
        coveredAmount,
        coveredTokens,
        duration
      );

      setLastPurchase({
        policyId: result.policyId,
        transactionHash: result.transactionHash
      });

      if (!result.success) {
        setError(result.error || 'Insurance purchase failed');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    purchaseInsurance,
    isLoading,
    error,
    lastPurchase,
    clearError,
  };
}

/**
 * 用户保险策略Hook
 */
export function useUserPolicies() {
  const { address } = useAccount();
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const userPolicies = await insuranceService.getUserPolicies(address);
      setPolicies(userPolicies);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user policies';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const activePolicies = policies.filter(policy => policy.isActive && policy.status === 'active');

  return {
    policies,
    activePolicies,
    isLoading,
    error,
    refresh: fetchPolicies,
  };
}

/**
 * 单个保险策略Hook
 */
export function usePolicy(policyId: string) {
  const [policy, setPolicy] = useState<InsurancePolicy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicy = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const policyData = await insuranceService.getPolicy(policyId);
      setPolicy(policyData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch policy';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [policyId]);

  useEffect(() => {
    if (policyId) {
      fetchPolicy();
    }
  }, [fetchPolicy, policyId]);

  const cancelPolicy = useCallback(async () => {
    if (!policy) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await insuranceService.cancelPolicy(policyId, policy.userAddress);
      
      if (!result.success) {
        setError(result.error || 'Policy cancellation failed');
      } else {
        // 重新获取策略数据
        await fetchPolicy();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [policy, fetchPolicy]);

  return {
    policy,
    isLoading,
    error,
    refresh: fetchPolicy,
    cancelPolicy,
  };
}

/**
 * 理赔申请Hook
 */
export function useInsuranceClaims() {
  const { address } = useAccount();
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClaims = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const userClaims = await insuranceService.getUserClaims(address);
      setClaims(userClaims);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch claims';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const submitClaim = useCallback(async (claimData: Omit<InsuranceClaim, 'id' | 'status' | 'submittedAt'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await insuranceService.submitClaim(claimData);
      
      if (!result.success) {
        setError(result.error || 'Claim submission failed');
      } else {
        // 重新获取理赔列表
        await fetchClaims();
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [fetchClaims]);

  return {
    claims,
    isLoading,
    error,
    refresh: fetchClaims,
    submitClaim,
  };
}

/**
 * 单个理赔申请Hook
 */
export function useClaim(claimId: string) {
  const [claim, setClaim] = useState<InsuranceClaim | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClaim = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const claimData = await insuranceService.getClaim(claimId);
      setClaim(claimData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch claim';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    if (claimId) {
      fetchClaim();
    }
  }, [fetchClaim, claimId]);

  return {
    claim,
    isLoading,
    error,
    refresh: fetchClaim,
  };
}

/**
 * 保险统计Hook
 */
export function useInsuranceStats() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const insuranceStats = await insuranceService.getInsuranceStats();
      setStats(insuranceStats);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch insurance stats';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
  };
}

/**
 * 代币覆盖检查Hook
 */
export function useTokenCoverage(tokenAddress: string, chain: string) {
  const [coverage, setCoverage] = useState<{
    isCovered: boolean;
    products: InsuranceProduct[];
    maxCoverage: number;
  }>({
    isCovered: false,
    products: [],
    maxCoverage: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkCoverage = useCallback(async () => {
    if (!tokenAddress || !chain) return;

    setIsLoading(true);
    setError(null);

    try {
      const coverageInfo = await insuranceService.checkTokenCoverage(tokenAddress, chain);
      setCoverage(coverageInfo);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check token coverage';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [tokenAddress, chain]);

  useEffect(() => {
    checkCoverage();
  }, [checkCoverage]);

  return {
    coverage,
    isLoading,
    error,
    refresh: checkCoverage,
  };
}

/**
 * 保险费用计算Hook
 */
export function useInsuranceCalculator() {
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePremium = useCallback((
    product: InsuranceProduct,
    coveredAmount: number,
    duration?: number
  ) => {
    setCalculating(true);
    setError(null);

    try {
      const result = insuranceService.calculatePremium(product, coveredAmount, duration);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Calculation failed';
      setError(errorMessage);
      throw error;
    } finally {
      setCalculating(false);
    }
  }, []);

  const validateClaim = useCallback((
    claimType: string,
    policy: InsurancePolicy,
    evidence: InsuranceClaim['evidence']
  ) => {
    try {
      const result = insuranceService.validateClaimConditions(claimType, policy, evidence);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      setError(errorMessage);
      return {
        isValid: false,
        errors: [errorMessage],
        warnings: []
      };
    }
  }, []);

  const estimatePayout = useCallback((
    policy: InsurancePolicy,
    claimAmount: number,
    claimType: string
  ) => {
    try {
      const result = insuranceService.estimateClaimPayout(policy, claimAmount, claimType);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Estimation failed';
      setError(errorMessage);
      return {
        estimatedPayout: 0,
        maxPayout: 0,
        payoutPercentage: 0
      };
    }
  }, []);

  return {
    calculatePremium,
    validateClaim,
    estimatePayout,
    calculating,
    error,
    clearError: () => setError(null),
  };
}
