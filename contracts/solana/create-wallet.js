const fs = require('fs');
const { Keypair } = require('@solana/web3.js');
const { homedir } = require('os');
const { join } = require('path');

// 私钥数组
const PRIVATE_KEY_ARRAY = [
  24, 243, 40, 13, 251, 242, 198, 54, 1, 41, 175, 7, 3, 78, 239, 156,
  94, 6, 250, 201, 18, 81, 249, 251, 88, 114, 92, 4, 81, 238, 206, 244,
  61, 61, 241, 237, 128, 180, 248, 248, 150, 247, 198, 176, 129, 235, 104,
  160, 88, 141, 96, 105, 40, 22, 120, 191, 207, 32, 5, 83, 84, 186, 168, 222
];

const secretKey = Uint8Array.from(PRIVATE_KEY_ARRAY);
const keypair = Keypair.fromSecretKey(secretKey);

const walletDir = join(homedir(), '.config', 'solana');
if (!fs.existsSync(walletDir)) {
  fs.mkdirSync(walletDir, { recursive: true });
}

const walletFile = join(walletDir, 'soldev.json');
// 保存为 Solana CLI 兼容格式 (64字节 secret key 数组)
fs.writeFileSync(walletFile, JSON.stringify(Array.from(keypair.secretKey)));

console.log('钱包文件已创建:', walletFile);
console.log('公钥:', keypair.publicKey.toBase58());
