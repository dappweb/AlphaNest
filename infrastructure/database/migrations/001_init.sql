-- AlphaNest Database Schema
-- Migration: 001_init
-- Created: 2024
-- Platform: Cloudflare D1 (SQLite)

-- ============================================
-- 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  
  -- 用户数据
  total_points INTEGER NOT NULL DEFAULT 0,
  reputation_score INTEGER NOT NULL DEFAULT 0,
  verification_level INTEGER NOT NULL DEFAULT 0,
  
  -- 设置
  notification_telegram TEXT,
  notification_discord TEXT,
  auto_follow_enabled INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(total_points DESC);

-- ============================================
-- 用户连接的链
-- ============================================
CREATE TABLE IF NOT EXISTS user_chains (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chain TEXT NOT NULL,
  chain_address TEXT NOT NULL,
  verified_at INTEGER,
  last_balance TEXT,
  
  UNIQUE(user_id, chain)
);

CREATE INDEX IF NOT EXISTS idx_user_chains_user ON user_chains(user_id);

-- ============================================
-- Dev 表 (代币发行者)
-- ============================================
CREATE TABLE IF NOT EXISTS devs (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  alias TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  
  -- 信誉数据
  score INTEGER NOT NULL DEFAULT 50,
  tier TEXT NOT NULL DEFAULT 'bronze',
  verified INTEGER NOT NULL DEFAULT 0,
  verification_stake TEXT,
  
  -- 统计数据
  total_launches INTEGER NOT NULL DEFAULT 0,
  successful_launches INTEGER NOT NULL DEFAULT 0,
  rug_count INTEGER NOT NULL DEFAULT 0,
  total_volume TEXT NOT NULL DEFAULT '0',
  avg_ath_multiplier REAL NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_devs_wallet ON devs(wallet_address);
CREATE INDEX IF NOT EXISTS idx_devs_score ON devs(score DESC);
CREATE INDEX IF NOT EXISTS idx_devs_tier ON devs(tier);

-- ============================================
-- 代币表
-- ============================================
CREATE TABLE IF NOT EXISTS tokens (
  id TEXT PRIMARY KEY,
  contract_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimals INTEGER NOT NULL DEFAULT 18,
  logo_url TEXT,
  
  -- 创建者
  creator_dev_id TEXT REFERENCES devs(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  launched_at INTEGER,
  
  -- 状态
  status TEXT NOT NULL DEFAULT 'active',
  rug_detected_at INTEGER,
  graduation_tx TEXT,
  
  -- 市场数据
  market_cap TEXT,
  holder_count INTEGER,
  liquidity TEXT,
  ath_market_cap TEXT,
  ath_timestamp INTEGER,
  
  -- 社交数据
  twitter_url TEXT,
  telegram_url TEXT,
  website_url TEXT,
  
  UNIQUE(contract_address, chain)
);

CREATE INDEX IF NOT EXISTS idx_tokens_address ON tokens(contract_address, chain);
CREATE INDEX IF NOT EXISTS idx_tokens_creator ON tokens(creator_dev_id);
CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens(status);
CREATE INDEX IF NOT EXISTS idx_tokens_created ON tokens(created_at DESC);

-- ============================================
-- 保险保单表
-- ============================================
CREATE TABLE IF NOT EXISTS insurance_policies (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token_id TEXT NOT NULL REFERENCES tokens(id),
  
  -- 保单详情
  position TEXT NOT NULL CHECK (position IN ('rug', 'safe')),
  premium_paid TEXT NOT NULL,
  coverage_amount TEXT NOT NULL,
  potential_payout TEXT NOT NULL,
  
  -- 链上数据
  chain TEXT NOT NULL,
  tx_hash TEXT,
  
  -- 时间
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL,
  
  -- 状态
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'claimed', 'settled')),
  settled_at INTEGER,
  payout_amount TEXT,
  settlement_tx TEXT
);

CREATE INDEX IF NOT EXISTS idx_policies_user ON insurance_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_policies_token ON insurance_policies(token_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON insurance_policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_expires ON insurance_policies(expires_at);

-- ============================================
-- 保险资金池表
-- ============================================
CREATE TABLE IF NOT EXISTS insurance_pools (
  id TEXT PRIMARY KEY,
  token_id TEXT NOT NULL REFERENCES tokens(id) UNIQUE,
  
  -- 资金池数据
  total_rug_stake TEXT NOT NULL DEFAULT '0',
  total_safe_stake TEXT NOT NULL DEFAULT '0',
  premium_rate REAL NOT NULL DEFAULT 0.05,
  
  -- 状态
  status TEXT NOT NULL DEFAULT 'active',
  resolved_at INTEGER,
  outcome TEXT CHECK (outcome IN ('rug', 'safe', NULL)),
  
  -- 时间
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  closes_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_pools_token ON insurance_pools(token_id);
CREATE INDEX IF NOT EXISTS idx_pools_status ON insurance_pools(status);

-- ============================================
-- 交易记录表
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  tx_hash TEXT NOT NULL,
  chain TEXT NOT NULL,
  
  -- 交易详情
  action_type TEXT NOT NULL,
  token_in TEXT,
  token_out TEXT,
  amount_in TEXT,
  amount_out TEXT,
  
  -- 元数据
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  block_number INTEGER,
  gas_used TEXT,
  
  -- 错误信息
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_tx_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(status);

-- ============================================
-- 用户跟单订阅
-- ============================================
CREATE TABLE IF NOT EXISTS dev_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dev_id TEXT NOT NULL REFERENCES devs(id) ON DELETE CASCADE,
  
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  
  -- 设置
  notify_telegram INTEGER NOT NULL DEFAULT 1,
  notify_discord INTEGER NOT NULL DEFAULT 0,
  auto_buy_enabled INTEGER NOT NULL DEFAULT 0,
  auto_buy_amount TEXT,
  max_slippage REAL DEFAULT 0.05,
  
  UNIQUE(user_id, dev_id)
);

CREATE INDEX IF NOT EXISTS idx_subs_user ON dev_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_dev ON dev_subscriptions(dev_id);

-- ============================================
-- 积分记录
-- ============================================
CREATE TABLE IF NOT EXISTS points_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id TEXT,
  
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_points_user ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_created ON points_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_reason ON points_history(reason);

-- ============================================
-- 通知记录
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT,
  
  read_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read_at);

-- ============================================
-- API 密钥表 (高级用户)
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  permissions TEXT NOT NULL DEFAULT '[]',
  
  last_used_at INTEGER,
  expires_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  
  -- 限制
  rate_limit INTEGER NOT NULL DEFAULT 100,
  daily_limit INTEGER NOT NULL DEFAULT 10000
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

-- ============================================
-- 审计日志
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  
  old_data TEXT,
  new_data TEXT,
  
  ip_address TEXT,
  user_agent TEXT,
  
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- 系统配置表
-- ============================================
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 插入默认配置
INSERT OR IGNORE INTO system_config (key, value) VALUES
  ('maintenance_mode', 'false'),
  ('min_app_version', '1.0.0'),
  ('insurance_enabled', 'true'),
  ('trading_enabled', 'true'),
  ('max_insurance_coverage', '100000'),
  ('min_dev_score_for_verification', '70');
