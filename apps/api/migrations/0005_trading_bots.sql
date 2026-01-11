-- Migration: Create trading bots table
-- Date: 2026-01-11

CREATE TABLE IF NOT EXISTS bots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- grid, dca, copy, arbitrage
  investment TEXT NOT NULL,
  current_value TEXT DEFAULT '0',
  pnl TEXT DEFAULT '0',
  pnl_percent REAL DEFAULT 0,
  trades_count INTEGER DEFAULT 0,
  win_rate REAL DEFAULT 0,
  chain TEXT NOT NULL,
  config TEXT, -- JSON configuration
  status TEXT DEFAULT 'stopped', -- stopped, running, paused, error
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_bots_user ON bots(user_id);
CREATE INDEX IF NOT EXISTS idx_bots_status ON bots(status);
CREATE INDEX IF NOT EXISTS idx_bots_type ON bots(type);
