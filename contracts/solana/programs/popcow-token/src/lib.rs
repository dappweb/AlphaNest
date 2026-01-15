use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("PopCow1111111111111111111111111111111111111");

#[program]
pub mod popcow_token {
    use super::*;

    /// 初始化代币配置
    pub fn initialize(
        ctx: Context<Initialize>,
        total_supply: u64,
        decimals: u8,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.mint = ctx.accounts.mint.key();
        config.total_supply = total_supply;
        config.decimals = decimals;
        config.total_burned = 0;
        config.burn_rate = 20; // 20% 交易费用于销毁
        config.is_paused = false;
        config.bump = ctx.bumps.config;

        msg!("PopCow Token initialized with supply: {}", total_supply);
        Ok(())
    }

    /// 铸造代币 (仅限管理员)
    pub fn mint_tokens(
        ctx: Context<MintTokens>,
        amount: u64,
    ) -> Result<()> {
        require!(!ctx.accounts.config.is_paused, ErrorCode::TokenPaused);
        require!(
            ctx.accounts.authority.key() == ctx.accounts.config.authority,
            ErrorCode::Unauthorized
        );

        let seeds = &[
            b"config".as_ref(),
            &[ctx.accounts.config.bump],
        ];
        let signer = &[&seeds[..]];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: ctx.accounts.config.to_account_info(),
                },
                signer,
            ),
            amount,
        )?;

        msg!("Minted {} tokens", amount);
        Ok(())
    }

    /// 销毁代币
    pub fn burn_tokens(
        ctx: Context<BurnTokens>,
        amount: u64,
    ) -> Result<()> {
        require!(!ctx.accounts.config.is_paused, ErrorCode::TokenPaused);

        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Burn {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: ctx.accounts.source.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;

        let config = &mut ctx.accounts.config;
        config.total_burned = config.total_burned.checked_add(amount).unwrap();

        msg!("Burned {} tokens, total burned: {}", amount, config.total_burned);
        Ok(())
    }

    /// 转账 (带销毁机制)
    pub fn transfer_with_burn(
        ctx: Context<TransferWithBurn>,
        amount: u64,
    ) -> Result<()> {
        require!(!ctx.accounts.config.is_paused, ErrorCode::TokenPaused);

        let burn_amount = amount
            .checked_mul(ctx.accounts.config.burn_rate as u64)
            .unwrap()
            .checked_div(1000)
            .unwrap();
        let transfer_amount = amount.checked_sub(burn_amount).unwrap();

        // 转账
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.source.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            transfer_amount,
        )?;

        // 销毁
        if burn_amount > 0 {
            token::burn(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    token::Burn {
                        mint: ctx.accounts.mint.to_account_info(),
                        from: ctx.accounts.source.to_account_info(),
                        authority: ctx.accounts.authority.to_account_info(),
                    },
                ),
                burn_amount,
            )?;

            let config = &mut ctx.accounts.config;
            config.total_burned = config.total_burned.checked_add(burn_amount).unwrap();
        }

        msg!("Transferred {} tokens, burned {}", transfer_amount, burn_amount);
        Ok(())
    }

    /// 更新销毁率 (仅限管理员)
    pub fn update_burn_rate(
        ctx: Context<UpdateConfig>,
        new_rate: u16,
    ) -> Result<()> {
        require!(new_rate <= 100, ErrorCode::InvalidBurnRate); // 最大10%
        
        let config = &mut ctx.accounts.config;
        config.burn_rate = new_rate;

        msg!("Burn rate updated to {}%", new_rate as f64 / 10.0);
        Ok(())
    }

    /// 暂停/恢复代币 (仅限管理员)
    pub fn set_paused(
        ctx: Context<UpdateConfig>,
        paused: bool,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.is_paused = paused;

        msg!("Token paused: {}", paused);
        Ok(())
    }

    /// 转移管理权限
    pub fn transfer_authority(
        ctx: Context<UpdateConfig>,
        new_authority: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = new_authority;

        msg!("Authority transferred to: {}", new_authority);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + TokenConfig::INIT_SPACE,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, TokenConfig>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, TokenConfig>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, TokenConfig>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub source: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferWithBurn<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, TokenConfig>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub source: Account<'info, TokenAccount>,

    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.authority == authority.key() @ ErrorCode::Unauthorized
    )]
    pub config: Account<'info, TokenConfig>,
}

#[account]
#[derive(InitSpace)]
pub struct TokenConfig {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub total_supply: u64,
    pub decimals: u8,
    pub total_burned: u64,
    pub burn_rate: u16,      // 基点 (10 = 1%)
    pub is_paused: bool,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Token is paused")]
    TokenPaused,
    #[msg("Invalid burn rate (max 10%)")]
    InvalidBurnRate,
    #[msg("Insufficient balance")]
    InsufficientBalance,
}
