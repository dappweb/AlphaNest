use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("MultiAssetStake1111111111111111111111111111111");

#[program]
pub mod multi_asset_staking {
    use super::*;

    /// 初始化多资产质押池
    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        price_oracle: Pubkey,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.reward_mint = ctx.accounts.reward_mint.key();
        pool.price_oracle = price_oracle;
        pool.total_staked_value_usd = 0;
        pool.reward_rate_per_second = 1000; // 基础奖励率
        pool.conversion_rate = 1; // 统一按 USD 价值计算
        pool.last_update_time = Clock::get()?.unix_timestamp;
        pool.reward_per_token_stored = 0;
        pool.is_paused = false;
        pool.bump = ctx.bumps.pool;
        
        // 资金分配比例（基点，10000 = 100%）
        pool.dev_fund_ratio = 4000;      // 40% 开发资金
        pool.liquidity_ratio = 3000;      // 30% 流动性
        pool.reward_ratio = 2000;         // 20% 奖励池
        pool.reserve_ratio = 1000;       // 10% 储备
        
        msg!("Multi-asset staking pool initialized");
        Ok(())
    }

    /// 质押 SOL
    pub fn stake_sol(
        ctx: Context<StakeSol>,
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

        // 获取 SOL 价格（USD）
        let sol_price = get_sol_price_usd(&ctx.accounts.price_oracle)?;
        
        // 计算质押价值（USD，保留 6 位小数）
        let stake_value_usd = (amount as u128)
            .checked_mul(sol_price as u128)
            .unwrap()
            .checked_div(1_000_000_000) // SOL 有 9 位小数
            .unwrap()
            .checked_div(1_000_000) // 转换为 USD（6 位小数）
            .unwrap();

        // 转移 SOL 到金库
        **ctx.accounts.sol_vault.to_account_info().try_borrow_mut_lamports()? += amount;
        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? -= amount;

        // 计算锁定期
        let lock_duration = get_lock_duration(lock_period);
        
        // 创建或更新质押账户
        if stake_account.staked_value_usd == 0 {
            stake_account.owner = ctx.accounts.user.key();
            stake_account.pool = ctx.accounts.pool.key();
            stake_account.asset_type = AssetType::SOL;
            stake_account.lock_period = lock_period;
            stake_account.stake_time = clock.unix_timestamp;
            stake_account.bump = ctx.bumps.stake_account;
        }
        
        stake_account.staked_value_usd += stake_value_usd as u64;
        stake_account.unlock_time = clock.unix_timestamp + lock_duration;
        pool.total_staked_value_usd += stake_value_usd as u64;

        // 检查早鸟奖励
        let days_since_launch = (clock.unix_timestamp - pool.launch_time) / 86400;
        if days_since_launch <= 30 {
            stake_account.early_bird_bonus = get_early_bird_bonus(days_since_launch as u8);
        }

        msg!("Staked {} SOL (${} USD), lock period: {:?}", 
             amount, stake_value_usd, lock_period);
        Ok(())
    }

    /// 质押 USDC
    pub fn stake_usdc(
        ctx: Context<StakeUSDC>,
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

        // USDC 是稳定币，1 USDC = 1 USD（6 位小数）
        let stake_value_usd = amount / 1_000_000; // 转换为 USD

        // 转移 USDC 到金库
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_usdc_account.to_account_info(),
                    to: ctx.accounts.usdc_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        // 计算锁定期
        let lock_duration = get_lock_duration(lock_period);
        
        // 创建或更新质押账户
        if stake_account.staked_value_usd == 0 {
            stake_account.owner = ctx.accounts.user.key();
            stake_account.pool = ctx.accounts.pool.key();
            stake_account.asset_type = AssetType::USDC;
            stake_account.lock_period = lock_period;
            stake_account.stake_time = clock.unix_timestamp;
            stake_account.bump = ctx.bumps.stake_account;
        }
        
        stake_account.staked_value_usd += stake_value_usd;
        stake_account.unlock_time = clock.unix_timestamp + lock_duration;
        pool.total_staked_value_usd += stake_value_usd as u64;

        // 检查早鸟奖励
        let days_since_launch = (clock.unix_timestamp - pool.launch_time) / 86400;
        if days_since_launch <= 30 {
            stake_account.early_bird_bonus = get_early_bird_bonus(days_since_launch as u8);
        }

        msg!("Staked {} USDC (${} USD), lock period: {:?}", 
             amount / 1_000_000, stake_value_usd, lock_period);
        Ok(())
    }

    /// 质押 USDT
    pub fn stake_usdt(
        ctx: Context<StakeUSDT>,
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

        // USDT 是稳定币，1 USDT = 1 USD（6 位小数）
        let stake_value_usd = amount / 1_000_000;

        // 转移 USDT 到金库
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_usdt_account.to_account_info(),
                    to: ctx.accounts.usdt_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        // 计算锁定期
        let lock_duration = get_lock_duration(lock_period);
        
        // 创建或更新质押账户
        if stake_account.staked_value_usd == 0 {
            stake_account.owner = ctx.accounts.user.key();
            stake_account.pool = ctx.accounts.pool.key();
            stake_account.asset_type = AssetType::USDT;
            stake_account.lock_period = lock_period;
            stake_account.stake_time = clock.unix_timestamp;
            stake_account.bump = ctx.bumps.stake_account;
        }
        
        stake_account.staked_value_usd += stake_value_usd;
        stake_account.unlock_time = clock.unix_timestamp + lock_duration;
        pool.total_staked_value_usd += stake_value_usd as u64;

        // 检查早鸟奖励
        let days_since_launch = (clock.unix_timestamp - pool.launch_time) / 86400;
        if days_since_launch <= 30 {
            stake_account.early_bird_bonus = get_early_bird_bonus(days_since_launch as u8);
        }

        msg!("Staked {} USDT (${} USD), lock period: {:?}", 
             amount / 1_000_000, stake_value_usd, lock_period);
        Ok(())
    }

    /// 质押 POPCOW
    pub fn stake_popcow(
        ctx: Context<StakePOPCOW>,
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

        // 获取 POPCOW 价格（USD）
        let popcow_price = get_popcow_price_usd(&ctx.accounts.price_oracle)?;
        
        // 计算质押价值（USD）
        let stake_value_usd = (amount as u128)
            .checked_mul(popcow_price as u128)
            .unwrap()
            .checked_div(1_000_000_000) // POPCOW 有 9 位小数
            .unwrap()
            .checked_div(1_000_000) // 转换为 USD
            .unwrap();

        // 转移 POPCOW 到金库
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_popcow_account.to_account_info(),
                    to: ctx.accounts.popcow_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        // 计算锁定期
        let lock_duration = get_lock_duration(lock_period);
        
        // 创建或更新质押账户
        if stake_account.staked_value_usd == 0 {
            stake_account.owner = ctx.accounts.user.key();
            stake_account.pool = ctx.accounts.pool.key();
            stake_account.asset_type = AssetType::POPCOW;
            stake_account.lock_period = lock_period;
            stake_account.stake_time = clock.unix_timestamp;
            stake_account.bump = ctx.bumps.stake_account;
        }
        
        stake_account.staked_value_usd += stake_value_usd as u64;
        stake_account.unlock_time = clock.unix_timestamp + lock_duration;
        pool.total_staked_value_usd += stake_value_usd as u64;

        // POPCOW 质押有 2x 奖励加成
        stake_account.reward_multiplier = 200; // 2x

        msg!("Staked {} POPCOW (${} USD), lock period: {:?}", 
             amount, stake_value_usd, lock_period);
        Ok(())
    }

    /// 解除质押
    pub fn unstake(
        ctx: Context<Unstake>,
        amount_usd: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let stake_account = &mut ctx.accounts.stake_account;
        let clock = Clock::get()?;

        require!(amount_usd > 0, ErrorCode::InvalidAmount);
        require!(stake_account.staked_value_usd >= amount_usd, ErrorCode::InsufficientStake);
        
        // 检查锁定期
        if stake_account.lock_period != LockPeriod::Flexible {
            require!(
                clock.unix_timestamp >= stake_account.unlock_time,
                ErrorCode::StillLocked
            );
        }

        // 更新奖励
        update_rewards(pool, stake_account, clock.unix_timestamp)?;

        // 根据资产类型提取
        match stake_account.asset_type {
            AssetType::SOL => {
                let sol_price = get_sol_price_usd(&ctx.accounts.price_oracle)?;
                let sol_amount = (amount_usd as u128)
                    .checked_mul(1_000_000_000)
                    .unwrap()
                    .checked_mul(1_000_000)
                    .unwrap()
                    .checked_div(sol_price as u128)
                    .unwrap();
                
                **ctx.accounts.sol_vault.to_account_info().try_borrow_mut_lamports()? -= sol_amount as u64;
                **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? += sol_amount as u64;
            }
            AssetType::USDC => {
                let usdc_amount = amount_usd * 1_000_000;
                let seeds = &[
                    b"usdc_vault",
                    &[ctx.accounts.pool.bump],
                ];
                let signer = &[&seeds[..]];
                
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.usdc_vault.to_account_info(),
                            to: ctx.accounts.user_usdc_account.to_account_info(),
                            authority: ctx.accounts.usdc_vault.to_account_info(),
                        },
                        signer,
                    ),
                    usdc_amount,
                )?;
            }
            AssetType::USDT => {
                let usdt_amount = amount_usd * 1_000_000;
                let seeds = &[
                    b"usdt_vault",
                    &[ctx.accounts.pool.bump],
                ];
                let signer = &[&seeds[..]];
                
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.usdt_vault.to_account_info(),
                            to: ctx.accounts.user_usdt_account.to_account_info(),
                            authority: ctx.accounts.usdt_vault.to_account_info(),
                        },
                        signer,
                    ),
                    usdt_amount,
                )?;
            }
            AssetType::POPCOW => {
                let popcow_price = get_popcow_price_usd(&ctx.accounts.price_oracle)?;
                let popcow_amount = (amount_usd as u128)
                    .checked_mul(1_000_000_000)
                    .unwrap()
                    .checked_mul(1_000_000)
                    .unwrap()
                    .checked_div(popcow_price as u128)
                    .unwrap();
                
                let seeds = &[
                    b"popcow_vault",
                    &[ctx.accounts.pool.bump],
                ];
                let signer = &[&seeds[..]];
                
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.popcow_vault.to_account_info(),
                            to: ctx.accounts.user_popcow_account.to_account_info(),
                            authority: ctx.accounts.popcow_vault.to_account_info(),
                        },
                        signer,
                    ),
                    popcow_amount as u64,
                )?;
            }
            AssetType::Custom(token_mint) => {
                // 自定义代币提取
                // 需要从 token_config 获取代币信息
                // 这里简化处理，实际需要查询 token_config
                msg!("Unstaking custom token: {}", token_mint);
                // 实际实现需要根据 token_config 计算数量并转账
            }
        }

        stake_account.staked_value_usd -= amount_usd;
        pool.total_staked_value_usd -= amount_usd as u64;

        msg!("Unstaked ${} USD", amount_usd);
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
            b"pool",
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

    /// 每日资金分配（仅限管理员）
    pub fn daily_fund_allocation(
        ctx: Context<DailyAllocation>,
    ) -> Result<()> {
        let pool = &ctx.accounts.pool;
        
        // 计算总资金价值（USD）
        let total_sol = ctx.accounts.sol_vault.lamports();
        let total_usdc = ctx.accounts.usdc_vault.amount / 1_000_000;
        let total_usdt = ctx.accounts.usdt_vault.amount / 1_000_000;
        
        let sol_price = get_sol_price_usd(&ctx.accounts.price_oracle)?;
        let sol_value_usd = (total_sol as u128)
            .checked_mul(sol_price as u128)
            .unwrap()
            .checked_div(1_000_000_000)
            .unwrap()
            .checked_div(1_000_000)
            .unwrap();
        
        let total_value_usd = sol_value_usd as u64 + total_usdc + total_usdt;
        
        // 按比例分配
        let dev_fund = total_value_usd * pool.dev_fund_ratio / 10000;
        let liquidity_fund = total_value_usd * pool.liquidity_ratio / 10000;
        let reward_fund = total_value_usd * pool.reward_ratio / 10000;
        let reserve_fund = total_value_usd * pool.reserve_ratio / 10000;
        
        msg!("Daily allocation: Dev=${}, Liquidity=${}, Reward=${}, Reserve=${}", 
             dev_fund, liquidity_fund, reward_fund, reserve_fund);
        
        // 实际转账需要多签钱包执行，这里只记录
        Ok(())
    }

    /// 添加奖励到池子
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

    /// 更新奖励率
    pub fn update_reward_rate(
        ctx: Context<UpdatePool>,
        new_rate: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        let clock = Clock::get()?;

        // 先更新当前奖励
        if pool.total_staked_value_usd > 0 {
            let time_elapsed = clock.unix_timestamp - pool.last_update_time;
            if time_elapsed > 0 {
                let reward = (time_elapsed as u128)
                    .checked_mul(pool.reward_rate_per_second as u128)
                    .unwrap()
                    .checked_mul(1e18 as u128)
                    .unwrap()
                    .checked_div(pool.total_staked_value_usd as u128)
                    .unwrap();
                pool.reward_per_token_stored = pool
                    .reward_per_token_stored
                    .checked_add(reward)
                    .unwrap();
            }
        }
        pool.last_update_time = clock.unix_timestamp;
        pool.reward_rate_per_second = new_rate;

        msg!("Reward rate updated to {}", new_rate);
        Ok(())
    }

    /// 暂停/恢复池子
    pub fn set_pool_paused(
        ctx: Context<UpdatePool>,
        paused: bool,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.is_paused = paused;

        msg!("Pool paused: {}", paused);
        Ok(())
    }

    /// 添加新的质押代币品种（仅限管理员）
    pub fn add_stakeable_token(
        ctx: Context<AddStakeableToken>,
        token_mint: Pubkey,
        token_name: String,
        token_decimals: u8,
        base_apy: u16,        // 基础 APY (基点，如 1000 = 10%)
        reward_multiplier: u8, // 奖励倍数 (100 = 1x, 200 = 2x)
        min_stake_amount: u64,
        is_active: bool,
    ) -> Result<()> {
        let token_config = &mut ctx.accounts.token_config;
        
        token_config.token_mint = token_mint;
        token_config.token_name = token_name;
        token_config.token_decimals = token_decimals;
        token_config.base_apy = base_apy;
        token_config.reward_multiplier = reward_multiplier;
        token_config.min_stake_amount = min_stake_amount;
        token_config.is_active = is_active;
        token_config.total_staked = 0;
        token_config.total_stakers = 0;
        token_config.created_at = Clock::get()?.unix_timestamp;
        token_config.bump = ctx.bumps.token_config;

        // 金库在账户结构中已初始化

        msg!("New stakeable token added: {}", token_config.token_name);
        Ok(())
    }

    /// 更新代币配置（仅限管理员）
    pub fn update_token_config(
        ctx: Context<UpdateTokenConfig>,
        base_apy: Option<u16>,
        reward_multiplier: Option<u8>,
        min_stake_amount: Option<u64>,
        is_active: Option<bool>,
    ) -> Result<()> {
        let token_config = &mut ctx.accounts.token_config;

        if let Some(apy) = base_apy {
            token_config.base_apy = apy;
        }
        if let Some(multiplier) = reward_multiplier {
            token_config.reward_multiplier = multiplier;
        }
        if let Some(min_amount) = min_stake_amount {
            token_config.min_stake_amount = min_amount;
        }
        if let Some(active) = is_active {
            token_config.is_active = active;
        }

        msg!("Token config updated");
        Ok(())
    }

    /// 质押自定义代币
    pub fn stake_custom_token(
        ctx: Context<StakeCustomToken>,
        amount: u64,
        lock_period: LockPeriod,
    ) -> Result<()> {
        require!(!ctx.accounts.pool.is_paused, ErrorCode::PoolPaused);
        require!(amount > 0, ErrorCode::InvalidAmount);

        let token_config = &ctx.accounts.token_config;
        require!(token_config.is_active, ErrorCode::TokenNotActive);
        require!(
            amount >= token_config.min_stake_amount,
            ErrorCode::InsufficientStake
        );

        let pool = &mut ctx.accounts.pool;
        let stake_account = &mut ctx.accounts.stake_account;
        let clock = Clock::get()?;

        // 更新奖励
        update_rewards(pool, stake_account, clock.unix_timestamp)?;

        // 获取代币价格（USD）
        let token_price = get_token_price_usd(
            &ctx.accounts.price_oracle,
            &token_config.token_mint,
        )?;
        
        // 计算质押价值（USD）
        let stake_value_usd = calculate_stake_value_usd(
            amount,
            token_config.token_decimals,
            token_price,
        )?;

        // 转移代币到金库
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        // 计算锁定期
        let lock_duration = get_lock_duration(lock_period);
        
        // 创建或更新质押账户
        if stake_account.staked_value_usd == 0 {
            stake_account.owner = ctx.accounts.user.key();
            stake_account.pool = ctx.accounts.pool.key();
            stake_account.asset_type = AssetType::Custom(token_config.token_mint);
            stake_account.lock_period = lock_period;
            stake_account.stake_time = clock.unix_timestamp;
            stake_account.bump = ctx.bumps.stake_account;
        }
        
        stake_account.staked_value_usd += stake_value_usd;
        stake_account.unlock_time = clock.unix_timestamp + lock_duration;
        stake_account.reward_multiplier = token_config.reward_multiplier;
        pool.total_staked_value_usd += stake_value_usd;

        // 更新代币统计
        token_config.total_staked += amount;
        if stake_account.staked_value_usd == stake_value_usd {
            token_config.total_stakers += 1;
        }

        // 检查早鸟奖励
        let days_since_launch = (clock.unix_timestamp - pool.launch_time) / 86400;
        if days_since_launch <= 30 {
            stake_account.early_bird_bonus = get_early_bird_bonus(days_since_launch as u8);
        }

        msg!("Staked {} {} (${} USD), lock period: {:?}", 
             amount, token_config.token_name, stake_value_usd, lock_period);
        Ok(())
    }

    /// 移除质押代币品种（仅限管理员，需确保无活跃质押）
    pub fn remove_stakeable_token(
        ctx: Context<RemoveStakeableToken>,
    ) -> Result<()> {
        let token_config = &ctx.accounts.token_config;

        require!(
            token_config.total_staked == 0,
            ErrorCode::TokenHasActiveStakes
        );

        // 标记为不活跃
        // 实际删除需要关闭账户，这里只标记
        msg!("Token removed from stakeable list");
        Ok(())
    }
}

// ============== 辅助函数 ==============

fn update_rewards(
    pool: &mut Account<MultiAssetStakingPool>,
    stake_account: &mut Account<StakeAccount>,
    current_time: i64,
) -> Result<()> {
    // 更新全局奖励
    if pool.total_staked_value_usd > 0 {
        let time_elapsed = current_time - pool.last_update_time;
        if time_elapsed > 0 {
            let reward = (time_elapsed as u128)
                .checked_mul(pool.reward_rate_per_second as u128)
                .unwrap()
                .checked_mul(1e18 as u128)
                .unwrap()
                .checked_div(pool.total_staked_value_usd as u128)
                .unwrap();
            pool.reward_per_token_stored = pool
                .reward_per_token_stored
                .checked_add(reward)
                .unwrap();
        }
    }
    pool.last_update_time = current_time;

    // 更新用户奖励
    if stake_account.staked_value_usd > 0 {
        let base_earned = (stake_account.staked_value_usd as u128)
            .checked_mul(
                pool.reward_per_token_stored
                    .checked_sub(stake_account.reward_per_token_paid)
                    .unwrap(),
            )
            .unwrap();
        
        // 应用锁定期倍数
        let lock_multiplier = get_reward_multiplier(stake_account.lock_period);
        
        // 应用早鸟奖励
        let early_bird_multiplier = 100 + stake_account.early_bird_bonus;
        
        // 应用资产类型奖励倍数（POPCOW 有 2x）
        let asset_multiplier = stake_account.reward_multiplier;
        
        // 计算最终奖励
        let earned = base_earned
            .checked_mul(lock_multiplier as u128)
            .unwrap()
            .checked_mul(early_bird_multiplier as u128)
            .unwrap()
            .checked_mul(asset_multiplier as u128)
            .unwrap()
            .checked_div(100)
            .unwrap()
            .checked_div(100)
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
        LockPeriod::Flexible => 100,          // 1x
        LockPeriod::ThirtyDays => 150,        // 1.5x
        LockPeriod::NinetyDays => 200,        // 2x
        LockPeriod::OneEightyDays => 300,     // 3x
        LockPeriod::ThreeSixtyFiveDays => 500, // 5x
    }
}

fn get_lock_duration(lock_period: LockPeriod) -> i64 {
    match lock_period {
        LockPeriod::Flexible => 0,
        LockPeriod::ThirtyDays => 30 * 86400,
        LockPeriod::NinetyDays => 90 * 86400,
        LockPeriod::OneEightyDays => 180 * 86400,
        LockPeriod::ThreeSixtyFiveDays => 365 * 86400,
    }
}

fn get_early_bird_bonus(days_since_launch: u8) -> u8 {
    if days_since_launch <= 7 {
        50  // +50%
    } else if days_since_launch <= 14 {
        30  // +30%
    } else if days_since_launch <= 30 {
        20  // +20%
    } else {
        0
    }
}

// 价格获取函数（简化版，实际应从 Pyth Network 读取）
fn get_sol_price_usd(_oracle: &AccountInfo) -> Result<u64> {
    // 实际实现应从 Pyth Network 价格预言机读取
    // 这里返回模拟价格（$100 USD，保留 6 位小数）
    Ok(100_000_000) // $100.000000
}

fn get_popcow_price_usd(_oracle: &AccountInfo) -> Result<u64> {
    // 实际实现应从 Pyth Network 或 DEX 价格读取
    // 这里返回模拟价格（$0.001 USD，保留 6 位小数）
    Ok(1_000) // $0.001000
}

fn get_token_price_usd(
    _oracle: &AccountInfo,
    token_mint: &Pubkey,
) -> Result<u64> {
    // 实际实现应从 Pyth Network 读取代币价格
    // 这里返回模拟价格（$1 USD，保留 6 位小数）
    // 实际应该根据 token_mint 查询对应的价格源
    Ok(1_000_000) // $1.000000
}

fn calculate_stake_value_usd(
    amount: u64,
    decimals: u8,
    price_usd: u64,
) -> Result<u64> {
    // 计算 USD 价值
    // amount: 代币数量（最小单位）
    // decimals: 代币小数位
    // price_usd: 代币价格（USD，6 位小数）
    
    let amount_scaled = (amount as u128)
        .checked_mul(price_usd as u128)
        .unwrap()
        .checked_div(10_u128.pow(decimals as u32))
        .unwrap()
        .checked_div(1_000_000) // price_usd 有 6 位小数
        .unwrap();
    
    Ok(amount_scaled as u64)
}

// ============== 账户结构 ==============

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + MultiAssetStakingPool::INIT_SPACE,
        seeds = [b"multi_asset_pool"],
        bump
    )]
    pub pool: Account<'info, MultiAssetStakingPool>,

    pub reward_mint: Account<'info, Mint>,

    #[account(mut)]
    /// CHECK: SOL vault (系统账户)
    pub sol_vault: AccountInfo<'info>,

    #[account(
        init,
        payer = authority,
        token::mint = usdc_mint,
        token::authority = pool,
        seeds = [b"usdc_vault"],
        bump
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        token::mint = usdt_mint,
        token::authority = pool,
        seeds = [b"usdt_vault"],
        bump
    )]
    pub usdt_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        token::mint = popcow_mint,
        token::authority = pool,
        seeds = [b"popcow_vault"],
        bump
    )]
    pub popcow_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        token::mint = reward_mint,
        token::authority = pool,
        seeds = [b"reward_vault"],
        bump
    )]
    pub reward_vault: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,
    pub usdt_mint: Account<'info, Mint>,
    pub popcow_mint: Account<'info, Mint>,

    /// CHECK: Price oracle (Pyth Network)
    pub price_oracle: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct StakeSol<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"multi_asset_pool"],
        bump = pool.bump
    )]
    pub pool: Account<'info, MultiAssetStakingPool>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + StakeAccount::INIT_SPACE,
        seeds = [b"stake", user.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(mut)]
    /// CHECK: SOL vault
    pub sol_vault: AccountInfo<'info>,

    /// CHECK: Price oracle
    pub price_oracle: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StakeUSDC<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"multi_asset_pool"],
        bump = pool.bump
    )]
    pub pool: Account<'info, MultiAssetStakingPool>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + StakeAccount::INIT_SPACE,
        seeds = [b"stake", user.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(mut)]
    pub user_usdc_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"usdc_vault"],
        bump
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    /// CHECK: Price oracle
    pub price_oracle: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StakeUSDT<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"multi_asset_pool"],
        bump = pool.bump
    )]
    pub pool: Account<'info, MultiAssetStakingPool>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + StakeAccount::INIT_SPACE,
        seeds = [b"stake", user.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(mut)]
    pub user_usdt_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"usdt_vault"],
        bump
    )]
    pub usdt_vault: Account<'info, TokenAccount>,

    /// CHECK: Price oracle
    pub price_oracle: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StakePOPCOW<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"multi_asset_pool"],
        bump = pool.bump
    )]
    pub pool: Account<'info, MultiAssetStakingPool>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + StakeAccount::INIT_SPACE,
        seeds = [b"stake", user.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(mut)]
    pub user_popcow_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"popcow_vault"],
        bump
    )]
    pub popcow_vault: Account<'info, TokenAccount>,

    /// CHECK: Price oracle
    pub price_oracle: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"multi_asset_pool"],
        bump = pool.bump
    )]
    pub pool: Account<'info, MultiAssetStakingPool>,

    #[account(
        mut,
        seeds = [b"stake", user.key().as_ref()],
        bump = stake_account.bump,
        constraint = stake_account.owner == user.key() @ ErrorCode::Unauthorized
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(mut)]
    /// CHECK: SOL vault
    pub sol_vault: AccountInfo<'info>,

    #[account(mut)]
    pub usdc_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub usdt_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub popcow_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_usdc_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_usdt_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_popcow_account: Account<'info, TokenAccount>,

    /// CHECK: Price oracle
    pub price_oracle: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"multi_asset_pool"],
        bump = pool.bump
    )]
    pub pool: Account<'info, MultiAssetStakingPool>,

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
pub struct DailyAllocation<'info> {
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"multi_asset_pool"],
        bump = pool.bump,
        constraint = pool.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub pool: Account<'info, MultiAssetStakingPool>,

    #[account(mut)]
    /// CHECK: SOL vault
    pub sol_vault: AccountInfo<'info>,

    #[account(mut)]
    pub usdc_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub usdt_vault: Account<'info, TokenAccount>,

    /// CHECK: Price oracle
    pub price_oracle: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct AddRewards<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"multi_asset_pool"],
        bump = pool.bump,
        constraint = pool.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub pool: Account<'info, MultiAssetStakingPool>,

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
        seeds = [b"multi_asset_pool"],
        bump = pool.bump,
        constraint = pool.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub pool: Account<'info, MultiAssetStakingPool>,
}

#[derive(Accounts)]
pub struct AddStakeableToken<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [b"multi_asset_pool"],
        bump = pool.bump,
        constraint = pool.authority == admin.key() @ ErrorCode::Unauthorized
    )]
    pub pool: Account<'info, MultiAssetStakingPool>,

    #[account(
        init,
        payer = admin,
        space = 8 + TokenConfig::INIT_SPACE,
        seeds = [b"token_config", token_mint.key().as_ref()],
        bump
    )]
    pub token_config: Account<'info, TokenConfig>,

    #[account(
        init,
        payer = admin,
        token::mint = token_mint,
        token::authority = pool,
        seeds = [b"token_vault", token_mint.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,

    /// CHECK: Token mint
    pub token_mint: AccountInfo<'info>,

    /// CHECK: Price oracle
    pub price_oracle: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateTokenConfig<'info> {
    pub admin: Signer<'info>,

    #[account(
        seeds = [b"multi_asset_pool"],
        bump = pool.bump,
        constraint = pool.authority == admin.key() @ ErrorCode::Unauthorized
    )]
    pub pool: Account<'info, MultiAssetStakingPool>,

    #[account(
        mut,
        seeds = [b"token_config", token_config.token_mint.as_ref()],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,
}

#[derive(Accounts)]
pub struct StakeCustomToken<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"multi_asset_pool"],
        bump = pool.bump
    )]
    pub pool: Account<'info, MultiAssetStakingPool>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + StakeAccount::INIT_SPACE,
        seeds = [b"stake", user.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        seeds = [b"token_config", token_config.token_mint.as_ref()],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"token_vault", token_config.token_mint.as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,

    /// CHECK: Price oracle
    pub price_oracle: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveStakeableToken<'info> {
    pub admin: Signer<'info>,

    #[account(
        seeds = [b"multi_asset_pool"],
        bump = pool.bump,
        constraint = pool.authority == admin.key() @ ErrorCode::Unauthorized
    )]
    pub pool: Account<'info, MultiAssetStakingPool>,

    #[account(
        mut,
        seeds = [b"token_config", token_config.token_mint.as_ref()],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,
}

// ============== 数据结构 ==============

#[account]
#[derive(InitSpace)]
pub struct MultiAssetStakingPool {
    pub authority: Pubkey,
    pub reward_mint: Pubkey,
    pub price_oracle: Pubkey,
    pub total_staked_value_usd: u64,
    pub reward_rate_per_second: u64,
    pub conversion_rate: u8,
    pub last_update_time: i64,
    pub reward_per_token_stored: u128,
    pub is_paused: bool,
    
    // 资金分配比例（基点）
    pub dev_fund_ratio: u16,      // 40% = 4000
    pub liquidity_ratio: u16,     // 30% = 3000
    pub reward_ratio: u16,         // 20% = 2000
    pub reserve_ratio: u16,       // 10% = 1000
    
    pub launch_time: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct StakeAccount {
    pub owner: Pubkey,
    pub pool: Pubkey,
    pub asset_type: AssetType,
    pub staked_value_usd: u64,  // 质押价值（USD，6位小数）
    pub lock_period: LockPeriod,
    pub stake_time: i64,
    pub unlock_time: i64,
    pub pending_rewards: u64,
    pub total_rewards_claimed: u64,
    pub reward_per_token_paid: u128,
    pub reward_multiplier: u8,  // 奖励倍数（100 = 1x，200 = 2x）
    pub early_bird_bonus: u8,   // 早鸟奖励（0-50）
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct TokenConfig {
    pub token_mint: Pubkey,
    #[max_len(50)]
    pub token_name: String,
    pub token_decimals: u8,
    pub base_apy: u16,           // 基础 APY (基点，如 1000 = 10%)
    pub reward_multiplier: u8,   // 奖励倍数 (100 = 1x, 200 = 2x)
    pub min_stake_amount: u64,   // 最小质押数量
    pub is_active: bool,         // 是否激活
    pub total_staked: u64,       // 总质押量
    pub total_stakers: u32,      // 总质押用户数
    pub created_at: i64,         // 创建时间
    pub bump: u8,
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum AssetType {
    SOL,
    USDC,
    USDT,
    POPCOW,
    Custom(Pubkey), // 自定义代币
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum LockPeriod {
    Flexible,           // 灵活质押
    ThirtyDays,         // 30天锁定
    NinetyDays,         // 90天锁定
    OneEightyDays,      // 180天锁定
    ThreeSixtyFiveDays, // 365天锁定
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
    #[msg("Token is not active")]
    TokenNotActive,
    #[msg("Token has active stakes")]
    TokenHasActiveStakes,
}
