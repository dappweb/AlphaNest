/**
 * CowGuard 保险协议初始化脚本
 * 
 * 使用方法:
 * npx ts-node scripts/initialize-insurance.ts
 */

import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import * as fs from 'fs';
import * as path from 'path';

// 配置
const NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl(NETWORK as any);

// 保险程序 ID (部署后填入)
const INSURANCE_PROGRAM_ID = new PublicKey('212XVhDqD21uFt1DfCuJ7WkVjcZZQCZRHDi3qeXTCqCH');

// 国库费率 (5% = 500 基点)
const TREASURY_FEE = 500;

// 保险产品配置
const INSURANCE_PRODUCTS = [
  {
    type: 0, // RugPull
    name: 'Rug Pull 保险',
    premiumRate: 500,    // 5%
    coverageRate: 8000,  // 80%
    minCoverage: 100_000_000,   // $100 (6 decimals)
    maxCoverage: 50_000_000_000, // $50,000
    durationDays: 30,
  },
  {
    type: 1, // PriceDrop
    name: '价格下跌保险',
    premiumRate: 300,    // 3%
    coverageRate: 7000,  // 70%
    minCoverage: 50_000_000,    // $50
    maxCoverage: 100_000_000_000, // $100,000
    durationDays: 14,
  },
  {
    type: 2, // SmartContract
    name: '智能合约保险',
    premiumRate: 200,    // 2%
    coverageRate: 9000,  // 90%
    minCoverage: 100_000_000,   // $100
    maxCoverage: 200_000_000_000, // $200,000
    durationDays: 90,
  },
  {
    type: 3, // Comprehensive
    name: '综合保险',
    premiumRate: 800,    // 8%
    coverageRate: 8500,  // 85%
    minCoverage: 500_000_000,   // $500
    maxCoverage: 500_000_000_000, // $500,000
    durationDays: 30,
  },
];

async function main() {
  console.log('🛡️ CowGuard 保险协议初始化脚本');
  console.log('================================');
  console.log(`网络: ${NETWORK}`);
  console.log(`RPC: ${RPC_URL}`);
  console.log('');

  // 加载钱包
  const walletPath = process.env.WALLET_PATH || path.join(process.env.HOME!, '.config/solana/id.json');
  if (!fs.existsSync(walletPath)) {
    console.error('❌ 钱包文件不存在:', walletPath);
    console.log('请设置 WALLET_PATH 环境变量或使用默认路径');
    process.exit(1);
  }

  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
  );
  console.log('📝 钱包地址:', walletKeypair.publicKey.toBase58());

  // 连接
  const connection = new Connection(RPC_URL, 'confirmed');
  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log('💰 SOL 余额:', balance / 1e9, 'SOL');
  console.log('');

  // 检查程序是否已部署
  const programInfo = await connection.getAccountInfo(INSURANCE_PROGRAM_ID);
  if (!programInfo) {
    console.error('❌ 保险程序尚未部署');
    console.log('请先运行: anchor deploy');
    process.exit(1);
  }
  console.log('✅ 保险程序已部署');

  // 计算 PDA 地址
  const [protocolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('protocol')],
    INSURANCE_PROGRAM_ID
  );

  console.log('📍 PDA 地址:');
  console.log('   Protocol:', protocolPda.toBase58());

  // 生成各产品的 PDA
  for (const product of INSURANCE_PRODUCTS) {
    const [productPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('product'), Buffer.from([product.type])],
      INSURANCE_PROGRAM_ID
    );
    console.log(`   Product [${product.name}]:`, productPda.toBase58());
  }
  console.log('');

  // 检查协议是否已初始化
  const protocolInfo = await connection.getAccountInfo(protocolPda);
  if (protocolInfo) {
    console.log('⚠️  保险协议已经初始化');
    console.log('如需重新初始化，请先关闭现有协议');
    return;
  }

  console.log('🚀 准备初始化保险协议...');
  console.log('   国库费率:', TREASURY_FEE / 100, '%');
  console.log('');
  console.log('   保险产品:');
  for (const product of INSURANCE_PRODUCTS) {
    console.log(`   - ${product.name}`);
    console.log(`     保费率: ${product.premiumRate / 100}%`);
    console.log(`     赔付率: ${product.coverageRate / 100}%`);
    console.log(`     保额范围: $${product.minCoverage / 1e6} - $${product.maxCoverage / 1e6}`);
    console.log(`     期限: ${product.durationDays} 天`);
    console.log('');
  }

  console.log('');
  console.log('📝 初始化命令:');
  console.log('');
  console.log('```typescript');
  console.log('// 1. 初始化协议');
  console.log('await program.methods');
  console.log(`  .initialize(${TREASURY_FEE})`);
  console.log('  .accounts({');
  console.log('    authority: wallet.publicKey,');
  console.log('    protocol: protocolPda,');
  console.log('    treasury: treasuryPubkey,');
  console.log('    systemProgram: SystemProgram.programId,');
  console.log('  })');
  console.log('  .rpc();');
  console.log('');
  console.log('// 2. 创建保险产品');
  for (const product of INSURANCE_PRODUCTS) {
    console.log(`// ${product.name}`);
    console.log('await program.methods');
    console.log(`  .createProduct(`);
    console.log(`    { ${['rugPull', 'priceDrop', 'smartContract', 'comprehensive'][product.type]}: {} },`);
    console.log(`    ${product.premiumRate},  // 保费率`);
    console.log(`    ${product.coverageRate}, // 赔付率`);
    console.log(`    new BN(${product.minCoverage}), // 最小保额`);
    console.log(`    new BN(${product.maxCoverage}), // 最大保额`);
    console.log(`    ${product.durationDays}   // 期限`);
    console.log('  )');
    console.log('  .accounts({');
    console.log('    authority: wallet.publicKey,');
    console.log('    protocol: protocolPda,');
    console.log(`    product: productPda_${product.type},`);
    console.log('    systemProgram: SystemProgram.programId,');
    console.log('  })');
    console.log('  .rpc();');
    console.log('');
  }
  console.log('```');

  console.log('');
  console.log('================================');
  console.log('✅ 脚本执行完成');
  console.log('');
  console.log('下一步:');
  console.log('1. 部署保险程序: anchor deploy');
  console.log('2. 运行测试: anchor test');
  console.log('3. 初始化协议和产品');
  console.log('4. 向保险池注入初始资金');
}

main().catch(console.error);
