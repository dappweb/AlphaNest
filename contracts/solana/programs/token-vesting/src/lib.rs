use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("DUJkUcXYqJuusLRqhun4gCMt7PvuytCGfVsqKB6DU6uM");

#[program]
pub mod token_vesting {
    use super::*;

    /// 初始化 Vesting 账户
    pub fn initialize(
        ctx: Context<Initialize>,
        total_amount: u64,
        cliff_seconds: i64,
        duration_seconds: i64,
    ) -> Result<()> {
        let vesting = &mut ctx.accounts.vesting;
        vesting.recipient = ctx.accounts.recipient.key();
        vesting.token_account = ctx.accounts.token_account.key();
        vesting.total_amount = total_amount;
        vesting.released_amount = 0;
        vesting.start_time = Clock::get()?.unix_timestamp;
        vesting.cliff_seconds = cliff_seconds;
        vesting.duration_seconds = duration_seconds;
        vesting.bump = ctx.bumps.vesting;

        msg!(
            "Vesting initialized: {} tokens, cliff: {}s, duration: {}s",
            total_amount,
            cliff_seconds,
            duration_seconds
        );
        Ok(())
    }

    /// 释放已解锁的代币
    pub fn release(ctx: Context<Release>) -> Result<()> {
        let vesting = &mut ctx.accounts.vesting;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;

        // 计算可释放数量
        let releasable = calculate_releasable(
            vesting.total_amount,
            vesting.released_amount,
            vesting.start_time,
            vesting.cliff_seconds,
            vesting.duration_seconds,
            current_time,
        )?;

        require!(releasable > 0, ErrorCode::NoTokensToRelease);

        // 保存用于 seeds 的值
        let recipient = vesting.recipient;
        let bump = vesting.bump;

        // 更新已释放数量
        vesting.released_amount = vesting
            .released_amount
            .checked_add(releasable)
            .ok_or(ErrorCode::Overflow)?;

        // 转账代币
        let seeds = &[
            b"vesting".as_ref(),
            recipient.as_ref(),
            &[bump],
        ];
        let signer = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vesting_token_account.to_account_info(),
                    to: ctx.accounts.recipient_token_account.to_account_info(),
                    authority: ctx.accounts.vesting.to_account_info(),
                },
                signer,
            ),
            releasable,
        )?;

        msg!("Released {} tokens", releasable);
        Ok(())
    }

    /// 查询可释放数量
    pub fn get_releasable(ctx: Context<GetReleasable>) -> Result<u64> {
        let vesting = &ctx.accounts.vesting;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;

        let releasable = calculate_releasable(
            vesting.total_amount,
            vesting.released_amount,
            vesting.start_time,
            vesting.cliff_seconds,
            vesting.duration_seconds,
            current_time,
        )?;

        Ok(releasable)
    }
}

/// 计算可释放数量
fn calculate_releasable(
    total_amount: u64,
    released_amount: u64,
    start_time: i64,
    cliff_seconds: i64,
    duration_seconds: i64,
    current_time: i64,
) -> Result<u64> {
    // 如果还没到 cliff 时间，返回 0
    let cliff_time = start_time.checked_add(cliff_seconds).ok_or(ErrorCode::Overflow)?;
    if current_time < cliff_time {
        return Ok(0);
    }

    // 如果已经超过释放期，返回全部剩余
    let end_time = start_time
        .checked_add(cliff_seconds)
        .and_then(|t| t.checked_add(duration_seconds))
        .ok_or(ErrorCode::Overflow)?;
    
    if current_time >= end_time {
        return Ok(total_amount.saturating_sub(released_amount));
    }

    // 计算线性释放
    let elapsed = current_time
        .checked_sub(cliff_time)
        .ok_or(ErrorCode::Overflow)?;
    
    let vested = (total_amount as u128)
        .checked_mul(elapsed as u128)
        .and_then(|v| v.checked_div(duration_seconds as u128))
        .ok_or(ErrorCode::Overflow)? as u64;

    let releasable = vested.saturating_sub(released_amount);
    Ok(releasable)
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub recipient: Signer<'info>,

    #[account(
        init,
        payer = recipient,
        space = 8 + VestingAccount::INIT_SPACE,
        seeds = [b"vesting", recipient.key().as_ref()],
        bump
    )]
    pub vesting: Account<'info, VestingAccount>,

    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Release<'info> {
    #[account(
        mut,
        seeds = [b"vesting", vesting.recipient.as_ref()],
        bump = vesting.bump
    )]
    pub vesting: Account<'info, VestingAccount>,

    #[account(mut)]
    pub vesting_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub recipient: SystemAccount<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct GetReleasable<'info> {
    #[account(
        seeds = [b"vesting", vesting.recipient.as_ref()],
        bump = vesting.bump
    )]
    pub vesting: Account<'info, VestingAccount>,
}

#[account]
#[derive(InitSpace)]
pub struct VestingAccount {
    pub recipient: Pubkey,
    pub token_account: Pubkey,
    pub total_amount: u64,
    pub released_amount: u64,
    pub start_time: i64,
    pub cliff_seconds: i64,
    pub duration_seconds: i64,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("No tokens available to release")]
    NoTokensToRelease,
    #[msg("Arithmetic overflow")]
    Overflow,
}
