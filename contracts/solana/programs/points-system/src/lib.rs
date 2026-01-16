use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("PointsSystem1111111111111111111111111111111111");

#[program]
pub mod points_system {
    use super::*;

    /// 初始化积分系统
    pub fn initialize(
        ctx: Context<Initialize>,
        popcow_defi_mint: Pubkey,
    ) -> Result<()> {
        let system = &mut ctx.accounts.system;
        system.authority = ctx.accounts.authority.key();
        system.popcow_defi_mint = popcow_defi_mint;
        
        // 积分获取规则（PopCowDefi 数量）
        system.points_per_verify = 100 * 1_000_000_000;      // 验证持仓：100 PopCowDefi
        system.points_per_task = 50 * 1_000_000_000;        // 完成任务：50 PopCowDefi
        system.points_per_trade = 10 * 1_000_000_000;        // 交易：10 PopCowDefi
        system.points_per_referral = 200 * 1_000_000_000;    // 推荐：200 PopCowDefi
        system.points_per_burn = 50 * 1_000_000_000;         // 销毁尸体币：50 PopCowDefi
        
        // 积分消耗规则
        system.insurance_ticket_cost = 1000 * 1_000_000_000;  // 保险入场券：1000 PopCowDefi
        system.raffle_ticket_cost = 500 * 1_000_000_000;     // 抽奖券：500 PopCowDefi
        system.alpha_signal_cost = 2000 * 1_000_000_000;     // Alpha 信号：2000 PopCowDefi
        
        system.total_points_distributed = 0;
        system.total_points_consumed = 0;
        system.bump = ctx.bumps.system;

        msg!("Points system initialized with PopCowDefi");
        Ok(())
    }

    /// 验证持仓获取积分（Verify-to-Earn）
    pub fn verify_holding_and_earn(
        ctx: Context<VerifyHolding>,
        chain_id: u16,
        token_address: Pubkey,
        min_balance: u64,
    ) -> Result<()> {
        let points_account = &mut ctx.accounts.points_account;
        let system = &ctx.accounts.system;
        let clock = Clock::get()?;

        // 检查是否已验证过（24小时内只能验证一次）
        if points_account.last_verify_time > 0 {
            let time_since_last_verify = clock.unix_timestamp - points_account.last_verify_time;
            require!(
                time_since_last_verify >= 86400, // 24小时
                ErrorCode::VerifyCooldown
            );
        }

        // 验证持仓（链下验证，这里假设已验证）
        // 实际应该通过存储证明或预言机验证
        
        // 发放积分（PopCowDefi）
        let points_amount = system.points_per_verify;
        
        // 从系统金库转移 PopCowDefi 到用户
        let seeds = &[
            b"system",
            &[system.bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.system_vault.to_account_info(),
                    to: ctx.accounts.user_points_account.to_account_info(),
                    authority: ctx.accounts.system.to_account_info(),
                },
                signer,
            ),
            points_amount,
        )?;

        // 更新积分账户
        if points_account.owner == Pubkey::default() {
            points_account.owner = ctx.accounts.user.key();
            points_account.bump = ctx.bumps.points_account;
        }
        
        points_account.total_points_earned += points_amount;
        points_account.available_points += points_amount;
        points_account.last_verify_time = clock.unix_timestamp;
        points_account.verify_count += 1;

        // 更新系统统计
        ctx.accounts.system.total_points_distributed += points_amount;

        msg!("User earned {} PopCowDefi from verify holding", points_amount);
        Ok(())
    }

    /// 完成任务获取积分
    pub fn complete_task_and_earn(
        ctx: Context<CompleteTask>,
        task_id: u32,
    ) -> Result<()> {
        let points_account = &mut ctx.accounts.points_account;
        let system = &ctx.accounts.system;

        // 检查任务是否已完成
        require!(
            !points_account.completed_tasks.contains(&task_id),
            ErrorCode::TaskAlreadyCompleted
        );

        // 发放积分
        let points_amount = system.points_per_task;

        let seeds = &[
            b"system",
            &[system.bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.system_vault.to_account_info(),
                    to: ctx.accounts.user_points_account.to_account_info(),
                    authority: ctx.accounts.system.to_account_info(),
                },
                signer,
            ),
            points_amount,
        )?;

        // 更新积分账户
        if points_account.owner == Pubkey::default() {
            points_account.owner = ctx.accounts.user.key();
            points_account.bump = ctx.bumps.points_account;
        }

        points_account.total_points_earned += points_amount;
        points_account.available_points += points_amount;
        points_account.completed_tasks.push(task_id);
        points_account.task_count += 1;

        ctx.accounts.system.total_points_distributed += points_amount;

        msg!("User earned {} PopCowDefi from completing task {}", points_amount, task_id);
        Ok(())
    }

    /// 交易获取积分
    pub fn trade_and_earn(
        ctx: Context<TradeAndEarn>,
        trade_amount_usd: u64,
    ) -> Result<()> {
        let points_account = &mut ctx.accounts.points_account;
        let system = &ctx.accounts.system;

        // 根据交易金额计算积分（交易金额越大，积分越多）
        let base_points = system.points_per_trade;
        let trade_multiplier = if trade_amount_usd > 10_000_000 { // > $10,000
            3
        } else if trade_amount_usd > 1_000_000 { // > $1,000
            2
        } else {
            1
        };

        let points_amount = base_points * trade_multiplier;

        let seeds = &[
            b"system",
            &[system.bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.system_vault.to_account_info(),
                    to: ctx.accounts.user_points_account.to_account_info(),
                    authority: ctx.accounts.system.to_account_info(),
                },
                signer,
            ),
            points_amount,
        )?;

        // 更新积分账户
        if points_account.owner == Pubkey::default() {
            points_account.owner = ctx.accounts.user.key();
            points_account.bump = ctx.bumps.points_account;
        }

        points_account.total_points_earned += points_amount;
        points_account.available_points += points_amount;
        points_account.trade_count += 1;
        points_account.total_trade_volume += trade_amount_usd;

        ctx.accounts.system.total_points_distributed += points_amount;

        msg!("User earned {} PopCowDefi from trading", points_amount);
        Ok(())
    }

    /// 推荐获取积分
    pub fn referral_and_earn(
        ctx: Context<ReferralAndEarn>,
        referee: Pubkey,
    ) -> Result<()> {
        let points_account = &mut ctx.accounts.points_account;
        let system = &ctx.accounts.system;

        // 检查是否已推荐过该用户
        require!(
            !points_account.referred_users.contains(&referee),
            ErrorCode::AlreadyReferred
        );

        // 发放推荐积分
        let points_amount = system.points_per_referral;

        let seeds = &[
            b"system",
            &[system.bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.system_vault.to_account_info(),
                    to: ctx.accounts.user_points_account.to_account_info(),
                    authority: ctx.accounts.system.to_account_info(),
                },
                signer,
            ),
            points_amount,
        )?;

        // 更新积分账户
        if points_account.owner == Pubkey::default() {
            points_account.owner = ctx.accounts.user.key();
            points_account.bump = ctx.bumps.points_account;
        }

        points_account.total_points_earned += points_amount;
        points_account.available_points += points_amount;
        points_account.referred_users.push(referee);
        points_account.referral_count += 1;

        ctx.accounts.system.total_points_distributed += points_amount;

        msg!("User earned {} PopCowDefi from referral", points_amount);
        Ok(())
    }

    /// 销毁尸体币获取积分
    pub fn burn_dead_coin_and_earn(
        ctx: Context<BurnDeadCoin>,
        dead_coin_amount: u64,
        dead_coin_value_usd: u64, // 代币价值（USD，6位小数）
    ) -> Result<()> {
        let points_account = &mut ctx.accounts.points_account;
        let system = &ctx.accounts.system;

        // 计算积分（按价值 10% 转换）
        let base_points = system.points_per_burn;
        let value_based_points = (dead_coin_value_usd as u128)
            .checked_mul(10) // 10%
            .unwrap()
            .checked_div(100)
            .unwrap()
            .checked_mul(1_000_000_000) // 转换为 PopCowDefi（9位小数）
            .unwrap()
            .checked_div(1_000_000) // USD 有 6 位小数
            .unwrap();

        let points_amount = base_points + value_based_points as u64;

        let seeds = &[
            b"system",
            &[system.bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.system_vault.to_account_info(),
                    to: ctx.accounts.user_points_account.to_account_info(),
                    authority: ctx.accounts.system.to_account_info(),
                },
                signer,
            ),
            points_amount,
        )?;

        // 更新积分账户
        if points_account.owner == Pubkey::default() {
            points_account.owner = ctx.accounts.user.key();
            points_account.bump = ctx.bumps.points_account;
        }

        points_account.total_points_earned += points_amount;
        points_account.available_points += points_amount;
        points_account.burn_count += 1;
        points_account.total_burned_value += dead_coin_value_usd;

        ctx.accounts.system.total_points_distributed += points_amount;

        msg!("User earned {} PopCowDefi from burning dead coin", points_amount);
        Ok(())
    }

    /// 消耗积分购买保险入场券
    pub fn consume_points_for_insurance(
        ctx: Context<ConsumePoints>,
    ) -> Result<()> {
        let points_account = &mut ctx.accounts.points_account;
        let system = &ctx.accounts.system;

        let cost = system.insurance_ticket_cost;
        require!(
            points_account.available_points >= cost,
            ErrorCode::InsufficientPoints
        );

        // 从用户转移 PopCowDefi 到系统金库（消耗）
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_points_account.to_account_info(),
                    to: ctx.accounts.system_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            cost,
        )?;

        points_account.available_points -= cost;
        points_account.total_points_consumed += cost;
        points_account.insurance_tickets += 1;

        ctx.accounts.system.total_points_consumed += cost;

        msg!("User consumed {} PopCowDefi for insurance ticket", cost);
        Ok(())
    }

    /// 消耗积分购买抽奖券
    pub fn consume_points_for_raffle(
        ctx: Context<ConsumePoints>,
        ticket_count: u8,
    ) -> Result<()> {
        let points_account = &mut ctx.accounts.points_account;
        let system = &ctx.accounts.system;

        let cost = system.raffle_ticket_cost
            .checked_mul(ticket_count as u64)
            .unwrap();

        require!(
            points_account.available_points >= cost,
            ErrorCode::InsufficientPoints
        );

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_points_account.to_account_info(),
                    to: ctx.accounts.system_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            cost,
        )?;

        points_account.available_points -= cost;
        points_account.total_points_consumed += cost;
        points_account.raffle_tickets += ticket_count as u32;

        ctx.accounts.system.total_points_consumed += cost;

        msg!("User consumed {} PopCowDefi for {} raffle tickets", cost, ticket_count);
        Ok(())
    }

    /// 消耗积分购买 Alpha 信号
    pub fn consume_points_for_alpha_signal(
        ctx: Context<ConsumePoints>,
    ) -> Result<()> {
        let points_account = &mut ctx.accounts.points_account;
        let system = &ctx.accounts.system;

        let cost = system.alpha_signal_cost;
        require!(
            points_account.available_points >= cost,
            ErrorCode::InsufficientPoints
        );

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_points_account.to_account_info(),
                    to: ctx.accounts.system_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            cost,
        )?;

        points_account.available_points -= cost;
        points_account.total_points_consumed += cost;
        points_account.alpha_signals += 1;

        ctx.accounts.system.total_points_consumed += cost;

        msg!("User consumed {} PopCowDefi for alpha signal", cost);
        Ok(())
    }

    /// 管理员补充系统金库
    pub fn refill_system_vault(
        ctx: Context<RefillVault>,
        amount: u64,
    ) -> Result<()> {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.authority_token_account.to_account_info(),
                    to: ctx.accounts.system_vault.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;

        msg!("Refilled system vault with {} PopCowDefi", amount);
        Ok(())
    }

    /// 更新积分规则（仅限管理员）
    pub fn update_points_rules(
        ctx: Context<UpdateRules>,
        points_per_verify: Option<u64>,
        points_per_task: Option<u64>,
        points_per_trade: Option<u64>,
        points_per_referral: Option<u64>,
        points_per_burn: Option<u64>,
        insurance_ticket_cost: Option<u64>,
        raffle_ticket_cost: Option<u64>,
        alpha_signal_cost: Option<u64>,
    ) -> Result<()> {
        let system = &mut ctx.accounts.system;

        if let Some(amount) = points_per_verify {
            system.points_per_verify = amount;
        }
        if let Some(amount) = points_per_task {
            system.points_per_task = amount;
        }
        if let Some(amount) = points_per_trade {
            system.points_per_trade = amount;
        }
        if let Some(amount) = points_per_referral {
            system.points_per_referral = amount;
        }
        if let Some(amount) = points_per_burn {
            system.points_per_burn = amount;
        }
        if let Some(cost) = insurance_ticket_cost {
            system.insurance_ticket_cost = cost;
        }
        if let Some(cost) = raffle_ticket_cost {
            system.raffle_ticket_cost = cost;
        }
        if let Some(cost) = alpha_signal_cost {
            system.alpha_signal_cost = cost;
        }

        msg!("Points rules updated");
        Ok(())
    }
}

// ============== 账户结构 ==============

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + PointsSystem::INIT_SPACE,
        seeds = [b"points_system"],
        bump
    )]
    pub system: Account<'info, PointsSystem>,

    /// CHECK: PopCowDefi Mint
    pub popcow_defi_mint: AccountInfo<'info>,

    #[account(
        init,
        payer = authority,
        token::mint = popcow_defi_mint,
        token::authority = system,
        seeds = [b"system_vault"],
        bump
    )]
    pub system_vault: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct VerifyHolding<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"points_system"],
        bump = system.bump
    )]
    pub system: Account<'info, PointsSystem>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + PointsAccount::INIT_SPACE,
        seeds = [b"points", user.key().as_ref()],
        bump
    )]
    pub points_account: Account<'info, PointsAccount>,

    #[account(mut)]
    pub user_points_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"system_vault"],
        bump
    )]
    pub system_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CompleteTask<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"points_system"],
        bump = system.bump
    )]
    pub system: Account<'info, PointsSystem>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + PointsAccount::INIT_SPACE,
        seeds = [b"points", user.key().as_ref()],
        bump
    )]
    pub points_account: Account<'info, PointsAccount>,

    #[account(mut)]
    pub user_points_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"system_vault"],
        bump
    )]
    pub system_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TradeAndEarn<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"points_system"],
        bump = system.bump
    )]
    pub system: Account<'info, PointsSystem>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + PointsAccount::INIT_SPACE,
        seeds = [b"points", user.key().as_ref()],
        bump
    )]
    pub points_account: Account<'info, PointsAccount>,

    #[account(mut)]
    pub user_points_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"system_vault"],
        bump
    )]
    pub system_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReferralAndEarn<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"points_system"],
        bump = system.bump
    )]
    pub system: Account<'info, PointsSystem>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + PointsAccount::INIT_SPACE,
        seeds = [b"points", user.key().as_ref()],
        bump
    )]
    pub points_account: Account<'info, PointsAccount>,

    #[account(mut)]
    pub user_points_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"system_vault"],
        bump
    )]
    pub system_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BurnDeadCoin<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"points_system"],
        bump = system.bump
    )]
    pub system: Account<'info, PointsSystem>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + PointsAccount::INIT_SPACE,
        seeds = [b"points", user.key().as_ref()],
        bump
    )]
    pub points_account: Account<'info, PointsAccount>,

    #[account(mut)]
    pub user_points_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"system_vault"],
        bump
    )]
    pub system_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConsumePoints<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"points_system"],
        bump = system.bump
    )]
    pub system: Account<'info, PointsSystem>,

    #[account(
        mut,
        seeds = [b"points", user.key().as_ref()],
        bump = points_account.bump,
        constraint = points_account.owner == user.key() @ ErrorCode::Unauthorized
    )]
    pub points_account: Account<'info, PointsAccount>,

    #[account(mut)]
    pub user_points_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"system_vault"],
        bump
    )]
    pub system_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RefillVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"points_system"],
        bump = system.bump,
        constraint = system.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub system: Account<'info, PointsSystem>,

    #[account(mut)]
    pub authority_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"system_vault"],
        bump
    )]
    pub system_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateRules<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"points_system"],
        bump = system.bump,
        constraint = system.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub system: Account<'info, PointsSystem>,
}

// ============== 数据结构 ==============

#[account]
#[derive(InitSpace)]
pub struct PointsSystem {
    pub authority: Pubkey,
    pub popcow_defi_mint: Pubkey,
    
    // 积分获取规则（PopCowDefi 数量）
    pub points_per_verify: u64,      // 验证持仓
    pub points_per_task: u64,       // 完成任务
    pub points_per_trade: u64,      // 交易
    pub points_per_referral: u64,   // 推荐
    pub points_per_burn: u64,        // 销毁尸体币
    
    // 积分消耗规则（PopCowDefi 数量）
    pub insurance_ticket_cost: u64,  // 保险入场券
    pub raffle_ticket_cost: u64,     // 抽奖券
    pub alpha_signal_cost: u64,      // Alpha 信号
    
    // 统计
    pub total_points_distributed: u64,
    pub total_points_consumed: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct PointsAccount {
    pub owner: Pubkey,
    pub total_points_earned: u64,    // 总获得积分
    pub total_points_consumed: u64,  // 总消耗积分
    pub available_points: u64,       // 可用积分（PopCowDefi 余额）
    
    // 统计
    pub verify_count: u32,
    pub task_count: u32,
    pub trade_count: u32,
    pub referral_count: u32,
    pub burn_count: u32,
    
    // 消耗统计
    pub insurance_tickets: u32,
    pub raffle_tickets: u32,
    pub alpha_signals: u32,
    
    // 其他数据
    pub last_verify_time: i64,
    pub total_trade_volume: u64,      // 总交易量（USD）
    pub total_burned_value: u64,      // 总销毁价值（USD）
    
    // 已完成的任务和推荐用户
    pub completed_tasks: Vec<u32>,
    pub referred_users: Vec<Pubkey>,
    
    pub bump: u8,
}

// ============== 错误码 ==============

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Insufficient points")]
    InsufficientPoints,
    #[msg("Verify cooldown not expired")]
    VerifyCooldown,
    #[msg("Task already completed")]
    TaskAlreadyCompleted,
    #[msg("User already referred")]
    AlreadyReferred,
}
