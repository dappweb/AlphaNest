/**
 * 保险精算计算器
 * 基于历史数据和风险评估科学计算保费率和理赔率
 */

export type InsuranceType = 'rug_pull' | 'price_drop' | 'smart_contract' | 'comprehensive';

export interface RiskFactors {
  // 历史数据
  historicalClaimRate: number;      // 历史理赔率 (0-1)
  totalPolicies: number;            // 总保单数
  totalClaims: number;              // 总理赔数
  totalPremiums: number;            // 总保费收入
  totalPayouts: number;             // 总赔付金额
  
  // 市场数据
  volatility: number;                // 波动率 (0-1)
  liquidity: number;                 // 流动性评分 (0-100)
  marketCap: number;                 // 市值
  tradingVolume: number;             // 交易量
  
  // 风险评估
  auditScore: number;                // 审计评分 (0-100)
  holderDistribution: number;        // 持币分布评分 (0-100)
  teamVerification: number;          // 团队验证 (0-1)
  contractComplexity: number;        // 合约复杂度 (0-100)
}

export interface ActuarialResult {
  premiumRate: number;              // 建议保费率 (0-1, 如 0.02 = 2%)
  expectedClaimRate: number;        // 预期理赔率 (0-1)
  riskScore: number;                // 风险评分 (0-100)
  confidence: number;               // 置信度 (0-1)
  breakdown: {
    baseRate: number;
    riskAdjustment: number;
    claimRateAdjustment: number;
    operatingCost: number;
    profitMargin: number;
  };
}

export class ActuarialCalculator {
  // 基础费率（按产品类型）- pump.fun 代币优化费率
  // 针对 pump.fun 代币特性，提高费率确保盈利
  private readonly BASE_RATES: Record<InsuranceType, number> = {
    rug_pull: 0.02,        // 2%（标准）
    price_drop: 0.03,      // 3%（标准）
    smart_contract: 0.05,  // 5%（标准）
    comprehensive: 0.08,    // 8%（标准）
  };
  
  // pump.fun 代币专用费率（bonding curve 阶段高风险）
  private readonly PUMP_FUN_BONDING_CURVE_RATES: Record<InsuranceType, number> = {
    rug_pull: 0.07,        // 7% - bonding curve 阶段高风险
    price_drop: 0.08,      // 8%
    smart_contract: 0.09,  // 9%
    comprehensive: 0.10,   // 10%
  };
  
  // pump.fun 代币完成状态费率（Raydium 池阶段相对稳定）
  private readonly PUMP_FUN_COMPLETED_RATES: Record<InsuranceType, number> = {
    rug_pull: 0.03,        // 3% - 完成状态相对稳定
    price_drop: 0.04,      // 4%
    smart_contract: 0.05,  // 5%
    comprehensive: 0.06,   // 6%
  };
  
  // 运营成本率
  private readonly OPERATING_COST = 0.05;  // 5%
  
  // 利润边际（提高以确保盈利）
  private readonly PROFIT_MARGIN = 0.12;   // 12%（从 10% 提高到 12%）
  
  // 取消率（历史平均）
  private readonly CANCELLATION_RATE = 0.10;  // 10%
  
  // 取消手续费率（提高以确保盈利）
  private readonly CANCELLATION_FEE_RATE = 0.30;  // 30%（从 20% 提高到 30%）
  
  // 协议费用率（提高以确保盈利）
  private readonly TREASURY_FEE_RATE = 0.03;  // 3%（从 2% 提高到 3%）
  
  /**
   * 计算建议保费率
   * @param productType 保险产品类型
   * @param riskFactors 风险因素
   * @param isPumpFun 是否为 pump.fun 代币
   * @param bondingCurveComplete bonding curve 是否完成（pump.fun 专用）
   */
  calculatePremiumRate(
    productType: InsuranceType,
    riskFactors: RiskFactors,
    isPumpFun: boolean = false,
    bondingCurveComplete: boolean = false
  ): ActuarialResult {
    // 1. 计算预期理赔率
    const expectedClaimRate = this.calculateExpectedClaimRate(riskFactors);
    
    // 2. 计算风险评分（传入 isPumpFun 标识）
    const riskScore = this.calculateRiskScore(productType, riskFactors, isPumpFun);
    
    // 3. 获取基础费率（根据 pump.fun 状态调整）
    let baseRate: number;
    if (isPumpFun) {
      // pump.fun 代币：根据 bonding curve 状态选择费率
      if (bondingCurveComplete) {
        // 已完成 bonding curve，使用完成状态费率
        baseRate = this.PUMP_FUN_COMPLETED_RATES[productType];
      } else {
        // bonding curve 阶段，使用高风险费率
        baseRate = this.PUMP_FUN_BONDING_CURVE_RATES[productType];
      }
    } else {
      // 标准代币使用标准费率
      baseRate = this.BASE_RATES[productType];
    }
    
    // 4. 计算风险调整系数
    const riskMultiplier = this.calculateRiskMultiplier(productType, riskScore);
    
    // 5. 计算最终保费率
    const premiumRate = this.calculateFinalRate(
      baseRate,
      expectedClaimRate,
      riskMultiplier
    );
    
    // 6. 计算置信度
    const confidence = this.calculateConfidence(riskFactors);
    
    return {
      premiumRate: Math.max(0.01, Math.min(0.20, premiumRate)), // 限制在 1%-20%
      expectedClaimRate,
      riskScore,
      confidence,
      breakdown: {
        baseRate,
        riskAdjustment: riskMultiplier,
        claimRateAdjustment: expectedClaimRate,
        operatingCost: this.OPERATING_COST,
        profitMargin: this.PROFIT_MARGIN,
      },
    };
  }
  
  /**
   * 获取协议费用率（pump.fun 优化）
   */
  getTreasuryFeeRate(): number {
    return this.TREASURY_FEE_RATE;  // 3%
  }
  
  /**
   * 获取取消手续费率（pump.fun 优化）
   */
  getCancellationFeeRate(): number {
    return this.CANCELLATION_FEE_RATE;  // 30%
  }
  
  /**
   * 计算预期理赔率
   */
  private calculateExpectedClaimRate(factors: RiskFactors): number {
    // 如果有足够的历史数据，使用历史理赔率
    if (factors.totalPolicies >= 100) {
      const historicalRate = factors.totalClaims / factors.totalPolicies;
      
      // 趋势调整（最近数据权重更高）
      const trendAdjustment = this.calculateTrend(factors);
      
      return historicalRate * trendAdjustment;
    }
    
    // 数据不足，使用默认值
    return 0.10; // 10% 默认理赔率
  }
  
  /**
   * 计算趋势调整
   */
  private calculateTrend(factors: RiskFactors): number {
    // 简化版：如果理赔率上升，增加调整系数
    // 实际应该分析最近3个月的趋势
    if (factors.historicalClaimRate > 0.15) {
      return 1.2; // 理赔率高，增加 20%
    } else if (factors.historicalClaimRate < 0.05) {
      return 0.8; // 理赔率低，减少 20%
    }
    return 1.0;
  }
  
  /**
   * 计算风险评分
   * @param productType 保险产品类型
   * @param factors 风险因素
   * @param isPumpFun 是否为 pump.fun 代币
   */
  private calculateRiskScore(
    productType: InsuranceType,
    factors: RiskFactors,
    isPumpFun: boolean = false
  ): number {
    switch (productType) {
      case 'rug_pull':
        return this.calculateRugPullRisk(factors, isPumpFun);
      case 'price_drop':
        return this.calculatePriceDropRisk(factors);
      case 'smart_contract':
        return this.calculateContractRisk(factors);
      case 'comprehensive':
        return (
          this.calculateRugPullRisk(factors, isPumpFun) * 0.3 +
          this.calculatePriceDropRisk(factors) * 0.3 +
          this.calculateContractRisk(factors) * 0.4
        );
      default:
        return 50; // 中等风险
    }
  }
  
  /**
   * Rug Pull 风险评估
   * @param factors 风险因素
   * @param isPumpFun 是否为 pump.fun 代币（需要特殊处理）
   */
  private calculateRugPullRisk(factors: RiskFactors, isPumpFun: boolean = false): number {
    const liquidityScore = (100 - factors.liquidity) / 100;  // 流动性越低，风险越高
    const holderScore = (100 - factors.holderDistribution) / 100;
    const auditScore = (100 - factors.auditScore) / 100;
    const teamScore = 1 - factors.teamVerification;
    
    // pump.fun 代币的特殊风险调整
    if (isPumpFun) {
      // pump.fun 代币通常没有审计，市值较低，这是正常的
      // 但需要更关注 bonding curve 完成状态和流动性
      const marketCapScore = factors.marketCap < 50000 ? 0.9 : 0.3; // pump.fun 市值阈值更低
      
      // pump.fun 代币权重调整：更关注流动性和持币分布
      return (
        liquidityScore * 0.35 +      // 流动性权重增加（bonding curve 阶段）
        holderScore * 0.25 +          // 持币分布权重增加
        auditScore * 0.1 +            // 审计权重降低（pump.fun 通常无审计）
        teamScore * 0.1 +             // 团队验证权重降低
        marketCapScore * 0.2          // 市值权重增加
      ) * 100;
    }
    
    // 标准代币风险评估
    const marketCapScore = factors.marketCap < 1000000 ? 0.8 : 0.2;
    
    return (
      liquidityScore * 0.3 +
      holderScore * 0.2 +
      auditScore * 0.2 +
      teamScore * 0.15 +
      marketCapScore * 0.15
    ) * 100;
  }
  
  /**
   * 价格下跌风险评估
   */
  private calculatePriceDropRisk(factors: RiskFactors): number {
    const volatilityScore = factors.volatility;
    const volumeScore = factors.tradingVolume < 10000 ? 0.8 : 0.2;
    const liquidityScore = (100 - factors.liquidity) / 100;
    
    return (
      volatilityScore * 0.4 +
      volumeScore * 0.3 +
      liquidityScore * 0.3
    ) * 100;
  }
  
  /**
   * 智能合约风险评估
   */
  private calculateContractRisk(factors: RiskFactors): number {
    const auditScore = (100 - factors.auditScore) / 100;
    const complexityScore = factors.contractComplexity / 100;
    
    return (
      auditScore * 0.6 +
      complexityScore * 0.4
    ) * 100;
  }
  
  /**
   * 计算风险调整系数
   */
  private calculateRiskMultiplier(
    productType: InsuranceType,
    riskScore: number
  ): number {
    // 风险评分 0-100，转换为调整系数 0.5-2.0
    const normalizedRisk = riskScore / 100;
    
    // 高风险 → 高费率，低风险 → 低费率
    return 0.5 + (normalizedRisk * 1.5);
  }
  
  /**
   * 计算最终费率
   * 基于精算公式：premium_rate = (expected_loss + operating_cost + profit_margin) / (1 - cancellation_rate)
   */
  private calculateFinalRate(
    baseRate: number,
    expectedClaimRate: number,
    riskMultiplier: number
  ): number {
    // 预期损失 = 预期理赔率 × 赔付率（假设 80%）
    const expectedLoss = expectedClaimRate * 0.8;
    
    // 分子：预期损失 + 运营成本 + 利润边际
    const numerator = expectedLoss + this.OPERATING_COST + this.PROFIT_MARGIN;
    
    // 分母：1 - 取消率
    const denominator = 1 - this.CANCELLATION_RATE;
    
    // 基础费率
    const calculatedRate = numerator / denominator;
    
    // 应用风险调整
    return calculatedRate * riskMultiplier;
  }
  
  /**
   * 计算置信度
   */
  private calculateConfidence(factors: RiskFactors): number {
    // 数据量越大，置信度越高
    const dataConfidence = Math.min(1.0, factors.totalPolicies / 1000);
    
    // 数据完整性
    const completeness = (
      (factors.historicalClaimRate > 0 ? 1 : 0) +
      (factors.volatility > 0 ? 1 : 0) +
      (factors.liquidity > 0 ? 1 : 0) +
      (factors.auditScore > 0 ? 1 : 0)
    ) / 4;
    
    return (dataConfidence * 0.7 + completeness * 0.3);
  }
  
  /**
   * 获取历史理赔率统计
   */
  async getHistoricalClaimRate(
    productType: InsuranceType,
    timeRange: { start: Date; end: Date }
  ): Promise<number> {
    // 这里应该从数据库查询历史数据
    // 示例实现
    return 0.10; // 10% 默认值
  }
}

// 导出单例
export const actuarialCalculator = new ActuarialCalculator();
