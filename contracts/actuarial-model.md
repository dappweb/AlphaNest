# 📊 保险精算模型设计

## ⚠️ 当前问题

**现状**：理赔率和保费率都是**手动设置**，没有基于数据的科学计算

### 代码中的问题

```rust
// contracts/solana/programs/cowguard-insurance/src/lib.rs:33-61
pub fn create_product(
    ctx: Context<CreateProduct>,
    product_type: InsuranceType,
    premium_rate: u16,      // ❌ 手动设置，没有计算
    coverage_rate: u16,     // ❌ 手动设置，没有计算
    // ...
) -> Result<()> {
    require!(premium_rate > 0 && premium_rate <= 2000, ErrorCode::InvalidPremiumRate);
    require!(coverage_rate > 0 && coverage_rate <= 10000, ErrorCode::InvalidCoverageRate);
    // 直接使用传入的值，没有风险评估
}
```

**问题**：
1. ❌ 没有历史理赔数据统计
2. ❌ 没有风险评估模型
3. ❌ 没有动态调整机制
4. ❌ 没有精算公式

---

## ✅ 科学精算模型设计

### 1. 理赔率（Claim Rate）计算公式

```
理赔率 = (总理赔金额 / 总保费收入) × 100%

历史理赔率 = Σ(已处理理赔金额) / Σ(已收保费)
预期理赔率 = 历史理赔率 × 风险调整系数
```

### 2. 保费率（Premium Rate）计算公式

基于**期望损失法**（Expected Loss Method）：

```
保费率 = (预期理赔率 × 赔付率 + 运营成本率 + 利润边际) / (1 - 取消率)

其中：
- 预期理赔率 = 历史理赔率 × 风险调整系数
- 赔付率 = coverage_rate (通常 80%)
- 运营成本率 = 5-10%
- 利润边际 = 10-20%
- 取消率 = 历史取消保单比例
```

### 3. 风险评估模型

#### A. Rug Pull 风险评估

```python
rug_pull_risk_score = (
    liquidity_score * 0.3 +          # 流动性评分
    holder_distribution * 0.2 +      # 持币分布
    contract_audit_score * 0.2 +     # 合约审计
    team_verification * 0.15 +       # 团队验证
    market_cap_stability * 0.15      # 市值稳定性
)

premium_rate = base_rate * (1 + rug_pull_risk_score)
```

#### B. 价格下跌风险评估

```python
price_drop_risk = (
    volatility * 0.4 +              # 波动率
    trading_volume * 0.2 +          # 交易量
    market_sentiment * 0.2 +        # 市场情绪
    correlation_with_btc * 0.2      # 与BTC相关性
)

premium_rate = base_rate * (1 + price_drop_risk)
```

#### C. 智能合约漏洞风险评估

```python
contract_risk = (
    audit_score * 0.4 +             # 审计评分
    code_complexity * 0.2 +         # 代码复杂度
    upgradeability * 0.2 +          # 可升级性
    bug_bounty * 0.2                # Bug赏金计划
)

premium_rate = base_rate * (1 - contract_risk)  # 风险越低，费率越低
```

---

## 🔧 实现方案

### 方案 1：链下计算 + 链上验证

```typescript
// apps/api/src/services/actuarial-calculator.ts

interface RiskFactors {
  historicalClaimRate: number;      // 历史理赔率
  volatility: number;                // 波动率
  liquidity: number;                 // 流动性
  auditScore: number;                // 审计评分
  marketCap: number;                 // 市值
  tradingVolume: number;             // 交易量
}

class ActuarialCalculator {
  /**
   * 计算保费率
   */
  calculatePremiumRate(
    productType: InsuranceType,
    riskFactors: RiskFactors
  ): number {
    // 基础费率
    const baseRate = this.getBaseRate(productType);
    
    // 风险调整
    const riskMultiplier = this.calculateRiskMultiplier(
      productType,
      riskFactors
    );
    
    // 历史理赔率调整
    const claimRateAdjustment = this.adjustForClaimRate(
      riskFactors.historicalClaimRate
    );
    
    // 最终费率
    const premiumRate = baseRate * riskMultiplier * claimRateAdjustment;
    
    // 限制在合理范围内
    return Math.max(0.01, Math.min(0.20, premiumRate)); // 1% - 20%
  }
  
  /**
   * 计算预期理赔率
   */
  calculateExpectedClaimRate(
    productType: InsuranceType,
    historicalData: HistoricalData
  ): number {
    // 历史理赔率
    const historicalRate = 
      historicalData.totalClaims / historicalData.totalPolicies;
    
    // 趋势调整（最近3个月权重更高）
    const trendAdjustment = this.calculateTrend(historicalData);
    
    // 季节性调整
    const seasonalAdjustment = this.getSeasonalFactor();
    
    return historicalRate * trendAdjustment * seasonalAdjustment;
  }
  
  /**
   * 风险乘数计算
   */
  private calculateRiskMultiplier(
    productType: InsuranceType,
    factors: RiskFactors
  ): number {
    switch (productType) {
      case 'rug_pull':
        return this.calculateRugPullRisk(factors);
      case 'price_drop':
        return this.calculatePriceDropRisk(factors);
      case 'smart_contract':
        return this.calculateContractRisk(factors);
      default:
        return 1.0;
    }
  }
}
```

### 方案 2：链上动态调整

```rust
// contracts/solana/programs/cowguard-insurance/src/lib.rs

#[account]
pub struct ProductStatistics {
    pub total_policies: u64,
    pub total_premiums: u64,
    pub total_claims: u64,
    pub total_payouts: u64,
    pub historical_claim_rate: u16,  // 历史理赔率 (基点)
    pub last_updated: i64,
}

/// 根据历史数据动态调整保费率
pub fn update_premium_rate(
    ctx: Context<UpdateProductRate>,
    new_rate: Option<u16>,
) -> Result<()> {
    let product = &mut ctx.accounts.product;
    let stats = &ctx.accounts.stats;
    
    if let Some(rate) = new_rate {
        // 手动设置
        product.premium_rate = rate;
    } else {
        // 自动计算
        let calculated_rate = calculate_optimal_rate(
            stats.historical_claim_rate,
            product.coverage_rate,
        )?;
        product.premium_rate = calculated_rate;
    }
    
    Ok(())
}

fn calculate_optimal_rate(
    historical_claim_rate: u16,
    coverage_rate: u16,
) -> Result<u16> {
    // 精算公式：
    // premium_rate = (claim_rate * coverage_rate / 10000 + operating_cost + profit_margin) / (1 - cancellation_rate)
    
    let operating_cost = 500;  // 5% 运营成本
    let profit_margin = 1000;  // 10% 利润边际
    let cancellation_rate = 1000; // 10% 取消率
    
    let expected_loss = (historical_claim_rate as u64 * coverage_rate as u64) / 10000;
    let numerator = expected_loss + operating_cost + profit_margin;
    let denominator = 10000 - cancellation_rate;
    
    let rate = (numerator * 10000) / denominator;
    
    // 限制在合理范围
    Ok(rate.min(2000) as u16) // 最大 20%
}
```

---

## 📊 数据收集需求

### 1. 历史数据统计

```sql
-- 理赔率统计
SELECT 
    product_type,
    COUNT(*) as total_policies,
    SUM(premium_paid) as total_premiums,
    COUNT(CASE WHEN status = 'claimed' THEN 1 END) as total_claims,
    SUM(CASE WHEN status = 'claimed' THEN payout_amount ELSE 0 END) as total_payouts,
    (SUM(CASE WHEN status = 'claimed' THEN payout_amount ELSE 0 END) * 10000.0 / 
     NULLIF(SUM(premium_paid), 0)) as claim_rate_bps
FROM policies
GROUP BY product_type;
```

### 2. 风险评估数据源

- **链上数据**：
  - 代币价格历史（Pyth Network）
  - 交易量（DEX 数据）
  - 流动性池数据
  - 持币分布

- **链下数据**：
  - 合约审计报告
  - 团队信息
  - 社交媒体数据
  - 市场情绪指标

---

## 🎯 实施建议

### 阶段 1：数据收集（1-2周）

1. ✅ 实现历史数据统计功能
2. ✅ 建立风险评估数据源
3. ✅ 收集初始数据样本

### 阶段 2：模型开发（2-3周）

1. ✅ 实现精算计算器
2. ✅ 开发风险评估模型
3. ✅ 建立动态调整机制

### 阶段 3：测试验证（1-2周）

1. ✅ 回测历史数据
2. ✅ 验证模型准确性
3. ✅ 调整参数

### 阶段 4：上线部署（1周）

1. ✅ 部署到测试网
2. ✅ 小规模测试
3. ✅ 逐步推广

---

## 📈 预期效果

### 优化前（手动设置）

- 保费率：固定 2-5%
- 理赔率：未知，可能过高或过低
- 风险：可能亏损或定价不合理

### 优化后（科学计算）

- 保费率：根据风险动态调整（1-20%）
- 理赔率：基于历史数据预测
- 风险：可控，盈利稳定

### 盈利改善

- **定价准确性**：提高 30-50%
- **理赔率预测**：误差 < 5%
- **整体盈利**：提升 20-40%

---

## ⚠️ 注意事项

1. **数据质量**：需要足够的历史数据（至少 3-6 个月）
2. **模型验证**：定期回测和调整
3. **风险控制**：设置费率上限和下限
4. **透明度**：向用户展示费率计算逻辑
5. **监管合规**：确保符合保险监管要求

---

**结论**：当前理赔率和保费率**没有科学计算**，建议尽快实施精算模型以提高盈利能力和风险控制。
