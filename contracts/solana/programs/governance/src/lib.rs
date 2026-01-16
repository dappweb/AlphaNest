use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};

declare_id!("5QCNr7vD639eE1R3rbts78qYZQEyc3L8XJriHNcLNyLW");

#[program]
pub mod governance {
    use super::*;

    /// 创建治理提案
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        proposal_type: ProposalType,
        parameters: ProposalParameters,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let voter = &ctx.accounts.voter;

        // 检查最小持有量（100,000 POPCOW）
        require!(
            voter.token_amount >= 100_000 * 1_000_000_000, // 9 decimals
            ErrorCode::InsufficientTokens
        );

        proposal.author = ctx.accounts.authority.key();
        proposal.title = title;
        proposal.description = description;
        proposal.proposal_type = proposal_type;
        proposal.parameters = parameters;
        proposal.status = ProposalStatus::Active;
        proposal.votes_for = 0;
        proposal.votes_against = 0;
        proposal.total_votes = 0;
        proposal.created_at = Clock::get()?.unix_timestamp;
        proposal.voting_end_time = Clock::get()?.unix_timestamp + 7 * 86400; // 7 天投票期
        proposal.executed = false;
        proposal.bump = ctx.bumps.proposal;

        msg!("Proposal created: {}", proposal.title);
        Ok(())
    }

    /// 投票
    pub fn vote(
        ctx: Context<Vote>,
        vote_choice: VoteChoice,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let vote_record = &mut ctx.accounts.vote_record;
        let voter = &ctx.accounts.voter;
        let clock = Clock::get()?;

        require!(
            proposal.status == ProposalStatus::Active,
            ErrorCode::ProposalNotActive
        );
        require!(
            clock.unix_timestamp < proposal.voting_end_time,
            ErrorCode::VotingEnded
        );

        // 检查是否已投票
        if vote_record.voter != Pubkey::default() {
            require!(
                vote_record.voter == ctx.accounts.authority.key(),
                ErrorCode::AlreadyVoted
            );
            // 更新投票
            proposal.total_votes = proposal.total_votes.saturating_sub(vote_record.vote_weight);
            match vote_record.vote_choice {
                VoteChoice::For => {
                    proposal.votes_for = proposal.votes_for.saturating_sub(vote_record.vote_weight);
                }
                VoteChoice::Against => {
                    proposal.votes_against = proposal.votes_against.saturating_sub(vote_record.vote_weight);
                }
            }
        } else {
            vote_record.voter = ctx.accounts.authority.key();
            vote_record.proposal = proposal.key();
            vote_record.bump = ctx.bumps.vote_record;
        }

        // 计算投票权重（1 token = 1 vote）
        let vote_weight = voter.token_amount;

        vote_record.vote_choice = vote_choice;
        vote_record.vote_weight = vote_weight;
        vote_record.voted_at = clock.unix_timestamp;

        // 更新提案统计
        proposal.total_votes += vote_weight;
        match vote_choice {
            VoteChoice::For => {
                proposal.votes_for += vote_weight;
            }
            VoteChoice::Against => {
                proposal.votes_against += vote_weight;
            }
        }

        msg!("Vote cast: {:?} with weight {}", vote_choice, vote_weight);
        Ok(())
    }

    /// 执行提案（投票通过后）
    pub fn execute_proposal(
        ctx: Context<ExecuteProposal>,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let clock = Clock::get()?;

        require!(
            proposal.status == ProposalStatus::Active,
            ErrorCode::ProposalNotActive
        );
        require!(
            clock.unix_timestamp >= proposal.voting_end_time,
            ErrorCode::VotingNotEnded
        );
        require!(
            !proposal.executed,
            ErrorCode::ProposalAlreadyExecuted
        );

        // 检查是否通过（需要 > 50% 支持）
        let total_votes = proposal.votes_for + proposal.votes_against;
        require!(
            total_votes > 0,
            ErrorCode::NoVotes
        );

        let support_rate = (proposal.votes_for as f64 / total_votes as f64) * 100.0;
        require!(
            support_rate > 50.0,
            ErrorCode::ProposalNotPassed
        );

        // 执行提案
        match proposal.proposal_type {
            ProposalType::ParameterChange => {
                execute_parameter_change(&ctx, &proposal.parameters)?;
            }
            ProposalType::TreasurySpending => {
                execute_treasury_spending(&ctx, &proposal.parameters)?;
            }
            ProposalType::FeatureLaunch => {
                execute_feature_launch(&ctx, &proposal.parameters)?;
            }
            ProposalType::TokenDistribution => {
                execute_token_distribution(&ctx, &proposal.parameters)?;
            }
        }

        proposal.status = ProposalStatus::Executed;
        proposal.executed = true;
        proposal.executed_at = clock.unix_timestamp;

        msg!("Proposal executed: {}", proposal.title);
        Ok(())
    }

    /// 取消提案（仅限作者）
    pub fn cancel_proposal(
        ctx: Context<CancelProposal>,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;

        require!(
            proposal.author == ctx.accounts.authority.key(),
            ErrorCode::Unauthorized
        );
        require!(
            proposal.status == ProposalStatus::Active,
            ErrorCode::ProposalNotActive
        );

        proposal.status = ProposalStatus::Cancelled;

        msg!("Proposal cancelled: {}", proposal.title);
        Ok(())
    }
}

// ============== 执行函数 ==============

fn execute_parameter_change(
    ctx: &Context<ExecuteProposal>,
    params: &ProposalParameters,
) -> Result<()> {
    // 实际执行参数变更
    // 这里需要根据具体参数类型执行相应操作
    msg!("Executing parameter change");
    Ok(())
}

fn execute_treasury_spending(
    ctx: &Context<ExecuteProposal>,
    params: &ProposalParameters,
) -> Result<()> {
    // 执行国库支出
    // 需要多签钱包确认
    msg!("Executing treasury spending");
    Ok(())
}

fn execute_feature_launch(
    ctx: &Context<ExecuteProposal>,
    params: &ProposalParameters,
) -> Result<()> {
    // 执行功能上线
    msg!("Executing feature launch");
    Ok(())
}

fn execute_token_distribution(
    ctx: &Context<ExecuteProposal>,
    params: &ProposalParameters,
) -> Result<()> {
    // 执行代币分配
    msg!("Executing token distribution");
    Ok(())
}

// ============== 账户结构 ==============

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Proposal::INIT_SPACE,
        seeds = [b"proposal", &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        constraint = voter.owner == authority.key() @ ErrorCode::Unauthorized
    )]
    /// CHECK: Voter token account
    pub voter: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + VoteRecord::INIT_SPACE,
        seeds = [b"vote", proposal.key().as_ref(), authority.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(
        constraint = voter.owner == authority.key() @ ErrorCode::Unauthorized
    )]
    /// CHECK: Voter token account
    pub voter: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    pub executor: Signer<'info>,

    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    /// CHECK: Executor authority
    pub executor_authority: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CancelProposal<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        constraint = proposal.author == authority.key() @ ErrorCode::Unauthorized
    )]
    pub proposal: Account<'info, Proposal>,
}

// ============== 数据结构 ==============

#[account]
#[derive(InitSpace)]
pub struct Proposal {
    pub author: Pubkey,
    #[max_len(100)]
    pub title: String,
    #[max_len(1000)]
    pub description: String,
    pub proposal_type: ProposalType,
    pub parameters: ProposalParameters,
    pub status: ProposalStatus,
    pub votes_for: u64,
    pub votes_against: u64,
    pub total_votes: u64,
    pub created_at: i64,
    pub voting_end_time: i64,
    pub executed: bool,
    pub executed_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct VoteRecord {
    pub voter: Pubkey,
    pub proposal: Pubkey,
    pub vote_choice: VoteChoice,
    pub vote_weight: u64,
    pub voted_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum ProposalType {
    ParameterChange,    // 参数变更
    TreasurySpending,  // 国库支出
    FeatureLaunch,     // 功能上线
    TokenDistribution, // 代币分配
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum ProposalStatus {
    Active,
    Executed,
    Rejected,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum VoteChoice {
    For,
    Against,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct ProposalParameters {
    pub data: Vec<u8>, // 序列化的参数数据
}

// ============== 错误码 ==============

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Insufficient tokens to create proposal")]
    InsufficientTokens,
    #[msg("Proposal is not active")]
    ProposalNotActive,
    #[msg("Voting has ended")]
    VotingEnded,
    #[msg("Voting has not ended yet")]
    VotingNotEnded,
    #[msg("Already voted")]
    AlreadyVoted,
    #[msg("Proposal already executed")]
    ProposalAlreadyExecuted,
    #[msg("No votes cast")]
    NoVotes,
    #[msg("Proposal did not pass")]
    ProposalNotPassed,
}
