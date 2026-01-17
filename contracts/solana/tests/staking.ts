import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createMint, mintTo } from '@solana/spl-token';
import { expect } from 'chai';

describe('popcow-staking', () => {
  // 配置 Anchor 提供者
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // 加载程序
  const program = anchor.workspace.PopcowStaking as Program;
  
  // 测试账户
  const authority = provider.wallet;
  let stakeMint: PublicKey;
  let rewardMint: PublicKey;
  let poolPda: PublicKey;
  let stakeVaultPda: PublicKey;
  let rewardVaultPda: PublicKey;
  let poolBump: number;

  // 测试用户
  const user = Keypair.generate();
  let userStakeAta: PublicKey;
  let userRewardAta: PublicKey;
  let stakeAccountPda: PublicKey;

  // 奖励率: 7.6 POPCOW DEFI/秒 (基于 6 decimals)
  const REWARD_RATE = new anchor.BN(7_600_000);

  before(async () => {
    console.log('Setting up test environment...');
    
    // 计算 PDA
    [poolPda, poolBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('pool')],
      program.programId
    );
    [stakeVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('stake_vault')],
      program.programId
    );
    [rewardVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('reward_vault')],
      program.programId
    );

    console.log('Pool PDA:', poolPda.toBase58());
    console.log('Stake Vault PDA:', stakeVaultPda.toBase58());
    console.log('Reward Vault PDA:', rewardVaultPda.toBase58());

    // 创建测试代币
    stakeMint = await createMint(
      provider.connection,
      (authority as any).payer,
      authority.publicKey,
      null,
      6 // POPCOW decimals
    );
    console.log('Stake Mint:', stakeMint.toBase58());

    rewardMint = await createMint(
      provider.connection,
      (authority as any).payer,
      authority.publicKey,
      null,
      6 // POPCOW DEFI decimals
    );
    console.log('Reward Mint:', rewardMint.toBase58());

    // 空投 SOL 给测试用户
    const airdropSig = await provider.connection.requestAirdrop(
      user.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);
    console.log('User:', user.publicKey.toBase58());

    // 获取用户 ATA
    userStakeAta = await getAssociatedTokenAddress(stakeMint, user.publicKey);
    userRewardAta = await getAssociatedTokenAddress(rewardMint, user.publicKey);
    
    [stakeAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('stake'), user.publicKey.toBuffer()],
      program.programId
    );
    console.log('User Stake Account PDA:', stakeAccountPda.toBase58());
  });

  it('Initializes the staking pool', async () => {
    const tx = await program.methods
      .initializePool(REWARD_RATE)
      .accounts({
        authority: authority.publicKey,
        pool: poolPda,
        stakeMint: stakeMint,
        rewardMint: rewardMint,
        stakeVault: stakeVaultPda,
        rewardVault: rewardVaultPda,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log('Initialize Pool TX:', tx);

    // 验证池子状态
    const pool = await program.account.stakingPool.fetch(poolPda);
    expect(pool.authority.toBase58()).to.equal(authority.publicKey.toBase58());
    expect(pool.stakeMint.toBase58()).to.equal(stakeMint.toBase58());
    expect(pool.rewardMint.toBase58()).to.equal(rewardMint.toBase58());
    expect(pool.totalStaked.toNumber()).to.equal(0);
    expect(pool.rewardRatePerSecond.toNumber()).to.equal(REWARD_RATE.toNumber());
    expect(pool.conversionRate).to.equal(2); // 1:2 比例
    expect(pool.isPaused).to.equal(false);

    console.log('✅ Pool initialized successfully');
    console.log('   Conversion Rate: 1:', pool.conversionRate);
    console.log('   Reward Rate:', pool.rewardRatePerSecond.toNumber() / 1e6, 'DEFI/second');
  });

  it('Stakes tokens with Flexible period', async () => {
    // 先给用户铸造一些质押代币
    const mintAmount = 10000 * 1e6; // 10000 POPCOW
    await mintTo(
      provider.connection,
      (authority as any).payer,
      stakeMint,
      userStakeAta,
      authority.publicKey,
      mintAmount
    );

    const stakeAmount = new anchor.BN(1000 * 1e6); // 1000 POPCOW

    const tx = await program.methods
      .stake(stakeAmount, { flexible: {} })
      .accounts({
        user: user.publicKey,
        pool: poolPda,
        stakeAccount: stakeAccountPda,
        userStakeToken: userStakeAta,
        stakeVault: stakeVaultPda,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    console.log('Stake TX:', tx);

    // 验证质押状态
    const stakeAccount = await program.account.stakeAccount.fetch(stakeAccountPda);
    expect(stakeAccount.owner.toBase58()).to.equal(user.publicKey.toBase58());
    expect(stakeAccount.stakedAmount.toNumber()).to.equal(stakeAmount.toNumber());

    const pool = await program.account.stakingPool.fetch(poolPda);
    expect(pool.totalStaked.toNumber()).to.equal(stakeAmount.toNumber());

    console.log('✅ Staked successfully');
    console.log('   Amount:', stakeAccount.stakedAmount.toNumber() / 1e6, 'POPCOW');
  });

  it('Adds rewards to the pool', async () => {
    // 铸造奖励代币到管理员账户
    const authorityRewardAta = await getAssociatedTokenAddress(rewardMint, authority.publicKey);
    const rewardAmount = 1000000 * 1e6; // 100万 POPCOW DEFI

    await mintTo(
      provider.connection,
      (authority as any).payer,
      rewardMint,
      authorityRewardAta,
      authority.publicKey,
      rewardAmount
    );

    const addAmount = new anchor.BN(100000 * 1e6); // 10万 POPCOW DEFI

    const tx = await program.methods
      .addRewards(addAmount)
      .accounts({
        authority: authority.publicKey,
        pool: poolPda,
        authorityRewardToken: authorityRewardAta,
        rewardVault: rewardVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log('Add Rewards TX:', tx);
    console.log('✅ Added', addAmount.toNumber() / 1e6, 'POPCOW DEFI rewards');
  });

  it('Claims rewards', async () => {
    // 等待一段时间让奖励累积
    await new Promise(resolve => setTimeout(resolve, 2000));

    const tx = await program.methods
      .claimRewards()
      .accounts({
        user: user.publicKey,
        pool: poolPda,
        stakeAccount: stakeAccountPda,
        userRewardToken: userRewardAta,
        rewardVault: rewardVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    console.log('Claim Rewards TX:', tx);

    const stakeAccount = await program.account.stakeAccount.fetch(stakeAccountPda);
    console.log('✅ Claimed rewards');
    console.log('   Total Claimed:', stakeAccount.totalRewardsClaimed.toNumber() / 1e6, 'POPCOW DEFI');
  });

  it('Unstakes tokens', async () => {
    const unstakeAmount = new anchor.BN(500 * 1e6); // 500 POPCOW

    const tx = await program.methods
      .unstake(unstakeAmount)
      .accounts({
        user: user.publicKey,
        pool: poolPda,
        stakeAccount: stakeAccountPda,
        userStakeToken: userStakeAta,
        stakeVault: stakeVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    console.log('Unstake TX:', tx);

    const stakeAccount = await program.account.stakeAccount.fetch(stakeAccountPda);
    console.log('✅ Unstaked successfully');
    console.log('   Remaining Staked:', stakeAccount.stakedAmount.toNumber() / 1e6, 'POPCOW');
  });

  it('Updates reward rate', async () => {
    const newRate = new anchor.BN(10_000_000); // 10 POPCOW DEFI/秒

    const tx = await program.methods
      .updateRewardRate(newRate)
      .accounts({
        authority: authority.publicKey,
        pool: poolPda,
      })
      .rpc();

    console.log('Update Reward Rate TX:', tx);

    const pool = await program.account.stakingPool.fetch(poolPda);
    expect(pool.rewardRatePerSecond.toNumber()).to.equal(newRate.toNumber());

    console.log('✅ Reward rate updated to', pool.rewardRatePerSecond.toNumber() / 1e6, 'DEFI/second');
  });

  it('Pauses and unpauses the pool', async () => {
    // 暂停
    await program.methods
      .setPoolPaused(true)
      .accounts({
        authority: authority.publicKey,
        pool: poolPda,
      })
      .rpc();

    let pool = await program.account.stakingPool.fetch(poolPda);
    expect(pool.isPaused).to.equal(true);
    console.log('✅ Pool paused');

    // 恢复
    await program.methods
      .setPoolPaused(false)
      .accounts({
        authority: authority.publicKey,
        pool: poolPda,
      })
      .rpc();

    pool = await program.account.stakingPool.fetch(poolPda);
    expect(pool.isPaused).to.equal(false);
    console.log('✅ Pool unpaused');
  });
});
