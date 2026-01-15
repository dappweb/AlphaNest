use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("CowGuard1111111111111111111111111111111111");

#[program]
pub mod cowguard_insurance {
    use super::*;

    /// 初始化保险协议
    pub fn initialize(
        ctx: Context<InitializeProtocol>,
        treasury_fee: u16,  // 国库费率 (基点)
    ) -> Result<()> {
        let protocol = &mut ctx.accounts.protocol;
        protocol.authority = ctx.accounts.authority.key();
        protocol.treasury = ctx.accounts.treasury.key();
        protocol.treasury_fee = treasury_fee;
        protocol.total_policies = 0;
        protocol.total_claims = 0;
        protocol.total_payouts = 0;
        protocol.is_paused = false;
        protocol.bump = ctx.bumps.protocol;

        msg!("CowGuard Insurance Protocol initialized");
        Ok(())
    }

    /// 创建保险产品
    pub fn create_product(
        ctx: Context<CreateProduct>,
        product_type: InsuranceType,
        premium_rate: u16,      // 保费率 (基点)
        coverage_rate: u16,     // 赔付率 (基点, 10000 = 100%)
        min_coverage: u64,      // 最小保额
        max_coverage: u64,      // 最大保额
        duration_days: u16,     // 保险期限 (天)
    ) -> Result<()> {
        require!(premium_rate > 0 && premium_rate <= 2000, ErrorCode::InvalidPremiumRate);
        require!(coverage_rate > 0 && coverage_rate <= 10000, ErrorCode::InvalidCoverageRate);
        require!(min_coverage < max_coverage, ErrorCode::InvalidCoverageRange);

        let product = &mut ctx.accounts.product;
        product.authority = ctx.accounts.authority.key();
        product.product_type = product_type;
        product.premium_rate = premium_rate;
        product.coverage_rate = coverage_rate;
        product.min_coverage = min_coverage;
        product.max_coverage = max_coverage;
        product.duration_days = duration_days;
        product.total_policies = 0;
        product.total_coverage = 0;
        product.is_active = true;
        product.bump = ctx.bumps.product;

        msg!("Insurance product created: {:?}", product_type);
        Ok(())
    }

    /// 购买保险
    pub fn purchase_insurance(
        ctx: Context<PurchaseInsurance>,
        coverage_amount: u64,
    ) -> Result<()> {
        let protocol = &ctx.accounts.protocol;
        let product = &mut ctx.accounts.product;
        
        require!(!protocol.is_paused, ErrorCode::ProtocolPaused);
        require!(product.is_active, ErrorCode::ProductInactive);
        require!(
            coverage_amount >= product.min_coverage && coverage_amount <= product.max_coverage,
            ErrorCode::InvalidCoverageAmount
        );

        // 计算保费
        let premium = coverage_amount
            .checked_mul(product.premium_rate as u64)
            .unwrap()
            .checked_div(10000)
            .unwrap();

        // 转移保费到保险池
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.insurance_pool.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            premium,
        )?;

        // 创建保单
        let policy = &mut ctx.accounts.policy;
        let clock = Clock::get()?;
        
        policy.owner = ctx.accounts.user.key();
        policy.product = ctx.accounts.product.key();
        policy.coverage_amount = coverage_amount;
        policy.premium_paid = premium;
        policy.start_time = clock.unix_timestamp;
        policy.end_time = clock.unix_timestamp + (product.duration_days as i64 * 86400);
        policy.status = PolicyStatus::Active;
        policy.bump = ctx.bumps.policy;

        // 更新统计
        product.total_policies += 1;
        product.total_coverage = product.total_coverage.checked_add(coverage_amount).unwrap();

        msg!(
            "Insurance purchased: coverage={}, premium={}, expires={}",
            coverage_amount,
            premium,
            policy.end_time
        );
        Ok(())
    }

    /// 提交理赔申请
    pub fn submit_claim(
        ctx: Context<SubmitClaim>,
        claim_type: ClaimType,
        claim_amount: u64,
        evidence_hash: [u8; 32],
    ) -> Result<()> {
        let policy = &ctx.accounts.policy;
        let clock = Clock::get()?;

        require!(policy.status == PolicyStatus::Active, ErrorCode::PolicyNotActive);
        require!(clock.unix_timestamp <= policy.end_time, ErrorCode::PolicyExpired);
        require!(claim_amount <= policy.coverage_amount, ErrorCode::ClaimExceedsCoverage);

        let claim = &mut ctx.accounts.claim;
        claim.policy = ctx.accounts.policy.key();
        claim.claimant = ctx.accounts.claimant.key();
        claim.claim_type = claim_type;
        claim.claim_amount = claim_amount;
        claim.evidence_hash = evidence_hash;
        claim.status = ClaimStatus::Pending;
        claim.submitted_at = clock.unix_timestamp;
        claim.processed_at = None;
        claim.payout_amount = None;
        claim.bump = ctx.bumps.claim;

        msg!("Claim submitted: type={:?}, amount={}", claim_type, claim_amount);
        Ok(())
    }

    /// 处理理赔 (仅限管理员/DAO)
    pub fn process_claim(
        ctx: Context<ProcessClaim>,
        approved: bool,
        payout_amount: u64,
    ) -> Result<()> {
        let claim = &mut ctx.accounts.claim;
        let policy = &mut ctx.accounts.policy;
        let protocol = &mut ctx.accounts.protocol;
        let clock = Clock::get()?;

        require!(claim.status == ClaimStatus::Pending, ErrorCode::ClaimNotPending);

        if approved {
            require!(payout_amount <= claim.claim_amount, ErrorCode::PayoutExceedsClaim);

            // 计算实际赔付 (根据赔付率)
            let product = &ctx.accounts.product;
            let actual_payout = payout_amount
                .checked_mul(product.coverage_rate as u64)
                .unwrap()
                .checked_div(10000)
                .unwrap();

            // 从保险池转账给用户
            let seeds = &[
                b"protocol".as_ref(),
                &[protocol.bump],
            ];
            let signer = &[&seeds[..]];

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.insurance_pool.to_account_info(),
                        to: ctx.accounts.claimant_token_account.to_account_info(),
                        authority: ctx.accounts.protocol.to_account_info(),
                    },
                    signer,
                ),
                actual_payout,
            )?;

            claim.status = ClaimStatus::Approved;
            claim.payout_amount = Some(actual_payout);
            policy.status = PolicyStatus::Claimed;
            protocol.total_payouts = protocol.total_payouts.checked_add(actual_payout).unwrap();

            msg!("Claim approved: payout={}", actual_payout);
        } else {
            claim.status = ClaimStatus::Rejected;
            msg!("Claim rejected");
        }

        claim.processed_at = Some(clock.unix_timestamp);
        protocol.total_claims += 1;

        Ok(())
    }

    /// 取消保单 (仅限保单持有人, 未过期且未理赔)
    pub fn cancel_policy(ctx: Context<CancelPolicy>) -> Result<()> {
        let policy = &mut ctx.accounts.policy;
        let clock = Clock::get()?;

        require!(policy.status == PolicyStatus::Active, ErrorCode::PolicyNotActive);
        require!(clock.unix_timestamp <= policy.end_time, ErrorCode::PolicyExpired);

        // 计算退款 (按剩余时间比例)
        let total_duration = policy.end_time - policy.start_time;
        let elapsed = clock.unix_timestamp - policy.start_time;
        let remaining_ratio = ((total_duration - elapsed) as u64)
            .checked_mul(10000)
            .unwrap()
            .checked_div(total_duration as u64)
            .unwrap();
        
        let refund = policy.premium_paid
            .checked_mul(remaining_ratio)
            .unwrap()
            .checked_div(10000)
            .unwrap()
            .checked_mul(80) // 80% 退款 (20% 手续费)
            .unwrap()
            .checked_div(100)
            .unwrap();

        // 退款
        let seeds = &[
            b"protocol".as_ref(),
            &[ctx.accounts.protocol.bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.insurance_pool.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.protocol.to_account_info(),
                },
                signer,
            ),
            refund,
        )?;

        policy.status = PolicyStatus::Cancelled;

        msg!("Policy cancelled, refund: {}", refund);
        Ok(())
    }

    /// 暂停/恢复协议 (仅限管理员)
    pub fn set_protocol_paused(
        ctx: Context<UpdateProtocol>,
        paused: bool,
    ) -> Result<()> {
        let protocol = &mut ctx.accounts.protocol;
        protocol.is_paused = paused;

        msg!("Protocol paused: {}", paused);
        Ok(())
    }

    /// 更新产品状态 (仅限管理员)
    pub fn set_product_active(
        ctx: Context<UpdateProduct>,
        active: bool,
    ) -> Result<()> {
        let product = &mut ctx.accounts.product;
        product.is_active = active;

        msg!("Product active: {}", active);
        Ok(())
    }
}

// ============== 账户结构 ==============

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + InsuranceProtocol::INIT_SPACE,
        seeds = [b"protocol"],
        bump
    )]
    pub protocol: Account<'info, InsuranceProtocol>,

    /// CHECK: Treasury account
    pub treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(product_type: InsuranceType)]
pub struct CreateProduct<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"protocol"],
        bump = protocol.bump,
        constraint = protocol.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub protocol: Account<'info, InsuranceProtocol>,

    #[account(
        init,
        payer = authority,
        space = 8 + InsuranceProduct::INIT_SPACE,
        seeds = [b"product", &[product_type as u8]],
        bump
    )]
    pub product: Account<'info, InsuranceProduct>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PurchaseInsurance<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [b"protocol"],
        bump = protocol.bump
    )]
    pub protocol: Account<'info, InsuranceProtocol>,

    #[account(mut)]
    pub product: Account<'info, InsuranceProduct>,

    #[account(
        init,
        payer = user,
        space = 8 + InsurancePolicy::INIT_SPACE,
        seeds = [b"policy", user.key().as_ref(), product.key().as_ref()],
        bump
    )]
    pub policy: Account<'info, InsurancePolicy>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub insurance_pool: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitClaim<'info> {
    #[account(mut)]
    pub claimant: Signer<'info>,

    #[account(
        constraint = policy.owner == claimant.key() @ ErrorCode::Unauthorized
    )]
    pub policy: Account<'info, InsurancePolicy>,

    #[account(
        init,
        payer = claimant,
        space = 8 + InsuranceClaim::INIT_SPACE,
        seeds = [b"claim", policy.key().as_ref()],
        bump
    )]
    pub claim: Account<'info, InsuranceClaim>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProcessClaim<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"protocol"],
        bump = protocol.bump,
        constraint = protocol.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub protocol: Account<'info, InsuranceProtocol>,

    pub product: Account<'info, InsuranceProduct>,

    #[account(mut)]
    pub policy: Account<'info, InsurancePolicy>,

    #[account(mut)]
    pub claim: Account<'info, InsuranceClaim>,

    #[account(mut)]
    pub insurance_pool: Account<'info, TokenAccount>,

    #[account(mut)]
    pub claimant_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelPolicy<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [b"protocol"],
        bump = protocol.bump
    )]
    pub protocol: Account<'info, InsuranceProtocol>,

    #[account(
        mut,
        constraint = policy.owner == user.key() @ ErrorCode::Unauthorized
    )]
    pub policy: Account<'info, InsurancePolicy>,

    #[account(mut)]
    pub insurance_pool: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateProtocol<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"protocol"],
        bump = protocol.bump,
        constraint = protocol.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub protocol: Account<'info, InsuranceProtocol>,
}

#[derive(Accounts)]
pub struct UpdateProduct<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"protocol"],
        bump = protocol.bump,
        constraint = protocol.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub protocol: Account<'info, InsuranceProtocol>,

    #[account(mut)]
    pub product: Account<'info, InsuranceProduct>,
}

// ============== 数据结构 ==============

#[account]
#[derive(InitSpace)]
pub struct InsuranceProtocol {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub treasury_fee: u16,
    pub total_policies: u64,
    pub total_claims: u64,
    pub total_payouts: u64,
    pub is_paused: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct InsuranceProduct {
    pub authority: Pubkey,
    pub product_type: InsuranceType,
    pub premium_rate: u16,
    pub coverage_rate: u16,
    pub min_coverage: u64,
    pub max_coverage: u64,
    pub duration_days: u16,
    pub total_policies: u64,
    pub total_coverage: u64,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct InsurancePolicy {
    pub owner: Pubkey,
    pub product: Pubkey,
    pub coverage_amount: u64,
    pub premium_paid: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub status: PolicyStatus,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct InsuranceClaim {
    pub policy: Pubkey,
    pub claimant: Pubkey,
    pub claim_type: ClaimType,
    pub claim_amount: u64,
    pub evidence_hash: [u8; 32],
    pub status: ClaimStatus,
    pub submitted_at: i64,
    pub processed_at: Option<i64>,
    pub payout_amount: Option<u64>,
    pub bump: u8,
}

// ============== 枚举类型 ==============

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum InsuranceType {
    RugPull,        // Rug Pull 保险
    PriceDrop,      // 价格下跌保险
    SmartContract,  // 智能合约漏洞保险
    Comprehensive,  // 综合保险
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum PolicyStatus {
    Active,
    Expired,
    Claimed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum ClaimType {
    RugPull,
    PriceDrop,
    ContractExploit,
    Other,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum ClaimStatus {
    Pending,
    Approved,
    Rejected,
}

// ============== 错误码 ==============

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Protocol is paused")]
    ProtocolPaused,
    #[msg("Product is inactive")]
    ProductInactive,
    #[msg("Invalid premium rate")]
    InvalidPremiumRate,
    #[msg("Invalid coverage rate")]
    InvalidCoverageRate,
    #[msg("Invalid coverage range")]
    InvalidCoverageRange,
    #[msg("Invalid coverage amount")]
    InvalidCoverageAmount,
    #[msg("Policy is not active")]
    PolicyNotActive,
    #[msg("Policy has expired")]
    PolicyExpired,
    #[msg("Claim exceeds coverage")]
    ClaimExceedsCoverage,
    #[msg("Claim is not pending")]
    ClaimNotPending,
    #[msg("Payout exceeds claim amount")]
    PayoutExceedsClaim,
}
