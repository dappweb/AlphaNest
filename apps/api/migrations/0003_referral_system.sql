-- Migration: Create referral system tables
-- Date: 2026-01-11

-- Referrals table (stores referrer codes)
CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL UNIQUE,
  referral_code TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (referrer_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

-- Referral records table (stores referral relationships)
CREATE TABLE IF NOT EXISTS referral_records (
  id TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL,
  referee_id TEXT NOT NULL,
  referee_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, active, inactive
  reward_amount TEXT DEFAULT '0',
  trades_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (referrer_id) REFERENCES users(id),
  FOREIGN KEY (referee_id) REFERENCES users(id),
  UNIQUE(referrer_id, referee_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_records_referrer ON referral_records(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_records_referee ON referral_records(referee_id);
CREATE INDEX IF NOT EXISTS idx_referral_records_status ON referral_records(status);
