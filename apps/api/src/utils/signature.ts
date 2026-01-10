/**
 * 签名验证工具
 * 支持 EVM (EIP-191, EIP-712) 和 Solana 签名验证
 */

import { verifyMessage, hashMessage, recoverMessageAddress } from 'viem';
import { PublicKey } from '@solana/web3.js';
import * as nacl from 'tweetnacl';

export type ChainType = 'solana' | 'base' | 'ethereum' | 'bnb';

/**
 * 生成签名消息
 */
export function generateSignMessage(
  address: string,
  nonce: string,
  timestamp: number
): string {
  return `Welcome to AlphaNest!

Please sign this message to verify your wallet ownership.

Wallet: ${address}
Nonce: ${nonce}
Timestamp: ${timestamp}

This signature does not trigger any blockchain transaction or cost any gas fees.`;
}

/**
 * 验证签名
 */
export async function verifySignature(
  address: string,
  signature: string,
  message: string,
  chain: ChainType
): Promise<boolean> {
  try {
    if (chain === 'solana') {
      return verifySolanaSignature(address, signature, message);
    } else {
      return verifyEvmSignature(address, signature, message);
    }
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * 验证 EVM 签名 (Base, Ethereum, BNB)
 */
async function verifyEvmSignature(
  address: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`,
    });

    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('EVM signature verification error:', error);
    return false;
  }
}

/**
 * 验证 Solana 签名
 */
function verifySolanaSignature(
  address: string,
  signature: string,
  message: string
): boolean {
  try {
    const publicKey = new PublicKey(address);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = Buffer.from(signature, 'base64');

    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );
  } catch (error) {
    console.error('Solana signature verification error:', error);
    return false;
  }
}

/**
 * 验证地址格式
 */
export function isValidAddress(address: string, chain: ChainType): boolean {
  if (chain === 'solana') {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  } else {
    // EVM 地址验证
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

/**
 * 生成随机 nonce
 */
export function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
