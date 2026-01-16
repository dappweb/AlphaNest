use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("ECAnyfJmCxVxUSgv4MW7uvAkMophVnG5VTvEAgQt2vrP");

#[program]
pub mod yield_vault {
    use super::*;

    /// 初始化收益金库
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        vault_type: VaultType,
        min_deposit: u64,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.vault_type = vault_type;
        vault.min_deposit = min_deposit;
        vault.total_deposited = 0;
        vault.total_withdrawn = 0;
        vault.total_earnings = 0;
        vault.is_paused = false;
        vault.bump = ctx.bumps.vault;
        vault.created_at = Clock::get()?.unix_timestamp;

        // 设置资产分配比例
        vault.allocation_staking = 4000;      // 40% - POPCOW 质押
        vault.allocation_defi_staking = 2000; // 20% - PopCowDefi 质押
        vault.allocation_lp = 2500;           // 25% - Raydium LP
        vault.allocation_alpha = 1000;        // 10% - Alpha 交易
        vault.allocation_insurance = 500;     // 5% - 保险分成

        msg!("Yield Vault initialized: {:?}", vault_type);
        Ok(())
    }

    /// 用户存款
    pub fn deposit(
        ctx: Context<Deposit>,
        amount: u64,
    ) -> Result<()> {
        require!(!ctx.accounts.vault.is_paused, ErrorCode::VaultPaused);
        require!(amount >= ctx.accounts.vault.min_deposit, ErrorCode::InsufficientDeposit);
        require!(amount > 0, ErrorCode::InvalidAmount);

        let vault = &mut ctx.accounts.vault;
        let user_position = &mut ctx.accounts.user_position;
        let clock = Clock::get()?;

        // 更新用户持仓
        if user_position.owner == Pubkey::default() {
            user_position.owner = ctx.accounts.user.key();
            user_position.vault = vault.key();
            user_position.deposited_amount = 0;
            user_position.earned_amount = 0;
            user_position.last_update_time = clock.unix_timestamp;
            user_position.bump = ctx.bumps.user_position;
        }

        // 转移代币到金库
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.vault_token_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        // 更新状态
        user_position.deposited_amount = user_position.deposited_amount.checked_add(amount).unwrap();
        vault.total_deposited = vault.total_deposited.checked_add(amount).unwrap();

        // 计算份额（简化版，实际应使用更复杂的份额计算）
        let shares = calculate_shares(amount, vault.total_deposited);
        user_position.shares = user_position.shares.checked_add(shares).unwrap();

        msg!("Deposited {} tokens, shares: {}", amount, shares);
        Ok(())
    }

    /// 用户提取
    pub fn withdraw(
        ctx: Context<Withdraw>,
        amount: u64,
    ) -> Result<()> {
        require!(!ctx.accounts.vault.is_paused, ErrorCode::VaultPaused);
        require!(amount > 0, ErrorCode::InvalidAmount);

        let vault = &ctx.accounts.vault;
        let user_position = &mut ctx.accounts.user_position;
        let clock = Clock::get()?;

        // 检查锁定期
        if vault.vault_type != VaultType::Flexible {
            let lock_duration = get_lock_duration(vault.vault_type);
            let elapsed = clock.unix_timestamp - user_position.last_update_time;
            require!(
                elapsed >= lock_duration,
                ErrorCode::StillLocked
            );
        }

        // 更新收益
        update_user_earnings(vault, user_position, clock.unix_timestamp)?;

        // 计算可提取金额（包含收益）
        let withdrawable = user_position.deposited_amount
            .checked_add(user_position.earned_amount)
            .unwrap();
        require!(amount <= withdrawable, ErrorCode::InsufficientBalance);

        // 计算提取费用（仅限提前提取）
        let fee = if vault.vault_type != VaultType::Flexible 
            && clock.unix_timestamp < user_position.last_update_time + get_lock_duration(vault.vault_type) {
            amount.checked_mul(10).unwrap() / 10000 // 0.1% 提前提取费
        } else {
            0
        };

        let withdraw_amount = amount.checked_sub(fee).unwrap();

        // 转移代币给用户
        let seeds = &[
            b"vault".as_ref(),
            &[vault.bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_token_account.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                signer,
            ),
            withdraw_amount,
        )?;

        // 更新状态
        user_position.deposited_amount = user_position.deposited_amount.checked_sub(amount).unwrap();
        vault.total_deposited = vault.total_deposited.checked_sub(amount).unwrap();

        msg!("Withdrawn {} tokens (fee: {})", withdraw_amount, fee);
        Ok(())
    }

    /// 领取收益
    pub fn claim_earnings(ctx: Context<ClaimEarnings>) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let user_position = &mut ctx.accounts.user_position;
        let clock = Clock::get()?;

        // 更新收益
        update_user_earnings(vault, user_position, clock.unix_timestamp)?;

        let earnings = user_position.earned_amount;
        require!(earnings > 0, ErrorCode::NoEarnings);

        // 转移收益给用户
        let seeds = &[
            b"vault".as_ref(),
            &[vault.bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_token_account.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                signer,
            ),
            earnings,
        )?;

        vault.total_earnings = vault.total_earnings.checked_sub(earnings).unwrap();
        user_position.earned_amount = 0;
        user_position.last_update_time = clock.unix_timestamp;

        msg!("Claimed {} earnings", earnings);
        Ok(())
    }

    /// 自动复投（由管理员或自动化服务调用）
    pub fn compound_earnings(ctx: Context<CompoundEarnings>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let clock = Clock::get()?;

        // 计算总收益（简化版，实际应从各收益源获取）
        let total_earnings = calculate_total_earnings(vault, clock.unix_timestamp)?;

        // 将收益重新分配到各收益源
        // 这里简化处理，实际应调用各个收益源的合约

        vault.total_earnings = vault.total_earnings.checked_add(total_earnings).unwrap();
        vault.last_compound_time = clock.unix_timestamp;

        msg!("Compounded {} earnings", total_earnings);
        Ok(())
    }

    /// 更新资产分配比例（仅限管理员）
    pub fn update_allocation(
        ctx: Context<UpdateVault>,
        staking: u16,
        defi_staking: u16,
        lp: u16,
        alpha: u16,
        insurance: u16,
    ) -> Result<()> {
        require!(
            staking + defi_staking + lp + alpha + insurance == 10000,
            ErrorCode::InvalidAllocation
        );

        let vault = &mut ctx.accounts.vault;
        vault.allocation_staking = staking;
        vault.allocation_defi_staking = defi_staking;
        vault.allocation_lp = lp;
        vault.allocation_alpha = alpha;
        vault.allocation_insurance = insurance;

        msg!("Allocation updated");
        Ok(())
    }

    /// 暂停/恢复金库（仅限管理员）
    pub fn set_paused(
        ctx: Context<UpdateVault>,
        paused: bool,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.is_paused = paused;
        msg!("Vault paused: {}", paused);
        Ok(())
    }
}

// ============== 辅助函数 ==============

fn calculate_shares(amount: u64, total_deposited: u64) -> u64 {
    if total_deposited == 0 {
        return amount;
    }
    // 简化版份额计算，实际应使用更复杂的公式
    amount
}

fn update_user_earnings(
    vault: &Account<YieldVault>,
    user_position: &mut Account<UserPosition>,
    current_time: i64,
) -> Result<()> {
    let time_elapsed = current_time - user_position.last_update_time;
    if time_elapsed <= 0 || user_position.deposited_amount == 0 {
        return Ok(());
    }

    // 计算收益（简化版，实际应从各收益源获取真实收益）
    let apy = get_vault_apy(vault.vault_type);
    let daily_rate = apy as u128 * 1_000_000 / 365 / 100; // 转换为每日利率（基点）
    let earnings = (user_position.deposited_amount as u128)
        .checked_mul(daily_rate)
        .unwrap()
        .checked_mul(time_elapsed as u128)
        .unwrap()
        .checked_div(86400) // 秒转天
        .unwrap()
        .checked_div(1_000_000)
        .unwrap() as u64;

    user_position.earned_amount = user_position.earned_amount.checked_add(earnings).unwrap();
    user_position.last_update_time = current_time;

    Ok(())
}

fn calculate_total_earnings(
    vault: &Account<YieldVault>,
    current_time: i64,
) -> Result<u64> {
    // 简化版，实际应从各收益源获取真实收益
    let apy = get_vault_apy(vault.vault_type);
    let daily_rate = apy as u128 * 1_000_000 / 365 / 100;
    let time_elapsed = current_time - vault.last_compound_time;
    
    let earnings = (vault.total_deposited as u128)
        .checked_mul(daily_rate)
        .unwrap()
        .checked_mul(time_elapsed as u128)
        .unwrap()
        .checked_div(86400)
        .unwrap()
        .checked_div(1_000_000)
        .unwrap() as u64;

    Ok(earnings)
}

fn get_vault_apy(vault_type: VaultType) -> u16 {
    match vault_type {
        VaultType::Flexible => 4000,      // 40% APY
        VaultType::Stable => 5500,        // 55% APY
        VaultType::Growth => 8000,        // 80% APY
        VaultType::Aggressive => 12000,   // 120% APY
    }
}

fn get_lock_duration(vault_type: VaultType) -> i64 {
    match vault_type {
        VaultType::Flexible => 0,
        VaultType::Stable => 30 * 86400,      // 30 天
        VaultType::Growth => 90 * 86400,      // 90 天
        VaultType::Aggressive => 180 * 86400, // 180 天
    }
}

// ============== 账户结构 ==============

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + YieldVault::INIT_SPACE,
        seeds = [b"vault", &vault_type.to_bytes()],
        bump
    )]
    pub vault: Account<'info, YieldVault>,

    pub deposit_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        token::mint = deposit_mint,
        token::authority = vault,
        seeds = [b"vault_token", vault.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", &vault.vault_type.to_bytes()],
        bump = vault.bump
    )]
    pub vault: Account<'info, YieldVault>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserPosition::INIT_SPACE,
        seeds = [b"position", user.key().as_ref(), vault.key().as_ref()],
        bump
    )]
    pub user_position: Account<'info, UserPosition>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault_token", vault.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", &vault.vault_type.to_bytes()],
        bump = vault.bump
    )]
    pub vault: Account<'info, YieldVault>,

    #[account(
        mut,
        seeds = [b"position", user.key().as_ref(), vault.key().as_ref()],
        bump = user_position.bump,
        constraint = user_position.owner == user.key() @ ErrorCode::Unauthorized
    )]
    pub user_position: Account<'info, UserPosition>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault_token", vault.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimEarnings<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", &vault.vault_type.to_bytes()],
        bump = vault.bump
    )]
    pub vault: Account<'info, YieldVault>,

    #[account(
        mut,
        seeds = [b"position", user.key().as_ref(), vault.key().as_ref()],
        bump = user_position.bump,
        constraint = user_position.owner == user.key() @ ErrorCode::Unauthorized
    )]
    pub user_position: Account<'info, UserPosition>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault_token", vault.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CompoundEarnings<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.vault_type.to_string().as_bytes()],
        bump = vault.bump,
        constraint = vault.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub vault: Account<'info, YieldVault>,
}

#[derive(Accounts)]
pub struct UpdateVault<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"vault", vault.vault_type.to_string().as_bytes()],
        bump = vault.bump,
        constraint = vault.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub vault: Account<'info, YieldVault>,
}

// ============== 数据结构 ==============

#[account]
#[derive(InitSpace)]
pub struct YieldVault {
    pub authority: Pubkey,
    pub vault_type: VaultType,
    pub min_deposit: u64,
    pub total_deposited: u64,
    pub total_withdrawn: u64,
    pub total_earnings: u64,
    
    // 资产分配比例（基点，10000 = 100%）
    pub allocation_staking: u16,      // POPCOW 质押
    pub allocation_defi_staking: u16, // PopCowDefi 质押
    pub allocation_lp: u16,           // Raydium LP
    pub allocation_alpha: u16,        // Alpha 交易
    pub allocation_insurance: u16,   // 保险分成
    
    pub is_paused: bool,
    pub created_at: i64,
    pub last_compound_time: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserPosition {
    pub owner: Pubkey,
    pub vault: Pubkey,
    pub deposited_amount: u64,
    pub earned_amount: u64,
    pub shares: u64,
    pub last_update_time: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum VaultType {
    Flexible,    // 灵活型 - 无锁定期
    Stable,      // 稳健型 - 30天
    Growth,      // 增长型 - 90天
    Aggressive,  // 激进型 - 180天
}

impl VaultType {
    pub fn to_bytes(&self) -> [u8; 1] {
        match self {
            VaultType::Flexible => [0],
            VaultType::Stable => [1],
            VaultType::Growth => [2],
            VaultType::Aggressive => [3],
        }
    }
}

// ============== 错误码 ==============

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Vault is paused")]
    VaultPaused,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient deposit")]
    InsufficientDeposit,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Tokens are still locked")]
    StillLocked,
    #[msg("No earnings to claim")]
    NoEarnings,
    #[msg("Invalid allocation (must sum to 100%)")]
    InvalidAllocation,
}
