const { Keypair } = require('@solana/web3.js');
const fs = require('fs');
const { join } = require('path');

// 程序列表
const programs = [
  { name: 'popcow_token', dir: 'popcow-token', idName: 'popcow_token' },
  { name: 'cowguard_insurance', dir: 'cowguard-insurance', idName: 'cowguard_insurance' },
  { name: 'popcow_staking', dir: 'staking', idName: 'popcow_staking' },
  { name: 'token_vesting', dir: 'token-vesting', idName: 'token_vesting' },
  { name: 'yield_vault', dir: 'yield-vault', idName: 'yield_vault' },
  { name: 'multi_asset_staking', dir: 'multi-asset-staking', idName: 'multi_asset_staking' },
  { name: 'reputation_registry', dir: 'reputation-registry', idName: 'reputation_registry' },
  { name: 'governance', dir: 'governance', idName: 'governance' },
  { name: 'points_system', dir: 'points-system', idName: 'points_system' },
  { name: 'referral_system', dir: 'referral-system', idName: 'referral_system' },
];

const targetDir = join(__dirname, 'target', 'deploy');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

console.log('生成程序 keypair...\n');

programs.forEach(({ name, dir, idName }) => {
  const keypair = Keypair.generate();
  const keypairFile = join(targetDir, `${name}-keypair.json`);
  
  // 保存 keypair
  fs.writeFileSync(keypairFile, JSON.stringify(Array.from(keypair.secretKey)));
  
  const programId = keypair.publicKey.toBase58();
  console.log(`${name}:`);
  console.log(`  程序 ID: ${programId}`);
  console.log(`  Keypair: ${keypairFile}\n`);
  
  // 更新 lib.rs 中的 declare_id!
  const libPath = join(__dirname, 'programs', dir, 'src', 'lib.rs');
  if (fs.existsSync(libPath)) {
    let content = fs.readFileSync(libPath, 'utf-8');
    // 查找并替换 declare_id!
    const declareIdRegex = /declare_id!\(".*?"\);/;
    if (declareIdRegex.test(content)) {
      content = content.replace(declareIdRegex, `declare_id!("${programId}");`);
      fs.writeFileSync(libPath, content);
      console.log(`  ✓ 已更新 ${libPath}`);
    }
  }
});

console.log('\n所有程序 keypair 已生成！');
