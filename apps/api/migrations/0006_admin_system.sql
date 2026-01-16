-- AlphaNest Admin System Migration
-- Migration: 0006_admin_system
-- Created: 2024
-- Platform: Cloudflare D1 (SQLite)

-- ============================================
-- 管理员表
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL UNIQUE,
  
  -- 角色和权限
  role TEXT NOT NULL DEFAULT 'operator', -- 'super_admin', 'admin', 'operator'
  permissions TEXT NOT NULL DEFAULT '[]', -- JSON array of permission strings
  
  -- 状态
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login_at INTEGER,
  last_login_ip TEXT,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER, -- Unix timestamp, NULL if not locked
  
  -- 元数据
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT REFERENCES admins(id)
);

CREATE INDEX IF NOT EXISTS idx_admins_user ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_wallet ON admins(wallet_address);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);

-- ============================================
-- 管理员会话表
-- ============================================
CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  
  -- 会话信息
  token_hash TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  
  -- 时间戳
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL,
  last_activity_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- ============================================
-- 管理员操作日志表
-- ============================================
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES admins(id),
  
  -- 操作信息
  action TEXT NOT NULL, -- 'login', 'logout', 'create_token', 'update_config', etc.
  entity_type TEXT, -- 'token', 'user', 'config', etc.
  entity_id TEXT,
  
  -- 变更数据
  old_data TEXT, -- JSON
  new_data TEXT, -- JSON
  
  -- 请求信息
  ip_address TEXT,
  user_agent TEXT,
  request_path TEXT,
  request_method TEXT,
  
  -- 结果
  status TEXT NOT NULL DEFAULT 'success', -- 'success', 'failed', 'error'
  error_message TEXT,
  
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_entity ON admin_audit_logs(entity_type, entity_id);

-- ============================================
-- 管理员登录尝试记录表（用于安全监控）
-- ============================================
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  
  -- 尝试信息
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  success INTEGER NOT NULL DEFAULT 0, -- 0 = failed, 1 = success
  
  -- 时间戳
  attempted_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_admin_login_wallet ON admin_login_attempts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempted ON admin_login_attempts(attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_login_ip ON admin_login_attempts(ip_address);
