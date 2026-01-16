use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("Cd2NZkSS5K4kqyWQcdaGv8deE8k75JrWjwU3byQRqEju");

#[program]
pub mod referral_system {
    use super::*;

    /// 初始化推荐系统
    pub fn initialize(
        ctx: Context<Initialize>,
        reward_token_mint: Pubkey,
    ) -> Result<()> {
        let system = &mut ctx.accounts.system;
        system.authority = ctx.accounts.authority.key();
        system.reward_token_mint = reward_token_mint;
        
        // 推荐奖励比例（基点，10000 = 100%）
        // 一级：10%，二级：5%，三级：2%
        system.level1_rate = 1000;  // 10%
        system.level2_rate = 500;   // 5%
        system.level3_rate = 200;   // 2%
        
        // PopCowDefi 持有加成
        system.tier1_threshold = 10_000 * 1_000_000_000;  // 10,000 PopCowDefi (+20%)
        system.tier2_threshold = 100_000 * 1_000_000_000; // 100,000 PopCowDefi (+50%)
        system.tier1_bonus = 200;   // +20%
        system.tier2_bonus = 500;    // +50%
        
        system.total_referrals = 0;
        system.total_rewards_distributed = 0;
        system.bump = ctx.bumps.system;

        msg!("Referral system initialized");
        Ok(())
    }

    /// 注册推荐关系
    pub fn register_referral(
        ctx: Context<RegisterReferral>,
        referrer: Pubkey,
    ) -> Result<()> {
        let referral_account = &mut ctx.accounts.referral_account;
        let referee = ctx.accounts.referee.key();

        require!(
            referrer != referee,
            ErrorCode::CannotReferSelf
        );

        // 检查是否已有推荐人
        require!(
            referral_account.referrer == Pubkey::default(),
            ErrorCode::AlreadyReferred
        );

        // 设置推荐关系
        referral_account.referee = referee;
        referral_account.referrer = referrer;
        referral_account.level = 1;
        referral_account.total_earned = 0;
        referral_account.referral_count = 0;
        referral_account.created_at = Clock::get()?.unix_timestamp;
        referral_account.bump = ctx.bumps.referral_account;

        // 更新推荐人的推荐数量
        if let Ok(referrer_account) = ctx.accounts.referrer_account.as_ref() {
            // 如果推荐人账户存在，更新其推荐数量
            // 注意：这里需要 mutable reference，但为了简化，我们通过单独的函数更新
        }

        ctx.accounts.system.total_referrals += 1;

        msg!("Referral registered: {} referred by {}", referee, referrer);
        Ok(())
    }

    /// 分发推荐奖励（在交易时调用）
    pub fn distribute_referral_reward(
        ctx: Context<DistributeReward>,
        trade_fee: u64,
    ) -> Result<()> {
        let trader = ctx.accounts.trader.key();
        let referral_account = &ctx.accounts.referral_account;
        
        require!(
            referral_account.referee == trader,
            ErrorCode::InvalidReferralAccount
        );

        let mut current_referrer = referral_account.referrer;
        let mut current_level = 1;
        let mut total_distributed = 0u64;

        // 分发三级推荐奖励
        for level in 1..=3 {
            if current_referrer == Pubkey::default() {
                break;
            }

            // 获取当前级别的奖励比例
            let base_rate = match level {
                1 => ctx.accounts.system.level1_rate,
                2 => ctx.accounts.system.level2_rate,
                3 => ctx.accounts.system.level3_rate,
                _ => 0,
            };

            // 计算基础奖励
            let base_reward = trade_fee
                .checked_mul(base_rate as u64)
                .unwrap()
                .checked_div(10000)
                .unwrap();

            // 检查推荐人的 PopCowDefi 持有量，应用加成
            let bonus_multiplier = get_bonus_multiplier(
                &ctx.accounts.system,
                current_referrer,
            )?;

            let final_reward = base_reward
                .checked_mul(bonus_multiplier as u64)
                .unwrap()
                .checked_div(100)
                .unwrap();

            // 转账奖励给推荐人
            let seeds = &[
                b"system",
                &[ctx.accounts.system.bump],
            ];
            let signer = &[&seeds[..]];

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.reward_vault.to_account_info(),
                        to: ctx.accounts.referrer_reward_account.to_account_info(),
                        authority: ctx.accounts.system.to_account_info(),
                    },
                    signer,
                ),
                final_reward,
            )?;

            total_distributed = total_distributed.checked_add(final_reward).unwrap();

            // 查找下一级推荐人
            // 注意：这里需要递归查找，简化实现中我们只处理一级
            // 实际实现中需要查找 referrer 的 referral_account
            break;
        }

        ctx.accounts.system.total_rewards_distributed = ctx.accounts.system
            .total_rewards_distributed
            .checked_add(total_distributed)
            .unwrap();

        msg!("Distributed {} reward to referrer", total_distributed);
        Ok(())
    }

    /// 更新推荐奖励比例（仅限管理员）
    pub fn update_referral_rates(
        ctx: Context<UpdateRates>,
        level1_rate: u16,
        level2_rate: u16,
        level3_rate: u16,
    ) -> Result<()> {
        let system = &mut ctx.accounts.system;
        
        require!(level1_rate <= 5000, ErrorCode::InvalidRate); // 最大 50%
        require!(level2_rate <= 3000, ErrorCode::InvalidRate); // 最大 30%
        require!(level3_rate <= 1000, ErrorCode::InvalidRate); // 最大 10%

        system.level1_rate = level1_rate;
        system.level2_rate = level2_rate;
        system.level3_rate = level3_rate;

        msg!("Referral rates updated: L1={}, L2={}, L3={}", level1_rate, level2_rate, level3_rate);
        Ok(())
    }

    /// 获取推荐统计
    pub fn get_referral_stats(
        ctx: Context<GetStats>,
    ) -> Result<ReferralStats> {
        let referral_account = &ctx.accounts.referral_account;
        
        Ok(ReferralStats {
            referrer: referral_account.referrer,
            referral_count: referral_account.referral_count,
            total_earned: referral_account.total_earned,
            level: referral_account.level,
        })
    }
}

// ============== 辅助函数 ==============

/// 获取 PopCowDefi 持有加成倍数
fn get_bonus_multiplier(
    system: &Account<ReferralSystem>,
    referrer: Pubkey,
) -> Result<u16> {
    // 简化实现：返回基础倍数
    // 实际实现中需要检查 referrer 的 PopCowDefi 持有量
    // 如果 >= tier2_threshold: 返回 100 + tier2_bonus
    // 如果 >= tier1_threshold: 返回 100 + tier1_bonus
    // 否则: 返回 100 (无加成)
    
    // TODO: 实现 PopCowDefi 持有量检查
    Ok(100) // 基础倍数，无加成
}

// ============== 账户结构 ==============

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + ReferralSystem::INIT_SPACE,
        seeds = [b"referral_system"],
        bump
    )]
    pub system: Account<'info, ReferralSystem>,

    /// CHECK: Reward token mint
    pub reward_token_mint: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterReferral<'info> {
    #[account(mut)]
    pub referee: Signer<'info>,

    #[account(
        init,
        payer = referee,
        space = 8 + ReferralAccount::INIT_SPACE,
        seeds = [b"referral", referee.key().as_ref()],
        bump
    )]
    pub referral_account: Account<'info, ReferralAccount>,

    /// CHECK: Referrer account (may not exist)
    pub referrer_account: Option<Account<'info, ReferralAccount>>,

    #[account(
        seeds = [b"referral_system"],
        bump = system.bump
    )]
    pub system: Account<'info, ReferralSystem>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DistributeReward<'info> {
    pub trader: Signer<'info>,

    #[account(
        seeds = [b"referral", trader.key().as_ref()],
        bump = referral_account.bump
    )]
    pub referral_account: Account<'info, ReferralAccount>,

    #[account(
        seeds = [b"referral_system"],
        bump = system.bump
    )]
    pub system: Account<'info, ReferralSystem>,

    #[account(mut)]
    pub reward_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub referrer_reward_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateRates<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"referral_system"],
        bump = system.bump,
        constraint = system.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub system: Account<'info, ReferralSystem>,
}

#[derive(Accounts)]
pub struct GetStats<'info> {
    #[account(
        seeds = [b"referral", referral_account.referee.as_ref()],
        bump = referral_account.bump
    )]
    pub referral_account: Account<'info, ReferralAccount>,
}

// ============== 数据结构 ==============

#[account]
#[derive(InitSpace)]
pub struct ReferralSystem {
    pub authority: Pubkey,
    pub reward_token_mint: Pubkey,
    
    // 推荐奖励比例（基点）
    pub level1_rate: u16,  // 一级：10% = 1000
    pub level2_rate: u16,  // 二级：5% = 500
    pub level3_rate: u16,  // 三级：2% = 200
    
    // PopCowDefi 持有加成
    pub tier1_threshold: u64,  // 10,000 PopCowDefi
    pub tier2_threshold: u64,  // 100,000 PopCowDefi
    pub tier1_bonus: u16,      // +20% = 200
    pub tier2_bonus: u16,      // +50% = 500
    
    pub total_referrals: u64,
    pub total_rewards_distributed: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ReferralAccount {
    pub referee: Pubkey,        // 被推荐人
    pub referrer: Pubkey,       // 推荐人
    pub level: u8,              // 推荐层级（1/2/3）
    pub total_earned: u64,      // 总收益
    pub referral_count: u32,    // 推荐人数
    pub created_at: i64,        // 创建时间
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ReferralStats {
    pub referrer: Pubkey,
    pub referral_count: u32,
    pub total_earned: u64,
    pub level: u8,
}

// ============== 错误码 ==============

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Cannot refer yourself")]
    CannotReferSelf,
    #[msg("Already has a referrer")]
    AlreadyReferred,
    #[msg("Invalid referral account")]
    InvalidReferralAccount,
    #[msg("Invalid referral rate")]
    InvalidRate,
}
