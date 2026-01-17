# 🎉 已部署的 Solana 合约

## 网络信息
- **网络**: Solana Devnet
- **部署日期**: 2026-01-17
- **钱包地址**: 584ewGPTG6gvEVStLboR8et9E8wD1y13BPpJW98XShxZ

## ✅ 已部署的合约 (8/10)

| 程序 | Program ID | 状态 |
|------|------------|------|
| popcow_token | `2hq6UFiL1VhTYULiJGc49wmNb5S62BAQo3y3EcwGBDZX` | ✅ 已部署 |
| cowguard_insurance | `FBa18v9ZndffTY6fw2H9dUzc2nGcujZuq2tLzQjtRGxi` | ✅ 已部署 |
| popcow_staking | `9tyVCiEHi97uMbzHHt1MUwprn1d7HEwCzDwUVpxdbYuj` | ✅ 已部署 |
| token_vesting | `DAGphggsL3TBYeAb9VDo7n5mqmKBKerNoTgC3ecPtDYA` | ✅ 已部署 |
| yield_vault | `5Wy1yNUUzioxydA6h3UtT2FESQAVaKNzjnpTBZqwcFAb` | ✅ 已部署 |
| reputation_registry | `GmGeZQQE6nqcLRef7Z9pFkug6Rvm2ExV6BKLozBpvFp7` | ✅ 已部署 |
| governance | `DxhG1fNRDzwVrJy8ZyUe3zdZCnUDDFUEToGRhUFCM4Qh` | ✅ 已部署 |
| referral_system | `Gk7RGjs6EvYkUEWod6hviDZ2NAYXrgoDBjfrFWkb9DeG` | ✅ 已部署 |

## ⏳ 待部署的合约 (2/10)

| 程序 | Keypair Program ID | 预估成本 |
|------|-------------------|----------|
| points_system | `46iXDwHRE9FZcoeMUPQD8Bc8B55Bz3Gb9mTPrVJhZP9v` | ~2.31 SOL |
| multi_asset_staking | `7qpcKQQuDYhN51PTXebV8dpWY8MxqUKeFMwwVQ1eFQ75` | ~3.15 SOL |

**待部署总成本**: ~5.46 SOL

## 📁 前端配置文件

已更新以下文件以对齐部署的合约：

1. `apps/web/src/config/solana.ts` - SOLANA_PROGRAM_IDS
2. `apps/web/src/lib/solana/constants.ts` - STAKING_PROGRAM_ID, MULTI_ASSET_STAKING_PROGRAM_ID

## 🔗 验证合约

可以在 Solana Explorer 上验证合约：

```
https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet
```

例如：
- [popcow_token](https://explorer.solana.com/address/2hq6UFiL1VhTYULiJGc49wmNb5S62BAQo3y3EcwGBDZX?cluster=devnet)
- [popcow_staking](https://explorer.solana.com/address/9tyVCiEHi97uMbzHHt1MUwprn1d7HEwCzDwUVpxdbYuj?cluster=devnet)
- [governance](https://explorer.solana.com/address/DxhG1fNRDzwVrJy8ZyUe3zdZCnUDDFUEToGRhUFCM4Qh?cluster=devnet)

## 🚀 部署剩余合约

当有足够的 SOL 时，运行：

```bash
cd /home/zyj_dev/AlphaNest/contracts/solana

# 部署 points_system
solana program deploy target/deploy/points_system.so \
  --program-id target/deploy/points_system-keypair.json \
  --url devnet

# 部署 multi_asset_staking
solana program deploy target/deploy/multi_asset_staking.so \
  --program-id target/deploy/multi_asset_staking-keypair.json \
  --url devnet
```

## 📊 部署进度

- **已部署**: 8/10 (80%)
- **待部署**: 2/10 (20%)
- **当前余额**: ~1.4 SOL
- **还需要**: ~5.46 SOL
