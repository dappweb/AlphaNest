import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import {
  BPF_LOADER_UPGRADEABLE_PROGRAM_ID,
  createUpgradeInstruction,
  getProgramDataAddress,
} from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import * as anchor from '@coral-xyz/anchor';

/**
 * 升级 Solana 程序脚本
 * 
 * 使用前确保:
 * 1. 已编译新版本程序 (anchor build)
 * 2. 有升级权限的私钥
 * 3. 程序 ID 正确
 */

interface UpgradeConfig {
  programId: string;
  upgradeAuthority: string; // 私钥文件路径或 base58 字符串
  programSoPath: string; // 编译后的 .so 文件路径
  rpcUrl?: string;
}

async function upgradeProgram(config: UpgradeConfig) {
  console.log('🔄 开始升级程序...\n');

  // 连接 Solana
  const rpcUrl = config.rpcUrl || process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');
  console.log(`📡 连接到: ${rpcUrl}`);

  // 加载升级权限
  let upgradeAuthority: Keypair;
  if (fs.existsSync(config.upgradeAuthority)) {
    // 从文件加载
    const secretKey = JSON.parse(fs.readFileSync(config.upgradeAuthority, 'utf-8'));
    upgradeAuthority = Keypair.fromSecretKey(Uint8Array.from(secretKey));
  } else {
    // 假设是 base58 字符串（需要转换）
    throw new Error('请提供升级权限私钥文件路径');
  }
  console.log(`🔑 升级权限地址: ${upgradeAuthority.publicKey.toBase58()}\n`);

  // 程序 ID
  const programId = new PublicKey(config.programId);
  console.log(`📦 程序 ID: ${programId.toBase58()}`);

  // 获取程序数据地址
  const programDataAddress = getProgramDataAddress(programId);
  console.log(`📊 程序数据地址: ${programDataAddress.toBase58()}`);

  // 检查程序数据账户
  const programData = await connection.getAccountInfo(programDataAddress);
  if (!programData) {
    throw new Error('程序数据账户不存在，请确认程序 ID 正确');
  }

  // 检查升级权限
  const upgradeAuthorityInfo = programData.owner;
  if (!upgradeAuthorityInfo.equals(upgradeAuthority.publicKey)) {
    console.warn('⚠️  警告: 当前账户可能不是升级权限');
    console.warn(`   程序升级权限: ${upgradeAuthorityInfo.toBase58()}`);
    console.warn(`   当前账户: ${upgradeAuthority.publicKey.toBase58()}`);
  }

  // 读取新程序文件
  if (!fs.existsSync(config.programSoPath)) {
    throw new Error(`程序文件不存在: ${config.programSoPath}`);
  }
  const programBuffer = fs.readFileSync(config.programSoPath);
  console.log(`📁 程序文件大小: ${(programBuffer.length / 1024).toFixed(2)} KB\n`);

  // 创建升级指令
  console.log('📝 创建升级交易...');
  const transaction = new Transaction().add(
    createUpgradeInstruction(
      programDataAddress,
      programId,
      upgradeAuthority.publicKey
    )
  );

  // 发送交易（需要先部署新程序到缓冲区）
  // 注意: 实际升级需要两步:
  // 1. 部署新程序到缓冲区
  // 2. 执行升级指令

  console.log('⚠️  注意: 完整升级流程需要:');
  console.log('   1. 部署新程序: solana program deploy <new_program.so> --program-id <PROGRAM_ID>');
  console.log('   2. 或使用 Anchor: anchor upgrade --program-id <PROGRAM_ID>');
  console.log('');
  console.log('📚 参考文档:');
  console.log('   https://docs.solana.com/cli/deploy-a-program#upgrading-a-program');
  console.log('   https://www.anchor-lang.com/docs/upgrading');
}

// 使用 Anchor 升级（推荐）
async function upgradeWithAnchor(
  programId: string,
  upgradeAuthority: string,
  cluster: 'devnet' | 'mainnet-beta' = 'devnet'
) {
  console.log('🔄 使用 Anchor 升级程序...\n');

  console.log('📝 执行以下命令:');
  console.log('');
  console.log(`   anchor upgrade ${programId} \\`);
  console.log(`     --provider.cluster ${cluster} \\`);
  console.log(`     --provider.wallet ${upgradeAuthority}`);
  console.log('');
  console.log('或使用环境变量:');
  console.log(`   export ANCHOR_PROVIDER_URL=https://api.${cluster}.solana.com`);
  console.log(`   export ANCHOR_WALLET=${upgradeAuthority}`);
  console.log(`   anchor upgrade ${programId}`);
  console.log('');
}

// 主函数
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('📖 使用方法:');
    console.log('');
    console.log('  方式 1: 使用 Anchor（推荐）');
    console.log('    npx ts-node upgrade-program.ts anchor <PROGRAM_ID> <UPGRADE_AUTHORITY_PATH> [cluster]');
    console.log('');
    console.log('  方式 2: 手动升级');
    console.log('    npx ts-node upgrade-program.ts manual <PROGRAM_ID> <UPGRADE_AUTHORITY_PATH> <PROGRAM_SO_PATH>');
    console.log('');
    console.log('示例:');
    console.log('  npx ts-node upgrade-program.ts anchor PopCow1111111111111111111111111111111111111 ~/.config/solana/id.json devnet');
    return;
  }

  const mode = args[0];

  if (mode === 'anchor') {
    const programId = args[1];
    const upgradeAuthority = args[2];
    const cluster = (args[3] as 'devnet' | 'mainnet-beta') || 'devnet';

    await upgradeWithAnchor(programId, upgradeAuthority, cluster);
  } else if (mode === 'manual') {
    const config: UpgradeConfig = {
      programId: args[1],
      upgradeAuthority: args[2],
      programSoPath: args[3],
      rpcUrl: args[4],
    };

    await upgradeProgram(config);
  } else {
    console.error('❌ 未知模式:', mode);
    console.log('使用 "anchor" 或 "manual"');
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ 错误:', err);
      process.exit(1);
    });
}

export { upgradeProgram, upgradeWithAnchor };
