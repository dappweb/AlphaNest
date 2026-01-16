#!/usr/bin/env node

/**
 * Soldev 网络部署脚本
 * 使用提供的私钥部署所有 Solana 程序
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { Keypair } from '@solana/web3.js';
import { homedir } from 'os';

// 私钥数组
const PRIVATE_KEY_ARRAY = [
  24, 243, 40, 13, 251, 242, 198, 54, 1, 41, 175, 7, 3, 78, 239, 156,
  94, 6, 250, 201, 18, 81, 249, 251, 88, 114, 92, 4, 81, 238, 206, 244,
  61, 61, 241, 237, 128, 180, 248, 248, 150, 247, 198, 176, 129, 235, 104,
  160, 88, 141, 96, 105, 40, 22, 120, 191, 207, 32, 5, 83, 84, 186, 168, 222
];

// Soldev RPC URL (可以根据实际情况修改)
const SOLDEV_RPC_URL = process.env.SOLDEV_RPC_URL || 'https://api.soldev.org';

// 程序列表
const PROGRAMS = [
  'popcow-token',
  'cowguard-insurance',
  'popcow-staking',
  'token-vesting',
  'yield-vault',
  'multi-asset-staking',
  'reputation-registry',
  'governance',
  'points-system',
  'referral-system',
];

function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m',
  };
  const prefix = {
    info: 'ℹ',
    success: '✓',
    error: '✗',
    warning: '⚠',
  };
  console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
}

async function main() {
  try {
    log('=== Soldev 网络部署脚本 ===', 'info');

    // 步骤 1: 创建钱包文件
    log('步骤 1: 创建钱包文件...', 'info');
    const walletDir = join(homedir(), '.config', 'solana');
    if (!existsSync(walletDir)) {
      mkdirSync(walletDir, { recursive: true });
    }

    const walletFile = join(walletDir, 'soldev.json');
    const secretKey = Uint8Array.from(PRIVATE_KEY_ARRAY);
    const keypair = Keypair.fromSecretKey(secretKey);

    // 保存为 Solana CLI 兼容格式 (64字节 secret key)
    writeFileSync(walletFile, JSON.stringify(Array.from(keypair.secretKey)));

    log(`钱包文件已创建: ${walletFile}`, 'success');
    log(`公钥: ${keypair.publicKey.toBase58()}`, 'info');

    // 步骤 2: 配置 Solana CLI
    log('步骤 2: 配置 Solana CLI...', 'info');
    try {
      execSync(`solana config set --url ${SOLDEV_RPC_URL} --keypair ${walletFile}`, {
        stdio: 'inherit',
      });
      log('Solana CLI 配置成功', 'success');
    } catch (error) {
      log('警告: Solana CLI 配置失败，继续使用环境变量', 'warning');
    }

    // 步骤 3: 检查余额
    log('步骤 3: 检查账户余额...', 'info');
    try {
      const balanceOutput = execSync(
        `solana balance --url ${SOLDEV_RPC_URL} --keypair ${walletFile}`,
        { encoding: 'utf-8' }
      );
      log(`当前余额: ${balanceOutput.trim()}`, 'info');

      // 尝试解析余额数值
      const balanceMatch = balanceOutput.match(/(\d+\.?\d*)/);
      if (balanceMatch) {
        const balance = parseFloat(balanceMatch[1]);
        if (balance < 1) {
          log('警告: 余额不足，可能需要获取测试 SOL', 'warning');
          log('如果 soldev 网络支持 airdrop，可以运行: solana airdrop 2', 'info');
        }
      }
    } catch (error) {
      log('无法获取余额信息，继续部署...', 'warning');
    }

    // 步骤 4: 构建所有程序
    log('步骤 4: 构建所有程序...', 'info');
    try {
      execSync('anchor build', { stdio: 'inherit', cwd: __dirname });
      log('构建成功', 'success');
    } catch (error) {
      log('构建失败', 'error');
      throw error;
    }

    // 步骤 5: 部署所有程序
    log('步骤 5: 部署程序到 soldev 网络...', 'info');
    const deployedPrograms: string[] = [];
    const failedPrograms: string[] = [];

    for (const program of PROGRAMS) {
      try {
        log(`部署 ${program}...`, 'info');
        
        // 使用 anchor deploy 命令
        // 注意: anchor deploy 需要根据实际的程序名称调整
        const programName = program.replace(/-/g, '_');
        
        // 使用自定义 RPC URL 部署
        execSync(
          `ANCHOR_PROVIDER_URL=${SOLDEV_RPC_URL} ANCHOR_WALLET=${walletFile} anchor deploy --program-name ${programName}`,
          { stdio: 'inherit', cwd: __dirname, env: { ...process.env, ANCHOR_PROVIDER_URL: SOLDEV_RPC_URL, ANCHOR_WALLET: walletFile } }
        );
        
        deployedPrograms.push(program);
        log(`${program} 部署成功`, 'success');
      } catch (error) {
        failedPrograms.push(program);
        log(`${program} 部署失败，继续部署其他程序...`, 'warning');
      }
    }

    // 部署总结
    log('=== 部署完成 ===', 'info');
    log(`成功部署: ${deployedPrograms.length} 个程序`, 'success');
    if (deployedPrograms.length > 0) {
      log(`已部署程序: ${deployedPrograms.join(', ')}`, 'info');
    }
    if (failedPrograms.length > 0) {
      log(`部署失败: ${failedPrograms.join(', ')}`, 'warning');
    }
    log(`钱包地址: ${keypair.publicKey.toBase58()}`, 'info');
    log(`网络: soldev (${SOLDEV_RPC_URL})`, 'info');

  } catch (error) {
    log(`部署过程中发生错误: ${error}`, 'error');
    process.exit(1);
  }
}

main();
