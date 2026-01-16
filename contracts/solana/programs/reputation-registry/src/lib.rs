use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};

declare_id!("Reputation1111111111111111111111111111111111111");

#[program]
pub mod reputation_registry {
    use super::*;

    /// 注册 Dev
    pub fn register_dev(
        ctx: Context<RegisterDev>,
        alias: String,
    ) -> Result<()> {
        let dev_account = &mut ctx.accounts.dev_account;
        dev_account.owner = ctx.accounts.authority.key();
        dev_account.alias = alias;
        dev_account.reputation_score = 50; // 初始分数 50
        dev_account.verification_level = VerificationLevel::Unranked;
        dev_account.total_launches = 0;
        dev_account.successful_launches = 0;
        dev_account.rug_count = 0;
        dev_account.total_volume = 0;
        dev_account.is_verified = false;
        dev_account.verification_stake = 0;
        dev_account.created_at = Clock::get()?.unix_timestamp;
        dev_account.bump = ctx.bumps.dev_account;

        msg!("Dev registered: {}", dev_account.alias);
        Ok(())
    }

    /// 记录发币历史
    pub fn record_launch(
        ctx: Context<RecordLaunch>,
        token_address: Pubkey,
        chain_id: u16,
        initial_liquidity: u64,
        initial_market_cap: u64,
    ) -> Result<()> {
        let dev_account = &mut ctx.accounts.dev_account;
        let launch_record = &mut ctx.accounts.launch_record;

        // 创建发币记录
        launch_record.dev = dev_account.owner;
        launch_record.token_address = token_address;
        launch_record.chain_id = chain_id;
        launch_record.launch_time = Clock::get()?.unix_timestamp;
        launch_record.initial_liquidity = initial_liquidity;
        launch_record.initial_market_cap = initial_market_cap;
        launch_record.status = LaunchStatus::Active;
        launch_record.ath_market_cap = initial_market_cap;
        launch_record.current_market_cap = initial_market_cap;
        launch_record.bump = ctx.bumps.launch_record;

        // 更新 Dev 统计
        dev_account.total_launches += 1;
        dev_account.total_volume = dev_account.total_volume.checked_add(initial_market_cap).unwrap();

        msg!("Launch recorded: {} on chain {}", token_address, chain_id);
        Ok(())
    }

    /// 更新发币状态（毕业/Rug）
    pub fn update_launch_status(
        ctx: Context<UpdateLaunchStatus>,
        launch_id: Pubkey,
        status: LaunchStatus,
        final_market_cap: u64,
    ) -> Result<()> {
        let dev_account = &mut ctx.accounts.dev_account;
        let launch_record = &mut ctx.accounts.launch_record;

        require!(
            launch_record.dev == dev_account.owner,
            ErrorCode::Unauthorized
        );

        launch_record.status = status;
        launch_record.final_market_cap = final_market_cap;

        // 更新 Dev 评分
        match status {
            LaunchStatus::Graduated => {
                dev_account.successful_launches += 1;
                update_reputation_score(dev_account, true)?;
            }
            LaunchStatus::Rugged => {
                dev_account.rug_count += 1;
                update_reputation_score(dev_account, false)?;
            }
            _ => {}
        }

        msg!("Launch status updated: {:?}", status);
        Ok(())
    }

    /// 申请红V认证
    pub fn request_verification(
        ctx: Context<RequestVerification>,
        stake_amount: u64,
    ) -> Result<()> {
        let dev_account = &mut ctx.accounts.dev_account;

        require!(
            dev_account.reputation_score >= 60,
            ErrorCode::InsufficientReputation
        );
        require!(
            stake_amount >= 10_000 * 1_000_000_000, // 10,000 POPCOW (9 decimals)
            ErrorCode::InsufficientStake
        );

        // 转移质押代币
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.verification_vault.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            stake_amount,
        )?;

        dev_account.verification_stake = stake_amount;
        dev_account.verification_requested = true;
        dev_account.verification_request_time = Clock::get()?.unix_timestamp;

        msg!("Verification requested with stake: {}", stake_amount);
        Ok(())
    }

    /// 批准红V认证（仅限管理员）
    pub fn approve_verification(
        ctx: Context<ApproveVerification>,
    ) -> Result<()> {
        let dev_account = &mut ctx.accounts.dev_account;

        require!(
            dev_account.verification_requested,
            ErrorCode::NoVerificationRequest
        );
        require!(
            dev_account.reputation_score >= 60,
            ErrorCode::InsufficientReputation
        );

        dev_account.is_verified = true;
        dev_account.verification_level = VerificationLevel::RedV;
        dev_account.verification_approved_time = Clock::get()?.unix_timestamp;

        msg!("Verification approved for dev: {}", dev_account.alias);
        Ok(())
    }

    /// 订阅 Dev（跟单）
    pub fn subscribe_dev(
        ctx: Context<SubscribeDev>,
        auto_trade: bool,
        max_trade_amount: u64,
    ) -> Result<()> {
        let subscription = &mut ctx.accounts.subscription;

        if subscription.subscriber == Pubkey::default() {
            subscription.subscriber = ctx.accounts.user.key();
            subscription.dev = ctx.accounts.dev_account.owner;
            subscription.subscribed_at = Clock::get()?.unix_timestamp;
            subscription.bump = ctx.bumps.subscription;
        }

        subscription.auto_trade = auto_trade;
        subscription.max_trade_amount = max_trade_amount;
        subscription.is_active = true;

        // 更新 Dev 订阅数
        ctx.accounts.dev_account.subscriber_count += 1;

        msg!("Subscribed to dev: {}", ctx.accounts.dev_account.alias);
        Ok(())
    }

    /// 取消订阅
    pub fn unsubscribe_dev(
        ctx: Context<UnsubscribeDev>,
    ) -> Result<()> {
        let subscription = &mut ctx.accounts.subscription;
        let dev_account = &mut ctx.accounts.dev_account;

        require!(
            subscription.subscriber == ctx.accounts.user.key(),
            ErrorCode::Unauthorized
        );

        subscription.is_active = false;
        dev_account.subscriber_count = dev_account.subscriber_count.saturating_sub(1);

        msg!("Unsubscribed from dev");
        Ok(())
    }

    /// 更新信誉评分（内部函数，也可由管理员调用）
    pub fn update_reputation_score(
        ctx: Context<UpdateReputation>,
        new_score: u8,
    ) -> Result<()> {
        let dev_account = &mut ctx.accounts.dev_account;
        dev_account.reputation_score = new_score.min(100);

        // 更新验证等级
        dev_account.verification_level = get_verification_level(dev_account.reputation_score);

        msg!("Reputation score updated to: {}", dev_account.reputation_score);
        Ok(())
    }

    /// 绑定社交身份（Gitcoin Passport / World ID）
    pub fn link_social_identity(
        ctx: Context<LinkSocialIdentity>,
        identity_type: SocialIdentityType,
        identity_id: String,
        proof_hash: [u8; 32],
    ) -> Result<()> {
        let dev_account = &mut ctx.accounts.dev_account;
        let social_identity = &mut ctx.accounts.social_identity;

        // 创建或更新社交身份记录
        if social_identity.dev == Pubkey::default() {
            social_identity.dev = dev_account.owner;
            social_identity.identity_type = identity_type;
            social_identity.identity_id = identity_id;
            social_identity.proof_hash = proof_hash;
            social_identity.verified_at = Clock::get()?.unix_timestamp;
            social_identity.is_verified = false; // 需要管理员验证
            social_identity.bump = ctx.bumps.social_identity;
        } else {
            // 更新现有记录
            social_identity.identity_type = identity_type;
            social_identity.identity_id = identity_id;
            social_identity.proof_hash = proof_hash;
            social_identity.verified_at = Clock::get()?.unix_timestamp;
            social_identity.is_verified = false;
        }

        msg!("Social identity linked: {:?}, id: {}", identity_type, identity_id);
        Ok(())
    }

    /// 验证社交身份（仅限管理员）
    pub fn verify_social_identity(
        ctx: Context<VerifySocialIdentity>,
        verified: bool,
    ) -> Result<()> {
        let dev_account = &mut ctx.accounts.dev_account;
        let social_identity = &mut ctx.accounts.social_identity;

        require!(
            social_identity.dev == dev_account.owner,
            ErrorCode::Unauthorized
        );

        social_identity.is_verified = verified;
        social_identity.verification_time = Some(Clock::get()?.unix_timestamp);

        // 如果验证通过，给予信誉加分
        if verified {
            let mut score = dev_account.reputation_score as i16;
            match social_identity.identity_type {
                SocialIdentityType::GitcoinPassport => {
                    score += 5; // Gitcoin Passport +5 分
                }
                SocialIdentityType::WorldID => {
                    score += 10; // World ID +10 分（真人验证）
                }
                SocialIdentityType::Other => {
                    score += 3; // 其他身份 +3 分
                }
            }
            dev_account.reputation_score = score.max(0).min(100) as u8;
            dev_account.verification_level = get_verification_level(dev_account.reputation_score);
        }

        msg!("Social identity verification: {}", verified);
        Ok(())
    }
}

// ============== 辅助函数 ==============

fn update_reputation_score(
    dev_account: &mut Account<DevAccount>,
    is_success: bool,
) -> Result<()> {
    let mut score = dev_account.reputation_score as i16;

    if is_success {
        // 成功发币：+5 分
        score += 5;
    } else {
        // Rug：-20 分
        score -= 20;
    }

    // 计算胜率加成
    if dev_account.total_launches > 0 {
        let win_rate = (dev_account.successful_launches as f64 / dev_account.total_launches as f64) * 100.0;
        if win_rate > 70.0 {
            score += 10; // 高胜率加成
        } else if win_rate > 50.0 {
            score += 5;
        }
    }

    // 限制在 0-100 之间
    dev_account.reputation_score = score.max(0).min(100) as u8;
    dev_account.verification_level = get_verification_level(dev_account.reputation_score);

    Ok(())
}

fn get_verification_level(score: u8) -> VerificationLevel {
    if score >= 95 {
        VerificationLevel::Diamond
    } else if score >= 80 {
        VerificationLevel::Platinum
    } else if score >= 60 {
        VerificationLevel::Gold
    } else if score >= 40 {
        VerificationLevel::Silver
    } else if score >= 20 {
        VerificationLevel::Bronze
    } else {
        VerificationLevel::Unranked
    }
}

// ============== 账户结构 ==============

#[derive(Accounts)]
pub struct RegisterDev<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + DevAccount::INIT_SPACE,
        seeds = [b"dev", authority.key().as_ref()],
        bump
    )]
    pub dev_account: Account<'info, DevAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordLaunch<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"dev", authority.key().as_ref()],
        bump = dev_account.bump
    )]
    pub dev_account: Account<'info, DevAccount>,

    #[account(
        init,
        payer = authority,
        space = 8 + LaunchRecord::INIT_SPACE,
        seeds = [b"launch", token_address.key().as_ref(), &chain_id.to_le_bytes()],
        bump
    )]
    pub launch_record: Account<'info, LaunchRecord>,

    /// CHECK: Token address
    pub token_address: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateLaunchStatus<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"dev", dev_account.owner.as_ref()],
        bump = dev_account.bump
    )]
    pub dev_account: Account<'info, DevAccount>,

    #[account(
        mut,
        seeds = [b"launch", launch_record.token_address.as_ref(), &launch_record.chain_id.to_le_bytes()],
        bump = launch_record.bump
    )]
    pub launch_record: Account<'info, LaunchRecord>,

    /// CHECK: Oracle or admin
    pub oracle: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct RequestVerification<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"dev", authority.key().as_ref()],
        bump = dev_account.bump
    )]
    pub dev_account: Account<'info, DevAccount>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"verification_vault"],
        bump
    )]
    pub verification_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ApproveVerification<'info> {
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"dev", dev_account.owner.as_ref()],
        bump = dev_account.bump
    )]
    pub dev_account: Account<'info, DevAccount>,

    /// CHECK: Admin authority
    pub admin_authority: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct SubscribeDev<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"dev", dev_account.owner.as_ref()],
        bump = dev_account.bump
    )]
    pub dev_account: Account<'info, DevAccount>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + Subscription::INIT_SPACE,
        seeds = [b"subscription", user.key().as_ref(), dev_account.owner.as_ref()],
        bump
    )]
    pub subscription: Account<'info, Subscription>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UnsubscribeDev<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"dev", dev_account.owner.as_ref()],
        bump = dev_account.bump
    )]
    pub dev_account: Account<'info, DevAccount>,

    #[account(
        mut,
        seeds = [b"subscription", user.key().as_ref(), dev_account.owner.as_ref()],
        bump = subscription.bump,
        constraint = subscription.subscriber == user.key() @ ErrorCode::Unauthorized
    )]
    pub subscription: Account<'info, Subscription>,
}

#[derive(Accounts)]
pub struct UpdateReputation<'info> {
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"dev", dev_account.owner.as_ref()],
        bump = dev_account.bump
    )]
    pub dev_account: Account<'info, DevAccount>,

    /// CHECK: Admin authority
    pub admin_authority: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct LinkSocialIdentity<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"dev", authority.key().as_ref()],
        bump = dev_account.bump
    )]
    pub dev_account: Account<'info, DevAccount>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + SocialIdentity::INIT_SPACE,
        seeds = [b"social_identity", dev_account.owner.as_ref()],
        bump
    )]
    pub social_identity: Account<'info, SocialIdentity>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifySocialIdentity<'info> {
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"dev", dev_account.owner.as_ref()],
        bump = dev_account.bump
    )]
    pub dev_account: Account<'info, DevAccount>,

    #[account(
        mut,
        seeds = [b"social_identity", dev_account.owner.as_ref()],
        bump = social_identity.bump
    )]
    pub social_identity: Account<'info, SocialIdentity>,

    /// CHECK: Admin authority
    pub admin_authority: AccountInfo<'info>,
}

// ============== 数据结构 ==============

#[account]
#[derive(InitSpace)]
pub struct DevAccount {
    pub owner: Pubkey,
    #[max_len(50)]
    pub alias: String,
    pub reputation_score: u8,        // 0-100
    pub verification_level: VerificationLevel,
    pub total_launches: u32,
    pub successful_launches: u32,
    pub rug_count: u32,
    pub total_volume: u64,
    pub is_verified: bool,
    pub verification_stake: u64,
    pub verification_requested: bool,
    pub verification_request_time: i64,
    pub verification_approved_time: i64,
    pub subscriber_count: u32,
    pub created_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct LaunchRecord {
    pub dev: Pubkey,
    pub token_address: Pubkey,
    pub chain_id: u16,
    pub launch_time: i64,
    pub initial_liquidity: u64,
    pub initial_market_cap: u64,
    pub status: LaunchStatus,
    pub ath_market_cap: u64,
    pub current_market_cap: u64,
    pub final_market_cap: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Subscription {
    pub subscriber: Pubkey,
    pub dev: Pubkey,
    pub subscribed_at: i64,
    pub auto_trade: bool,
    pub max_trade_amount: u64,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct SocialIdentity {
    pub dev: Pubkey,
    pub identity_type: SocialIdentityType,
    #[max_len(100)]
    pub identity_id: String,
    pub proof_hash: [u8; 32],
    pub verified_at: i64,
    pub is_verified: bool,
    pub verification_time: Option<i64>,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum VerificationLevel {
    Unranked,   // < 20
    Bronze,     // 20-39
    Silver,     // 40-59
    Gold,       // 60-79
    Platinum,   // 80-94
    Diamond,    // 95-100
    RedV,       // 红V认证
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum LaunchStatus {
    Active,
    Graduated,
    Rugged,
    Dead,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum SocialIdentityType {
    GitcoinPassport,
    WorldID,
    Other,
}

// ============== 错误码 ==============

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Insufficient reputation score")]
    InsufficientReputation,
    #[msg("Insufficient stake for verification")]
    InsufficientStake,
    #[msg("No verification request found")]
    NoVerificationRequest,
}
