use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("4pMUmKCTvxCiM6ccGyc851yhyKnaKfJ3q2umLhyZ9Y2d");

#[program]
pub mod popcow_staking {
    use super::*;

    /// 初始化质押池
    /// 
    /// 兑换比例: 1 POPCOW = 2 PopCowDefi
    /// 即质押 1 POPCOW，每秒获得 2 PopCowDefi 的奖励率
    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        reward_rate_per_second: u64,  // 每秒奖励率 (基点)
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.stake_mint = ctx.accounts.stake_mint.key();
        pool.reward_mint = ctx.accounts.reward_mint.key();
        pool.stake_vault = ctx.accounts.stake_vault.key();
        pool.reward_vault = ctx.accounts.reward_vault.key();
        pool.total_staked = 0;
        pool.reward_rate_per_second = reward_rate_per_second;
        // 兑换比例: 1 POPCOW = 2 PopCowDefi (固定比例)
        pool.conversion_rate = 2;  // 1:2 比例
        pool.last_update_time = Clock::get()?.unix_timestamp;
        pool.reward_per_token_stored = 0;
        pool.is_paused = false;
        pool.bump = ctx.bumps.pool;

        msg!("Staking pool initialized with 1:2 conversion rate (1 POPCOW = 2 PopCowDefi)");
        Ok(())
    }

    /// 质押代币
    pub fn stake(
        ctx: Context<Stake>,
        amount: u64,
        lock_period: LockPeriod,
    ) -> Result<()> {
        require!(!ctx.accounts.pool.is_paused, ErrorCode::PoolPaused);
        require!(amount > 0, ErrorCode::InvalidAmount);

        let pool = &mut ctx.accounts.pool;
        let stake_account = &mut ctx.accounts.stake_account;
        let clock = Clock::get()?;

        // 更新奖励
        update_rewards(pool, stake_account, clock.unix_timestamp)?;

        // 转移代币到质押池
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_stake_token.to_account_info(),
                    to: ctx.accounts.stake_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        // 计算解锁时间
        let lock_duration = match lock_period {
            LockPeriod::Flexible => 0,
            LockPeriod::ThirtyDays => 30 * 86400,
            LockPeriod::NinetyDays => 90 * 86400,
            LockPeriod::OneEightyDays => 180 * 86400,
            LockPeriod::ThreeSixtyFiveDays => 365 * 86400,
        };

        // 更新质押账户
        if stake_account.staked_amount == 0 {
            stake_account.owner = ctx.accounts.user.key();
            stake_account.pool = ctx.accounts.pool.key();
            stake_account.lock_period = lock_period;
            stake_account.stake_time = clock.unix_timestamp;
            stake_account.unlock_time = clock.unix_timestamp + lock_duration;
            stake_account.bump = ctx.bumps.stake_account;
        } else {
            // 追加质押时，重新计算解锁时间
            stake_account.unlock_time = clock.unix_timestamp + lock_duration;
        }

        stake_account.staked_amount = stake_account.staked_amount.checked_add(amount).unwrap();
        pool.total_staked = pool.total_staked.checked_add(amount).unwrap();

        msg!("Staked {} tokens, lock period: {:?}", amount, lock_period);
        Ok(())
    }

    /// 解除质押
    pub fn unstake(
        ctx: Context<Unstake>,
        amount: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let stake_account = &mut ctx.accounts.stake_account;
        let clock = Clock::get()?;

        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(stake_account.staked_amount >= amount, ErrorCode::InsufficientStake);
        
        // 检查锁定期
        if stake_account.lock_period != LockPeriod::Flexible {
            require!(
                clock.unix_timestamp >= stake_account.unlock_time,
                ErrorCode::StillLocked
            );
        }

        // 更新奖励
        update_rewards(pool, stake_account, clock.unix_timestamp)?;

        // 转移代币回用户
        let seeds = &[
            b"pool".as_ref(),
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.stake_vault.to_account_info(),
                    to: ctx.accounts.user_stake_token.to_account_info(),
                    authority: ctx.accounts.pool.to_account_info(),
                },
                signer,
            ),
            amount,
        )?;

        stake_account.staked_amount = stake_account.staked_amount.checked_sub(amount).unwrap();
        pool.total_staked = pool.total_staked.checked_sub(amount).unwrap();

        msg!("Unstaked {} tokens", amount);
        Ok(())
    }

    /// 领取奖励
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let stake_account = &mut ctx.accounts.stake_account;
        let clock = Clock::get()?;

        // 更新奖励
        update_rewards(pool, stake_account, clock.unix_timestamp)?;

        let rewards = stake_account.pending_rewards;
        require!(rewards > 0, ErrorCode::NoRewards);

        // 转移奖励
        let seeds = &[
            b"pool".as_ref(),
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.reward_vault.to_account_info(),
                    to: ctx.accounts.user_reward_token.to_account_info(),
                    authority: ctx.accounts.pool.to_account_info(),
                },
                signer,
            ),
            rewards,
        )?;

        stake_account.pending_rewards = 0;
        stake_account.total_rewards_claimed = stake_account
            .total_rewards_claimed
            .checked_add(rewards)
            .unwrap();

        msg!("Claimed {} rewards", rewards);
        Ok(())
    }

    /// 紧急提取 (放弃奖励)
    pub fn emergency_unstake(ctx: Context<Unstake>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let stake_account = &mut ctx.accounts.stake_account;

        let amount = stake_account.staked_amount;
        require!(amount > 0, ErrorCode::NoStake);

        // 转移代币回用户 (无奖励)
        let seeds = &[
            b"pool".as_ref(),
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.stake_vault.to_account_info(),
                    to: ctx.accounts.user_stake_token.to_account_info(),
                    authority: ctx.accounts.pool.to_account_info(),
                },
                signer,
            ),
            amount,
        )?;

        stake_account.staked_amount = 0;
        stake_account.pending_rewards = 0;
        pool.total_staked = pool.total_staked.checked_sub(amount).unwrap();

        msg!("Emergency unstake: {} tokens (rewards forfeited)", amount);
        Ok(())
    }

    /// 添加奖励到池子 (仅限管理员)
    pub fn add_rewards(
        ctx: Context<AddRewards>,
        amount: u64,
    ) -> Result<()> {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.authority_reward_token.to_account_info(),
                    to: ctx.accounts.reward_vault.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;

        msg!("Added {} rewards to pool", amount);
        Ok(())
    }

    /// 更新奖励率 (仅限管理员)
    pub fn update_reward_rate(
        ctx: Context<UpdatePool>,
        new_rate: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let clock = Clock::get()?;

        // 先更新当前奖励
        if pool.total_staked > 0 {
            let time_elapsed = clock.unix_timestamp - pool.last_update_time;
            let reward = (time_elapsed as u128)
                .checked_mul(pool.reward_rate_per_second as u128)
                .unwrap()
                .checked_mul(1e18 as u128)
                .unwrap()
                .checked_div(pool.total_staked as u128)
                .unwrap();
            pool.reward_per_token_stored = pool
                .reward_per_token_stored
                .checked_add(reward)
                .unwrap();
        }
        pool.last_update_time = clock.unix_timestamp;
        pool.reward_rate_per_second = new_rate;

        msg!("Reward rate updated to {}", new_rate);
        Ok(())
    }

    /// 暂停/恢复池子 (仅限管理员)
    pub fn set_pool_paused(
        ctx: Context<UpdatePool>,
        paused: bool,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.is_paused = paused;

        msg!("Pool paused: {}", paused);
        Ok(())
    }
}

// ============== 辅助函数 ==============

fn update_rewards(
    pool: &mut Account<StakingPool>,
    stake_account: &mut Account<StakeAccount>,
    current_time: i64,
) -> Result<()> {
    // 更新全局奖励
    if pool.total_staked > 0 {
        let time_elapsed = current_time - pool.last_update_time;
        if time_elapsed > 0 {
            // 根据锁定期计算奖励倍数
            let multiplier = get_reward_multiplier(stake_account.lock_period);
            
            // 应用 1:2 兑换比例
            // 1 POPCOW 质押 = 2 PopCowDefi 奖励率
            let base_reward_rate = pool.reward_rate_per_second
                .checked_mul(pool.conversion_rate as u64)
                .unwrap();
            
            let reward = (time_elapsed as u128)
                .checked_mul(base_reward_rate as u128)
                .unwrap()
                .checked_mul(1e18 as u128)
                .unwrap()
                .checked_div(pool.total_staked as u128)
                .unwrap();
            pool.reward_per_token_stored = pool
                .reward_per_token_stored
                .checked_add(reward)
                .unwrap();
        }
    }
    pool.last_update_time = current_time;

    // 更新用户奖励
    if stake_account.staked_amount > 0 {
        let multiplier = get_reward_multiplier(stake_account.lock_period);
        
        // 计算基础奖励（已包含 1:2 比例）
        let base_earned = (stake_account.staked_amount as u128)
            .checked_mul(
                pool.reward_per_token_stored
                    .checked_sub(stake_account.reward_per_token_paid)
                    .unwrap(),
            )
            .unwrap();
        
        // 应用锁定期倍数
        let earned = base_earned
            .checked_mul(multiplier as u128)
            .unwrap()
            .checked_div(100)
            .unwrap()
            .checked_div(1e18 as u128)
            .unwrap();
            
        stake_account.pending_rewards = stake_account
            .pending_rewards
            .checked_add(earned as u64)
            .unwrap();
    }
    stake_account.reward_per_token_paid = pool.reward_per_token_stored;

    Ok(())
}

fn get_reward_multiplier(lock_period: LockPeriod) -> u64 {
    match lock_period {
        LockPeriod::Flexible => 100,          // 1x (5% APY)
        LockPeriod::ThirtyDays => 240,        // 2.4x (12% APY)
        LockPeriod::NinetyDays => 400,        // 4x (20% APY)
        LockPeriod::OneEightyDays => 700,     // 7x (35% APY)
        LockPeriod::ThreeSixtyFiveDays => 1000, // 10x (50% APY)
    }
}

// ============== 账户结构 ==============

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + StakingPool::INIT_SPACE,
        seeds = [b"pool"],
        bump
    )]
    pub pool: Account<'info, StakingPool>,

    pub stake_mint: Account<'info, Mint>,
    pub reward_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        token::mint = stake_mint,
        token::authority = pool,
        seeds = [b"stake_vault"],
        bump
    )]
    pub stake_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        token::mint = reward_mint,
        token::authority = pool,
        seeds = [b"reward_vault"],
        bump
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool"],
        bump = pool.bump
    )]
    pub pool: Account<'info, StakingPool>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + StakeAccount::INIT_SPACE,
        seeds = [b"stake", user.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(mut)]
    pub user_stake_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"stake_vault"],
        bump
    )]
    pub stake_vault: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool"],
        bump = pool.bump
    )]
    pub pool: Account<'info, StakingPool>,

    #[account(
        mut,
        seeds = [b"stake", user.key().as_ref()],
        bump = stake_account.bump,
        constraint = stake_account.owner == user.key() @ ErrorCode::Unauthorized
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(mut)]
    pub user_stake_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"stake_vault"],
        bump
    )]
    pub stake_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool"],
        bump = pool.bump
    )]
    pub pool: Account<'info, StakingPool>,

    #[account(
        mut,
        seeds = [b"stake", user.key().as_ref()],
        bump = stake_account.bump,
        constraint = stake_account.owner == user.key() @ ErrorCode::Unauthorized
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(mut)]
    pub user_reward_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"reward_vault"],
        bump
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AddRewards<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"pool"],
        bump = pool.bump,
        constraint = pool.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub pool: Account<'info, StakingPool>,

    #[account(mut)]
    pub authority_reward_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"reward_vault"],
        bump
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdatePool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool"],
        bump = pool.bump,
        constraint = pool.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub pool: Account<'info, StakingPool>,
}

// ============== 数据结构 ==============

#[account]
#[derive(InitSpace)]
pub struct StakingPool {
    pub authority: Pubkey,
    pub stake_mint: Pubkey,           // POPCOW token mint
    pub reward_mint: Pubkey,          // PopCowDefi token mint
    pub stake_vault: Pubkey,
    pub reward_vault: Pubkey,
    pub total_staked: u64,
    pub reward_rate_per_second: u64,  // 每秒奖励率（基础）
    pub conversion_rate: u8,          // 兑换比例: 1 POPCOW = 2 PopCowDefi
    pub last_update_time: i64,
    pub reward_per_token_stored: u128,
    pub is_paused: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct StakeAccount {
    pub owner: Pubkey,
    pub pool: Pubkey,
    pub staked_amount: u64,
    pub lock_period: LockPeriod,
    pub stake_time: i64,
    pub unlock_time: i64,
    pub pending_rewards: u64,
    pub total_rewards_claimed: u64,
    pub reward_per_token_paid: u128,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum LockPeriod {
    Flexible,           // 灵活质押 - 5% APY
    ThirtyDays,         // 30天锁定 - 12% APY
    NinetyDays,         // 90天锁定 - 20% APY
    OneEightyDays,      // 180天锁定 - 35% APY
    ThreeSixtyFiveDays, // 365天锁定 - 50% APY
}

// ============== 错误码 ==============

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Pool is paused")]
    PoolPaused,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient stake")]
    InsufficientStake,
    #[msg("Tokens are still locked")]
    StillLocked,
    #[msg("No rewards to claim")]
    NoRewards,
    #[msg("No stake to withdraw")]
    NoStake,
}
