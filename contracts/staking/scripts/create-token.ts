import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  getMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import * as fs from 'fs';

// 配置
const RPC_ENDPOINT = 'https://api.devnet.solana.com'; // 生产环境改为 mainnet
const TOKEN_DECIMALS = 9;
const TOTAL_SUPPLY = 100_000_000; // 1亿 $PopCowDefi

async function createPopCowDefiToken() {
  console.log('🐄 Creating $PopCowDefi Token...\n');

  // 连接 Solana
  const connection = new Connection(RPC_ENDPOINT, 'confirmed');

  // 加载钱包 (生产环境使用安全方式)
  const walletPath = process.env.WALLET_PATH || '~/.config/solana/id.json';
  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
  );
  console.log('Wallet:', walletKeypair.publicKey.toBase58());

  // 创建代币铸造账户
  const mintKeypair = Keypair.generate();
  console.log('Token Mint:', mintKeypair.publicKey.toBase58());

  // 获取创建账户所需租金
  const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

  // 创建交易
  const transaction = new Transaction().add(
    // 创建账户
    SystemProgram.createAccount({
      fromPubkey: walletKeypair.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    // 初始化铸造账户
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      TOKEN_DECIMALS,
      walletKeypair.publicKey, // mint authority
      walletKeypair.publicKey  // freeze authority (可设为 null 放弃)
    )
  );

  // 发送交易
  console.log('\n📤 Sending transaction...');
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [walletKeypair, mintKeypair]
  );
  console.log('✅ Token created! Signature:', signature);

  // 创建关联代币账户
  const ata = await getAssociatedTokenAddress(
    mintKeypair.publicKey,
    walletKeypair.publicKey
  );

  const ataTransaction = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      walletKeypair.publicKey,
      ata,
      walletKeypair.publicKey,
      mintKeypair.publicKey
    )
  );

  console.log('\n📤 Creating associated token account...');
  await sendAndConfirmTransaction(connection, ataTransaction, [walletKeypair]);
  console.log('✅ ATA created:', ata.toBase58());

  // 铸造代币
  const mintAmount = TOTAL_SUPPLY * Math.pow(10, TOKEN_DECIMALS);
  const mintTransaction = new Transaction().add(
    createMintToInstruction(
      mintKeypair.publicKey,
      ata,
      walletKeypair.publicKey,
      BigInt(mintAmount)
    )
  );

  console.log('\n📤 Minting tokens...');
  await sendAndConfirmTransaction(connection, mintTransaction, [walletKeypair]);
  console.log(`✅ Minted ${TOTAL_SUPPLY.toLocaleString()} $PopCowDefi tokens!`);

  // 保存代币信息
  const tokenInfo = {
    name: 'PopCow Defi Token',
    symbol: 'PopCowDefi',
    decimals: TOKEN_DECIMALS,
    mint: mintKeypair.publicKey.toBase58(),
    totalSupply: TOTAL_SUPPLY,
    authority: walletKeypair.publicKey.toBase58(),
    createdAt: new Date().toISOString(),
    network: RPC_ENDPOINT.includes('devnet') ? 'devnet' : 'mainnet-beta',
  };

  fs.writeFileSync(
    './token-info.json',
    JSON.stringify(tokenInfo, null, 2)
  );
  console.log('\n📁 Token info saved to token-info.json');

  console.log('\n🎉 $PopCowDefi Token Creation Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Token Mint:', mintKeypair.publicKey.toBase58());
  console.log('Total Supply:', TOTAL_SUPPLY.toLocaleString());
  console.log('Decimals:', TOKEN_DECIMALS);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 返回私钥用于备份 (生产环境请安全保存!)
  console.log('\n⚠️  IMPORTANT: Save these keys securely!');
  console.log('Mint Private Key:', Buffer.from(mintKeypair.secretKey).toString('base64'));

  return {
    mint: mintKeypair.publicKey,
    authority: walletKeypair.publicKey,
  };
}

// 运行
createPopCowDefiToken()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
