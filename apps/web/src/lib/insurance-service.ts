/**
 * 保险系统服务
 * 负责CowGuard保险产品的管理、购买、理赔等功能
 */

export interface InsuranceProduct {
  id: string;
  name: string;
  description: string;
  type: 'rug_pull' | 'price_drop' | 'smart_contract' | 'comprehensive';
  coverageRange: {
    minAmount: number;
    maxAmount: number;
    currency: string;
  };
  premium: {
    rate: number; // 保险费率，百分比
    fixedFee?: number; // 固定费用
  };
  payout: {
    percentage: number; // 赔付比例，百分比
    maxPayout: number; // 最大赔付金额
  };
  duration: number; // 保险期限，天
  conditions: string[];
  exclusions: string[];
  isActive: boolean;
  chain: string[];
  createdAt: number;
}

export interface InsurancePolicy {
  id: string;
  productId: string;
  userAddress: string;
  coveredAmount: number;
  premiumPaid: number;
  startDate: number;
  endDate: number;
  status: 'active' | 'expired' | 'claimed' | 'cancelled';
  coverageDetails: {
    coveredTokens: string[];
    coveredChains: string[];
    coverageAmount: number;
  };
  claims: InsuranceClaim[];
  isActive: boolean;
  createdAt: number;
}

export interface InsuranceClaim {
  id: string;
  policyId: string;
  userAddress: string;
  type: 'rug_pull' | 'price_drop' | 'smart_contract' | 'comprehensive';
  amount: number;
  description: string;
  evidence: {
    transactionHash?: string;
    screenshots?: string[];
    contractAddress?: string;
    priceData?: {
      beforePrice: number;
      afterPrice: number;
      timestamp: number;
    };
  };
  status: 'pending' | 'investigating' | 'approved' | 'rejected' | 'paid';
  submittedAt: number;
  reviewedAt?: number;
  payoutAmount?: number;
  payoutTransactionHash?: string;
  reviewNotes?: string;
}

export interface InsuranceStats {
  totalPolicies: number;
  activePolicies: number;
  totalClaims: number;
  approvedClaims: number;
  totalPayout: number;
  averageClaimTime: number;
  topRisks: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

class InsuranceService {
  private API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alphanest-api.dappweb.workers.dev';

  /**
   * 获取所有保险产品
   */
  async getInsuranceProducts(chain?: string): Promise<InsuranceProduct[]> {
    try {
      const url = chain 
        ? `${this.API_URL}/api/v1/insurance/products?chain=${chain}`
        : `${this.API_URL}/api/v1/insurance/products`;
      
      const response = await fetch(url);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching insurance products:', error);
      return [];
    }
  }

  /**
   * 获取单个保险产品详情
   */
  async getInsuranceProduct(productId: string): Promise<InsuranceProduct | null> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/insurance/products/${productId}`);
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching insurance product:', error);
      return null;
    }
  }

  /**
   * 计算保险费用
   */
  calculatePremium(
    product: InsuranceProduct,
    coveredAmount: number,
    duration?: number
  ): {
    premium: number;
    breakdown: {
      basePremium: number;
      fixedFee: number;
      total: number;
    };
  } {
    const coverageDuration = duration || product.duration;
    const basePremium = coveredAmount * (product.premium.rate / 100) * (coverageDuration / 365);
    const fixedFee = product.premium.fixedFee || 0;
    const total = basePremium + fixedFee;

    return {
      premium: total,
      breakdown: {
        basePremium,
        fixedFee,
        total
      }
    };
  }

  /**
   * 购买保险
   */
  async purchaseInsurance(
    productId: string,
    userAddress: string,
    coveredAmount: number,
    coveredTokens: string[],
    duration?: number
  ): Promise<{
    success: boolean;
    policyId?: string;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/insurance/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          userAddress,
          coveredAmount,
          coveredTokens,
          duration: duration || 365
        })
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          policyId: result.data.policyId,
          transactionHash: result.data.transactionHash
        };
      } else {
        return {
          success: false,
          error: result.error || 'Insurance purchase failed'
        };
      }
    } catch (error) {
      console.error('Error purchasing insurance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取用户的保险策略
   */
  async getUserPolicies(userAddress: string): Promise<InsurancePolicy[]> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/insurance/policies/${userAddress}`);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching user policies:', error);
      return [];
    }
  }

  /**
   * 获取单个保险策略详情
   */
  async getPolicy(policyId: string): Promise<InsurancePolicy | null> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/insurance/policies/${policyId}`);
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching policy:', error);
      return null;
    }
  }

  /**
   * 提交理赔申请
   */
  async submitClaim(claimData: Omit<InsuranceClaim, 'id' | 'status' | 'submittedAt'>): Promise<{
    success: boolean;
    claimId?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/insurance/claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...claimData,
          status: 'pending',
          submittedAt: Date.now()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          claimId: result.data.claimId
        };
      } else {
        return {
          success: false,
          error: result.error || 'Claim submission failed'
        };
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取用户的理赔申请
   */
  async getUserClaims(userAddress: string): Promise<InsuranceClaim[]> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/insurance/claims/${userAddress}`);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching user claims:', error);
      return [];
    }
  }

  /**
   * 获取理赔申请详情
   */
  async getClaim(claimId: string): Promise<InsuranceClaim | null> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/insurance/claims/${claimId}`);
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching claim:', error);
      return null;
    }
  }

  /**
   * 取消保险策略
   */
  async cancelPolicy(policyId: string, userAddress: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/insurance/policies/${policyId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress
        })
      });

      const result = await response.json();
      
      if (result.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Policy cancellation failed'
        };
      }
    } catch (error) {
      console.error('Error cancelling policy:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取保险统计数据
   */
  async getInsuranceStats(): Promise<InsuranceStats | null> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/insurance/stats`);
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching insurance stats:', error);
      return null;
    }
  }

  /**
   * 检查代币是否被保险覆盖
   */
  async checkTokenCoverage(tokenAddress: string, chain: string): Promise<{
    isCovered: boolean;
    products: InsuranceProduct[];
    maxCoverage: number;
  }> {
    try {
      const response = await fetch(`${this.API_URL}/api/v1/insurance/coverage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAddress,
          chain
        })
      });

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        return {
          isCovered: false,
          products: [],
          maxCoverage: 0
        };
      }
    } catch (error) {
      console.error('Error checking token coverage:', error);
      return {
        isCovered: false,
        products: [],
        maxCoverage: 0
      };
    }
  }

  /**
   * 验证理赔条件
   */
  validateClaimConditions(
    claimType: string,
    policy: InsurancePolicy,
    evidence: InsuranceClaim['evidence']
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查保险是否在有效期内
    const now = Date.now();
    if (now < policy.startDate || now > policy.endDate) {
      errors.push('Insurance policy is not active');
    }

    // 检查代币是否在覆盖范围内
    if (evidence.contractAddress && !policy.coverageDetails.coveredTokens.includes(evidence.contractAddress)) {
      errors.push('Token is not covered by this policy');
    }

    // 根据理赔类型进行特定验证
    switch (claimType) {
      case 'rug_pull':
        if (!evidence.contractAddress) {
          errors.push('Contract address is required for rug pull claims');
        }
        break;
      
      case 'price_drop':
        if (!evidence.priceData) {
          errors.push('Price data is required for price drop claims');
        } else {
          const priceDrop = ((evidence.priceData.beforePrice - evidence.priceData.afterPrice) / evidence.priceData.beforePrice) * 100;
          if (priceDrop < 50) { // 假设价格下跌超过50%才符合条件
            warnings.push('Price drop may be below threshold for coverage');
          }
        }
        break;
      
      case 'smart_contract':
        if (!evidence.contractAddress) {
          errors.push('Contract address is required for smart contract claims');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 估算理赔金额
   */
  estimateClaimPayout(
    policy: InsurancePolicy,
    claimAmount: number,
    claimType: string
  ): {
    estimatedPayout: number;
    maxPayout: number;
    payoutPercentage: number;
  } {
    const maxPayout = Math.min(claimAmount, policy.coverageDetails.coverageAmount);
    const payoutPercentage = Math.min(100, (maxPayout / claimAmount) * 100);

    return {
      estimatedPayout: maxPayout,
      maxPayout,
      payoutPercentage
    };
  }
}

// 创建全局保险服务实例
export const insuranceService = new InsuranceService();

// 导出类型和服务
export { InsuranceService };
export default insuranceService;
