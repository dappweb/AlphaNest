-- Migration: Create traders and copy_trades tables
-- Date: 2026-01-11

-- Traders table
CREATE TABLE IF NOT EXISTS traders (
  id TEXT PRIMARY KEY,
  address TEXT UNIQUE NOT NULL,
  alias TEXT,
  verified BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 50,
  tier TEXT DEFAULT 'bronze',
  pnl_total BIGINT DEFAULT 0,
  pnl_percent REAL DEFAULT 0,
  win_rate REAL DEFAULT 0,
  trades_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  aum BIGINT DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_traders_address ON traders(address);
CREATE INDEX IF NOT EXISTS idx_traders_score ON traders(score DESC);
CREATE INDEX IF NOT EXISTS idx_traders_pnl ON traders(pnl_total DESC);

-- Copy trades table
CREATE TABLE IF NOT EXISTS copy_trades (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  trader_id TEXT NOT NULL,
  investment_amount BIGINT NOT NULL,
  copy_ratio REAL DEFAULT 1.0,
  stop_loss REAL,
  take_profit REAL,
  status TEXT DEFAULT 'active',
  current_value BIGINT DEFAULT 0,
  pnl BIGINT DEFAULT 0,
  pnl_percent REAL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (trader_id) REFERENCES traders(id)
);

CREATE INDEX IF NOT EXISTS idx_copy_trades_user ON copy_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_copy_trades_trader ON copy_trades(trader_id);
CREATE INDEX IF NOT EXISTS idx_copy_trades_status ON copy_trades(status);

-- Copy trade executions table
CREATE TABLE IF NOT EXISTS copy_trade_executions (
  id TEXT PRIMARY KEY,
  copy_trade_id TEXT NOT NULL,
  trader_tx_hash TEXT NOT NULL,
  token_in TEXT,
  token_out TEXT,
  amount_in TEXT,
  amount_out TEXT,
  user_tx_hash TEXT,
  status TEXT DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (copy_trade_id) REFERENCES copy_trades(id)
);

CREATE INDEX IF NOT EXISTS idx_executions_copy_trade ON copy_trade_executions(copy_trade_id);
CREATE INDEX IF NOT EXISTS idx_executions_trader_tx ON copy_trade_executions(trader_tx_hash);
