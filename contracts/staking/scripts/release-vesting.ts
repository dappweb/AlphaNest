import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import { TOKEN_VESTING_PROGRAM_ID } from './constants';

// 加载部署信息
function loadDeploymentInfo(): any {
  const deploymentPath = path.join(process.cwd(), 'popcow-token-deployment.json');
  if (!fs.existsSync(deploymentPath)) {
    throw new Error('部署信息文件不存在，请先运行 deploy-popcow-token.ts');
  }
  return JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
}

// 计算可释放数量
async function getReleasable(
  connection: Connection,
  program: Program,
  recipient: PublicKey,
  vestingPubkey: PublicKey
): Promise<number> {
  try {
    const releasable = await program.methods
      .getReleasable()
      .accounts({
        vesting: vestingPubkey,
      })
      .view();
    
    return Number(releasable);
  } catch (err) {
    console.error('查询可释放数量失败:', err);
    return 0;
  }
}

// 释放代币
async function releaseTokens(
  connection: Connection,
  program: Program,
  wallet: Keypair,
  recipient: PublicKey,
  vestingPubkey: PublicKey,
  tokenMint: PublicKey
): Promise<void> {
  const vestingTokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    vestingPubkey
  );
  
  const recipientTokenAccount = await getAssociatedTokenAddress(
    tokenMint,
    recipient
  );

  try {
    const tx = await program.methods
      .release()
      .accounts({
        vesting: vestingPubkey,
        vestingTokenAccount,
        recipientTokenAccount,
        recipient: recipient,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log(`✅ 释放成功! 交易签名: ${tx}`);
  } catch (err) {
    console.error('释放失败:', err);
    throw err;
  }
}

// 主函数
async function main() {
  console.log('🔓 PopCowDefi 代币释放脚本\n');

  // 加载部署信息
  const deployment = loadDeploymentInfo();
  const tokenMint = new PublicKey(deployment.token.mint);

  // 连接 Solana
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');
  console.log(`📡 连接到: ${rpcUrl}\n`);

  // 加载钱包
  const walletPath = process.env.WALLET_PATH || '~/.config/solana/id.json';
  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
  );
  console.log(`💰 钱包地址: ${walletKeypair.publicKey.toBase58()}\n`);

  // 创建 Provider 和 Program
  const wallet = new Wallet(walletKeypair);
  const provider = new AnchorProvider(connection, wallet, {});
  // 注意: 这里需要实际的 IDL 文件
  // const program = new Program(idl, TOKEN_VESTING_PROGRAM_ID, provider);

  console.log('📋 检查各分配池的可释放数量...\n');

  // 遍历所有分配池
  for (const allocation of deployment.allocations) {
    if (allocation.vesting === null) {
      console.log(`⏭️  ${allocation.category}: 无需释放 (TGE 已全部释放)`);
      continue;
    }

    const recipient = new PublicKey(allocation.address);
    
    // 计算 vesting PDA
    const [vestingPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from('vesting'), recipient.toBuffer()],
      TOKEN_VESTING_PROGRAM_ID
    );

    console.log(`📦 ${allocation.category}:`);
    console.log(`   地址: ${allocation.address}`);
    console.log(`   总量: ${allocation.amount.toLocaleString()} tokens`);

    // 查询可释放数量
    // const releasable = await getReleasable(connection, program, recipient, vestingPubkey);
    // console.log(`   可释放: ${releasable.toLocaleString()} tokens`);

    // 如果有可释放的代币，执行释放
    // if (releasable > 0) {
    //   console.log(`   🔓 释放 ${releasable.toLocaleString()} tokens...`);
    //   await releaseTokens(connection, program, walletKeypair, recipient, vestingPubkey, tokenMint);
    // } else {
    //   console.log(`   ⏸️  暂无代币可释放`);
    // }
    
    console.log('');
  }

  console.log('✅ 检查完成');
}

// 执行
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ 错误:', err);
      process.exit(1);
    });
}

export { main as releaseVesting };
