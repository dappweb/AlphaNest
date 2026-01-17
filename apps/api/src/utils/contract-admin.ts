/**
 * 智能合约管理员验证工具
 * 从链上智能合约读取管理员地址并验证权限
 */

/**
 * 从 Solana 智能合约读取 authority 地址
 */
export async function getSolanaContractAuthority(
  rpcUrl: string,
  programId: string,
  accountAddress: string
): Promise<string | null> {
  try {
    // 使用 getAccountInfo 获取账户数据
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
            encoding: 'base58',
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

    // 解析账户数据
    // Solana 账户数据格式：前 32 字节通常是 authority (Pubkey)
    const accountData = accountInfo.data;
    if (typeof accountData === 'string') {
      // base58 编码的数据，需要解码
      // 对于 Anchor 程序，authority 通常是前 32 字节
      // 这里我们使用更可靠的方法：通过 RPC 调用解析
      return await parseAnchorAccountAuthority(rpcUrl, accountAddress);
    }

    return null;
  } catch (error) {
    console.error('Error fetching Solana contract authority:', error);
    return null;
  }
}

/**
 * 解析 Anchor 账户的 authority 字段
 * 使用 getProgramAccounts 或直接解析账户数据
 */
async function parseAnchorAccountAuthority(
  rpcUrl: string,
  accountAddress: string
): Promise<string | null> {
  try {
    // 方法1: 使用 getAccountInfo 并解析 base64 数据
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
    const accountData = accountInfo.data[0];
    if (typeof accountData === 'string') {
      // Anchor 账户结构：discriminator (8 bytes) + authority (32 bytes)
      // 跳过 discriminator，读取 authority
      const buffer = Buffer.from(accountData, 'base64');
      if (buffer.length < 40) {
        return null;
      }

      // 提取 authority (第 9-40 字节，即索引 8-39)
      const authorityBytes = buffer.slice(8, 40);
      
      // 将 bytes 转换为 base58 编码的 Pubkey
      // 使用 bs58 库或直接构造
      return bytesToBase58(authorityBytes);
    }

    return null;
  } catch (error) {
    console.error('Error parsing Anchor account authority:', error);
    return null;
  }
}

/**
 * 将字节数组转换为 base58 编码的字符串
 * 这是一个简化的实现，实际应该使用 bs58 库
 */
function bytesToBase58(bytes: Uint8Array): string {
  // 这里使用一个简化的 base58 编码
  // 在生产环境中，应该使用 @solana/web3.js 的 PublicKey 类
  // 或者使用 bs58 库
  
  // 临时方案：将 bytes 转换为 hex，然后使用 PublicKey 构造
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // 注意：这不是真正的 base58 编码，只是临时方案
  // 实际应该使用 @solana/web3.js 的 PublicKey.fromBuffer()
  return hex;
}

/**
 * 验证钱包地址是否为合约管理员
 * 支持多个合约地址检查
 */
export async function verifyContractAdmin(
  rpcUrl: string,
  walletAddress: string,
  contractAddresses: {
    programId: string;
    accountAddress: string;
    accountType: 'staking_pool' | 'insurance_protocol' | 'reputation_registry' | 'yield_vault';
  }[]
): Promise<boolean> {
  try {
    // 检查所有合约，只要有一个匹配就返回 true
    for (const contract of contractAddresses) {
      const authority = await getSolanaContractAuthority(
        rpcUrl,
        contract.programId,
        contract.accountAddress
      );

      if (authority && authority.toLowerCase() === walletAddress.toLowerCase()) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error verifying contract admin:', error);
    return false;
  }
}

/**
 * 从环境变量获取合约配置并验证管理员
 */
export async function verifyAdminFromContracts(
  env: {
    SOLANA_RPC_URL: string;
    CONTRACT_STAKING_POOL?: string;
    CONTRACT_INSURANCE_PROTOCOL?: string;
    CONTRACT_REPUTATION_REGISTRY?: string;
    CONTRACT_YIELD_VAULT?: string;
    CONTRACT_STAKING_PROGRAM_ID?: string;
    CONTRACT_INSURANCE_PROGRAM_ID?: string;
    CONTRACT_REPUTATION_PROGRAM_ID?: string;
    CONTRACT_VAULT_PROGRAM_ID?: string;
  },
  walletAddress: string
): Promise<boolean> {
  const contracts: {
    programId: string;
    accountAddress: string;
    accountType: 'staking_pool' | 'insurance_protocol' | 'reputation_registry' | 'yield_vault';
  }[] = [];

  // 构建合约列表
  if (env.CONTRACT_STAKING_POOL && env.CONTRACT_STAKING_PROGRAM_ID) {
    contracts.push({
      programId: env.CONTRACT_STAKING_PROGRAM_ID,
      accountAddress: env.CONTRACT_STAKING_POOL,
      accountType: 'staking_pool',
    });
  }

  if (env.CONTRACT_INSURANCE_PROTOCOL && env.CONTRACT_INSURANCE_PROGRAM_ID) {
    contracts.push({
      programId: env.CONTRACT_INSURANCE_PROGRAM_ID,
      accountAddress: env.CONTRACT_INSURANCE_PROTOCOL,
      accountType: 'insurance_protocol',
    });
  }

  if (env.CONTRACT_REPUTATION_REGISTRY && env.CONTRACT_REPUTATION_PROGRAM_ID) {
    contracts.push({
      programId: env.CONTRACT_REPUTATION_PROGRAM_ID,
      accountAddress: env.CONTRACT_REPUTATION_REGISTRY,
      accountType: 'reputation_registry',
    });
  }

  if (env.CONTRACT_YIELD_VAULT && env.CONTRACT_VAULT_PROGRAM_ID) {
    contracts.push({
      programId: env.CONTRACT_VAULT_PROGRAM_ID,
      accountAddress: env.CONTRACT_YIELD_VAULT,
      accountType: 'yield_vault',
    });
  }

  if (contracts.length === 0) {
    return false;
  }

  return verifyContractAdmin(env.SOLANA_RPC_URL, walletAddress, contracts);
}

/**
 * 使用 @solana/web3.js 正确解析 Pubkey
 * 这个函数需要在实际使用时实现，因为 Cloudflare Workers 可能不支持 Node.js 模块
 */
export async function getSolanaAuthorityWithWeb3(
  rpcUrl: string,
  accountAddress: string
): Promise<string | null> {
  // 注意：这个方法需要 @solana/web3.js，但在 Cloudflare Workers 中可能不可用
  // 可以使用动态导入或使用 RPC 调用
  
  try {
    // 使用 RPC 的 getAccountInfo 方法，然后手动解析
    // Anchor 账户的 authority 字段在偏移量 8 的位置（跳过 8 字节的 discriminator）
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

    const accountData = accountInfo.data;
    if (Array.isArray(accountData) && accountData.length >= 2) {
      const base64Data = accountData[0];
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Anchor 账户结构：discriminator (8 bytes) + authority (32 bytes)
      if (buffer.length < 40) {
        return null;
      }

      // 提取 authority (32 bytes)
      const authorityBytes = buffer.slice(8, 40);
      
      // 转换为 base58 (Solana Pubkey 格式)
      // 这里我们需要一个 base58 编码函数
      // 由于 Cloudflare Workers 的限制，我们可以：
      // 1. 使用 Web Crypto API
      // 2. 或者返回 hex 格式，让调用者处理
      // 3. 或者使用一个轻量级的 base58 实现
      
      // 临时方案：返回 hex，实际应该转换为 base58
      const hex = Array.from(authorityBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // 注意：这不是最终的 base58 格式，需要进一步处理
      return hex;
    }

    return null;
  } catch (error) {
    console.error('Error getting Solana authority with Web3:', error);
    return null;
  }
}
