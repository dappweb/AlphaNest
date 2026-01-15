use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("11111111111111111111111111111111"); // TODO: 部署后更新

#[program]
pub mod popcow_staking {
    use super::*;

    /// 初始化质押池
    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        pool_id: u8,
        lock_period: i64,
        apy: u16,
        multiplier: u16,
        early_withdraw_penalty: u16,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.pump_token_mint = ctx.accounts.pump_token_mint.key();
        pool.reward_token_mint = ctx.accounts.reward_token_mint.key();
        pool.pool_id = pool_id;
        pool.lock_period = lock_period;
        pool.apy = apy;
        pool.multiplier = multiplier;
        pool.early_withdraw_penalty = early_withdraw_penalty;
        pool.total_staked = 0;
        pool.total_stakers = 0;
        pool.total_rewards_distributed = 0;
        pool.bump = ctx.bumps.pool;
        
        Ok(())
    }

    /// 质押 Pump 代币
    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount > 0, StakingError::InvalidAmount);

        let pool = &mut ctx.accounts.pool;
        let user_stake = &mut ctx.accounts.user_stake;
        let clock = Clock::get()?;

        // 转移代币到金库
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.pool_vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // 更新用户质押信息
        if user_stake.amount == 0 {
            user_stake.owner = ctx.accounts.user.key();
            user_stake.pool = pool.key();
            user_stake.start_time = clock.unix_timestamp;
            user_stake.last_claim_time = clock.unix_timestamp;
            pool.total_stakers += 1;
        } else {
            // 先结算之前的奖励
            let pending = calculate_pending_rewards(user_stake, pool, clock.unix_timestamp);
            user_stake.pending_rewards += pending;
        }

        user_stake.amount += amount;
        pool.total_staked += amount;

        emit!(StakeEvent {
            user: ctx.accounts.user.key(),
            pool_id: pool.pool_id,
            amount,
            total_staked: user_stake.amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// 解除质押
    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let user_stake = &mut ctx.accounts.user_stake;
        let clock = Clock::get()?;

        require!(amount > 0, StakingError::InvalidAmount);
        require!(user_stake.amount >= amount, StakingError::InsufficientStake);

        // 检查锁仓期
        let staking_duration = clock.unix_timestamp - user_stake.start_time;
        let mut penalty_amount: u64 = 0;

        if pool.lock_period > 0 && staking_duration < pool.lock_period {
            // 提前解锁，计算惩罚
            penalty_amount = amount * pool.early_withdraw_penalty as u64 / 10000;
        }

        let withdraw_amount = amount - penalty_amount;

        // 结算奖励
        let pending = calculate_pending_rewards(user_stake, pool, clock.unix_timestamp);
        user_stake.pending_rewards += pending;
        user_stake.last_claim_time = clock.unix_timestamp;

        // 从金库转出代币
        let seeds = &[
            b"pool".as_ref(),
            &[pool.pool_id],
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: pool.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, withdraw_amount)?;

        // 更新状态
        user_stake.amount -= amount;
        pool.total_staked -= amount;

        if user_stake.amount == 0 {
            pool.total_stakers -= 1;
        }

        emit!(UnstakeEvent {
            user: ctx.accounts.user.key(),
            pool_id: pool.pool_id,
            amount,
            penalty: penalty_amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// 领取奖励
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let user_stake = &mut ctx.accounts.user_stake;
        let clock = Clock::get()?;

        // 计算待领取奖励
        let pending = calculate_pending_rewards(user_stake, pool, clock.unix_timestamp);
        let total_rewards = user_stake.pending_rewards + pending;

        require!(total_rewards > 0, StakingError::NoRewardsToClaim);

        // 铸造奖励代币给用户
        let seeds = &[
            b"pool".as_ref(),
            &[pool.pool_id],
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = token::MintTo {
            mint: ctx.accounts.reward_token_mint.to_account_info(),
            to: ctx.accounts.user_reward_account.to_account_info(),
            authority: pool.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::mint_to(cpi_ctx, total_rewards)?;

        // 更新状态
        user_stake.pending_rewards = 0;
        user_stake.last_claim_time = clock.unix_timestamp;
        pool.total_rewards_distributed += total_rewards;

        emit!(ClaimEvent {
            user: ctx.accounts.user.key(),
            pool_id: pool.pool_id,
            amount: total_rewards,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}

/// 计算待领取奖励
fn calculate_pending_rewards(
    user_stake: &UserStake,
    pool: &StakingPool,
    current_time: i64,
) -> u64 {
    if user_stake.amount == 0 {
        return 0;
    }

    let duration = (current_time - user_stake.last_claim_time) as u64;
    let seconds_per_year: u64 = 365 * 24 * 60 * 60;
    
    // rewards = amount * apy * multiplier * duration / (seconds_per_year * 10000 * 100)
    let rewards = user_stake.amount
        .checked_mul(pool.apy as u64)
        .unwrap_or(0)
        .checked_mul(pool.multiplier as u64)
        .unwrap_or(0)
        .checked_mul(duration)
        .unwrap_or(0)
        .checked_div(seconds_per_year * 10000 * 100)
        .unwrap_or(0);

    rewards
}

#[derive(Accounts)]
#[instruction(pool_id: u8)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + StakingPool::INIT_SPACE,
        seeds = [b"pool", &[pool_id]],
        bump
    )]
    pub pool: Account<'info, StakingPool>,

    pub pump_token_mint: Account<'info, Mint>,
    pub reward_token_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        token::mint = pump_token_mint,
        token::authority = pool,
        seeds = [b"vault", &[pool_id]],
        bump
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub pool: Account<'info, StakingPool>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserStake::INIT_SPACE,
        seeds = [b"user_stake", user.key().as_ref(), pool.key().as_ref()],
        bump
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(
        mut,
        constraint = user_token_account.mint == pool.pump_token_mint,
        constraint = user_token_account.owner == user.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault", &[pool.pool_id]],
        bump
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub pool: Account<'info, StakingPool>,

    #[account(
        mut,
        seeds = [b"user_stake", user.key().as_ref(), pool.key().as_ref()],
        bump,
        constraint = user_stake.owner == user.key()
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(
        mut,
        constraint = user_token_account.mint == pool.pump_token_mint,
        constraint = user_token_account.owner == user.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault", &[pool.pool_id]],
        bump
    )]
    pub pool_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub pool: Account<'info, StakingPool>,

    #[account(
        mut,
        seeds = [b"user_stake", user.key().as_ref(), pool.key().as_ref()],
        bump,
        constraint = user_stake.owner == user.key()
    )]
    pub user_stake: Account<'info, UserStake>,

    #[account(
        mut,
        constraint = reward_token_mint.key() == pool.reward_token_mint
    )]
    pub reward_token_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = user_reward_account.mint == pool.reward_token_mint,
        constraint = user_reward_account.owner == user.key()
    )]
    pub user_reward_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct StakingPool {
    pub authority: Pubkey,
    pub pump_token_mint: Pubkey,
    pub reward_token_mint: Pubkey,
    pub pool_id: u8,
    pub lock_period: i64,
    pub apy: u16,              // 基点，5000 = 50%
    pub multiplier: u16,       // 基点，10000 = 1x
    pub early_withdraw_penalty: u16, // 基点，1000 = 10%
    pub total_staked: u64,
    pub total_stakers: u64,
    pub total_rewards_distributed: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserStake {
    pub owner: Pubkey,
    pub pool: Pubkey,
    pub amount: u64,
    pub start_time: i64,
    pub last_claim_time: i64,
    pub pending_rewards: u64,
}

#[event]
pub struct StakeEvent {
    pub user: Pubkey,
    pub pool_id: u8,
    pub amount: u64,
    pub total_staked: u64,
    pub timestamp: i64,
}

#[event]
pub struct UnstakeEvent {
    pub user: Pubkey,
    pub pool_id: u8,
    pub amount: u64,
    pub penalty: u64,
    pub timestamp: i64,
}

#[event]
pub struct ClaimEvent {
    pub user: Pubkey,
    pub pool_id: u8,
    pub amount: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum StakingError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient stake")]
    InsufficientStake,
    #[msg("No rewards to claim")]
    NoRewardsToClaim,
    #[msg("Still in lock period")]
    StillInLockPeriod,
}
