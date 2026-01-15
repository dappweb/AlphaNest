-- PopCow Seed Data
-- 插入测试用户
INSERT INTO users (id, wallet_address, total_points, reputation_score) VALUES 
('user-1', '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1', 1000, 80),
('user-2', 'ANULrLMRVxxHqEWYVqD92pKyqGLH4hwGTHqSqKjLRQq6', 500, 60);

-- 插入一些 Dev
INSERT INTO devs (id, wallet_address, alias, score, tier, verified, total_launches, successful_launches, rug_count, total_volume, avg_ath_multiplier) VALUES
('dev-1', 'He8unvJ4N1Z7f4f6f4f6f4f6f4f6f4f6f4f6f4f6f4f6', 'MemeGod', 95, 'gold', 1, 10, 8, 0, '1500000', 12.5),
('dev-2', 'Dev2vJ4N1Z7f4f6f4f6f4f6f4f6f4f6f4f6f4f6f4f6f4', 'PumpMaster', 82, 'silver', 1, 5, 3, 0, '500000', 4.2),
('dev-3', 'RugvJ4N1Z7f4f6f4f6f4f6f4f6f4f6f4f6f4f6f4f6f4f6', 'RugPuller', 15, 'bronze', 0, 3, 0, 2, '10000', 0.8);

-- 插入一些代币
INSERT INTO tokens (id, contract_address, chain, name, symbol, creator_dev_id, status, market_cap, holder_count, liquidity, ath_market_cap) VALUES
('token-1', 'PopCowMintAddressPlaceholder', 'solana', 'PopCow', 'POPCOW', 'dev-1', 'active', '1200000', 5000, '250000', '5000000'),
('token-2', 'PopCowDefiMintAddressPlaceholder', 'solana', 'PopCowDefi', '$PopCowDefi', 'dev-1', 'active', '500000', 1200, '100000', '2000000'),
('token-3', 'BonkMintAddressPlaceholder', 'solana', 'Bonk', 'BONK', 'dev-2', 'active', '1000000000', 650000, '50000000', '2000000000');

-- 插入一些交易记录供统计
-- CREATE TABLE IF NOT EXISTS transactions (id, user_id, action_type, token_in, token_out, amount_in, amount_out, created_at, status)
INSERT INTO transactions (id, user_id, tx_hash, chain, action_type, token_in, token_out, amount_in, amount_out, status, created_at) VALUES
('tx-1', 'user-1', 'sig1', 'solana', 'buy', 'SOL', 'POPCOW', '1', '100000', 'confirmed', strftime('%s', 'now')),
('tx-2', 'user-1', 'sig2', 'solana', 'buy', 'SOL', '$PopCowDefi', '0.5', '5000', 'confirmed', strftime('%s', 'now') - 3600),
('tx-3', 'user-2', 'sig3', 'solana', 'stake', 'POPCOW', NULL, '50000', '0', 'confirmed', strftime('%s', 'now') - 7200);

-- 别忘了 trade_logs 表，如果它存在的话（在 migration 中没看到但在 analytics.ts 用到了）
-- 其实 trade_logs 可能是 tokens 的别名或者我漏看了？
-- 让我检查 analytics.ts 里的查询，它是查询 trade_logs
-- 看来我需要创建 trade_logs 表
CREATE TABLE IF NOT EXISTS trade_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    token_mint TEXT,
    amount TEXT,
    price_usd REAL,
    action TEXT,
    chain TEXT,
    signature TEXT,
    created_at INTEGER
);

INSERT INTO trade_logs (id, user_id, token_mint, amount, price_usd, action, chain, signature, created_at) VALUES
('log-1', 'user-1', 'PopCowMintAddressPlaceholder', '100000', 0.012, 'buy', 'solana', 'sig1', strftime('%s', 'now')*1000),
('log-2', 'user-2', 'PopCowMintAddressPlaceholder', '50000', 0.011, 'buy', 'solana', 'sig4', (strftime('%s', 'now')-86400)*1000);

-- 插入一些交易员
INSERT INTO traders (id, address, alias, verified, score, tier, pnl_total, win_rate, followers_count, created_at, updated_at) VALUES
('trader-1', 'WhaleAddress1', 'SolanaWhale', 1, 98, 'gold', 500000, 0.75, 1200, strftime('%s', 'now'), strftime('%s', 'now')),
('trader-2', 'AlphaHunter1', 'AlphaAlpha', 1, 85, 'silver', 120000, 0.65, 450, strftime('%s', 'now'), strftime('%s', 'now'));
