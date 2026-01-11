/**
 * 测试工具函数
 */

// Mock D1 数据库
export class MockD1Database {
  private data: Map<string, any[]> = new Map();

  prepare(query: string) {
    return new MockD1Statement(this, query);
  }

  // 内部数据操作
  _insert(table: string, row: any) {
    if (!this.data.has(table)) {
      this.data.set(table, []);
    }
    this.data.get(table)!.push(row);
  }

  _select(table: string, where?: (row: any) => boolean) {
    const rows = this.data.get(table) || [];
    return where ? rows.filter(where) : rows;
  }

  _clear() {
    this.data.clear();
  }
}

class MockD1Statement {
  private values: any[] = [];
  
  constructor(private db: MockD1Database, private query: string) {}

  bind(...values: any[]) {
    this.values = values;
    return this;
  }

  async first() {
    // 简单模拟 SELECT 返回第一条
    if (this.query.includes('users WHERE wallet_address')) {
      return null; // 模拟用户不存在
    }
    return null;
  }

  async all() {
    return { results: [] };
  }

  async run() {
    return { success: true };
  }
}

// Mock KV 命名空间
export class MockKVNamespace {
  private store: Map<string, string> = new Map();

  async get(key: string) {
    return this.store.get(key) || null;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }) {
    this.store.set(key, value);
  }

  async delete(key: string) {
    this.store.delete(key);
  }

  _clear() {
    this.store.clear();
  }
}

// Mock 环境变量
export function createMockEnv() {
  return {
    DB: new MockD1Database(),
    CACHE: new MockKVNamespace(),
    SESSIONS: new MockKVNamespace(),
    RATE_LIMIT: new MockKVNamespace(),
    ENVIRONMENT: 'test',
    LOG_LEVEL: 'error',
    API_VERSION: 'v1',
    CORS_ORIGIN: '*',
    SOLANA_RPC_URL: 'https://api.devnet.solana.com',
    BASE_RPC_URL: 'https://sepolia.base.org',
    ETH_RPC_URL: 'https://ethereum-sepolia-rpc.publicnode.com',
    BITQUERY_API_KEY: 'test-key',
    COVALENT_API_KEY: 'test-key',
    DEXSCREENER_API_KEY: 'test-key',
    JWT_SECRET: 'test-secret-key-32-chars-minimum!!!',
    CONTRACT_ALPHANEST_CORE: '0x687111E43D417c99F993FB6D26F4b06E465c7A94',
    CONTRACT_REPUTATION_REGISTRY: '0xC3a8D57aCa3D3d244057b69129621d87c3a37574',
    CONTRACT_ALPHAGUARD: '0xB72A72EFC2F42092099Af61EFf2B2B8ad8f197a9',
    SENTRY_DSN: '',
  };
}

// 创建测试请求
export function createRequest(method: string, path: string, options?: {
  body?: any;
  headers?: Record<string, string>;
}) {
  const url = `http://localhost:8787${path}`;
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  };

  if (options?.body) {
    init.body = JSON.stringify(options.body);
  }

  return new Request(url, init);
}
