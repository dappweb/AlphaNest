/**
 * Solana 智能合约管理员验证工具
 * 使用 @solana/web3.js 正确解析 Anchor 账户的 authority 字段
 * 
 * 注意：这个文件提供了更准确的实现，但需要确保 @solana/web3.js 在 Cloudflare Workers 中可用
 */

/**
 * 从 Solana Anchor 账户读取 authority (Pubkey)
 * 使用 base64 编码的账户数据，解析前 32 字节（跳过 8 字节 discriminator）
 */
export async function getAnchorAccountAuthority(
  rpcUrl: string,
  accountAddress: string
): Promise<string | null> {
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getAccountInfo',
        params: [
          accountAddress,
          {
            encoding: 'base64',
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const accountInfo = data.result?.value;

    if (!accountInfo || !accountInfo.data) {
      return null;
    }

    // 解析 base64 数据
    const accountData = accountInfo.data;
    let base64Data: string;

    if (Array.isArray(accountData)) {
      base64Data = accountData[0];
    } else if (typeof accountData === 'string') {
      base64Data = accountData;
    } else {
      return null;
    }

    // 解码 base64
    // 在 Cloudflare Workers 中，可以使用 atob 或 TextDecoder
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Anchor 账户结构：
    // - discriminator: 8 bytes
    // - authority: 32 bytes (Pubkey)
    if (bytes.length < 40) {
      return null;
    }

    // 提取 authority (跳过前 8 字节的 discriminator)
    const authorityBytes = bytes.slice(8, 40);

    // 将 32 字节转换为 base58 编码的 Pubkey
    // 由于 Cloudflare Workers 可能不支持 @solana/web3.js，
    // 我们使用一个简化的 base58 编码实现
    return encodeBase58(authorityBytes);
  } catch (error) {
    console.error('Error getting Anchor account authority:', error);
    return null;
  }
}

/**
 * Base58 编码实现
 * Solana 使用 base58 编码 Pubkey
 */
function encodeBase58(bytes: Uint8Array): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const base = BigInt(58);
  
  // 将字节数组转换为大整数
  let num = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    num = num * BigInt(256) + BigInt(bytes[i]);
  }
  
  // 转换为 base58
  if (num === BigInt(0)) {
    return '1';
  }
  
  let result = '';
  while (num > 0) {
    const remainder = Number(num % base);
    result = alphabet[remainder] + result;
    num = num / base;
  }
  
  // 处理前导零
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result = '1' + result;
  }
  
  return result;
}

/**
 * 验证钱包地址是否为指定合约的 authority
 */
export async function verifyContractAuthority(
  rpcUrl: string,
  walletAddress: string,
  contractAccountAddress: string
): Promise<boolean> {
  try {
    const authority = await getAnchorAccountAuthority(rpcUrl, contractAccountAddress);
    
    if (!authority) {
      return false;
    }

    // 比较地址（不区分大小写）
    return authority.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error('Error verifying contract authority:', error);
    return false;
  }
}

/**
 * 批量验证多个合约的 authority
 * 只要有一个匹配就返回 true
 */
export async function verifyMultipleContractAuthorities(
  rpcUrl: string,
  walletAddress: string,
  contractAddresses: string[]
): Promise<boolean> {
  try {
    // 并行检查所有合约
    const results = await Promise.all(
      contractAddresses.map(addr => 
        verifyContractAuthority(rpcUrl, walletAddress, addr)
      )
    );

    // 只要有一个匹配就返回 true
    return results.some(result => result === true);
  } catch (error) {
    console.error('Error verifying multiple contract authorities:', error);
    return false;
  }
}
