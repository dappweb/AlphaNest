# 已删除的非 Solana 代码和合约文件

## 📋 删除概述

本项目已简化为**仅支持 Solana 链上的 pump.fun 代币**，所有 EVM 链（BSC、Base、Ethereum）相关的代码和合约已删除。

## 🗑️ 已删除的文件

### 1. Solidity 合约文件
- ✅ `contracts/src/MultiAssetStaking.sol` - BSC 多资产质押合约
- ✅ `contracts/src/CowGuardInsurance.sol` - BSC 保险合约
- ✅ `contracts/test/MultiAssetStaking.t.sol` - 质押合约测试
- ✅ `contracts/test/CowGuardInsurance.t.sol` - 保险合约测试
- ✅ `contracts/script/Deploy.s.sol` - BSC 部署脚本
- ✅ `contracts/script/verify-bsc.sh` - BSC 合约验证脚本
- ✅ `contracts/BSC_DEPLOY_GUIDE.md` - BSC 部署指南

### 2. 前端配置文件
- ✅ `apps/web/src/config/wagmi.ts` - Wagmi 配置（EVM 钱包）
- ✅ `apps/web/src/hooks/use-cowguard-insurance.ts` - BSC 保险 Hook
- ✅ `apps/web/src/hooks/use-multi-asset-staking.ts` - BSC 质押 Hook

### 3. 配置文件更新
- ✅ `contracts/foundry.toml` - 已简化，移除所有 EVM 链配置
- ✅ `apps/web/src/config/chains.ts` - 已简化，仅保留 Solana
- ✅ `apps/web/src/components/providers/wallet-providers.tsx` - 已简化，移除 Wagmi
- ✅ `apps/web/src/components/providers/index.tsx` - 已简化，移除 Wagmi 和 RainbowKit

## ⚠️ 需要手动清理的引用

以下文件仍包含对已删除代码的引用，需要手动清理：

### 前端文件（需要移除 wagmi/EVM 引用）

1. **`apps/web/src/components/layout/header.tsx`**
   - 移除 `useAccount`, `useConnect`, `useDisconnect` 等 wagmi hooks
   - 仅保留 Solana 钱包连接

2. **`apps/web/src/app/admin/page.tsx`**
   - 移除 EVM 钱包相关代码
   - 仅保留 Solana 钱包管理

3. **`apps/web/src/app/staking/page.tsx`**
   - 移除 BSC 链切换逻辑
   - 仅保留 Solana 质押功能

4. **`apps/web/src/components/ui/chain-switcher.tsx`**
   - 简化或删除链切换器（仅 Solana）

5. **`apps/web/src/hooks/use-referral.ts`**
   - 移除 EVM 钱包相关代码
   - 仅保留 Solana 推荐功能

6. **`apps/web/src/hooks/use-staking-referral.ts`**
   - 移除 EVM 相关代码
   - 仅保留 Solana 质押推荐

7. **`apps/web/src/components/insurance/insurance-products.tsx`**
   - 移除 BSC/Four.meme 相关产品
   - 仅保留 pump.fun 保险产品

8. **`apps/web/src/components/dashboard/stats-overview.tsx`**
   - 移除多链统计
   - 仅保留 Solana 统计

9. **`apps/web/src/components/notifications/notification-center.tsx`**
   - 移除 BSC 相关通知
   - 仅保留 Solana 通知

10. **`apps/web/src/app/test-solana/page.tsx`**
    - 移除 EVM 测试代码
    - 仅保留 Solana 测试

### 其他需要检查的文件

- `apps/web/src/app/settings/page.tsx` - 检查是否有链切换
- `apps/web/src/app/referral/page.tsx` - 检查是否有 BSC 引用
- `apps/web/src/app/insurance/page.tsx` - 检查是否有 BSC 产品
- `apps/web/src/app/page.tsx` - 检查首页是否有 BSC 相关内容
- `apps/web/src/components/insurance/my-policies.tsx` - 检查是否有 BSC 保单
- `apps/web/src/hooks/use-token-balances.ts` - 检查是否有 EVM 余额查询
- `apps/web/src/hooks/use-transaction-history.ts` - 检查是否有 EVM 交易历史
- `apps/web/src/hooks/use-admin-contract.ts` - 检查是否有 EVM 合约管理

## 📦 依赖清理建议

以下 npm 包可以移除（如果不再使用）：

```json
{
  "dependencies": {
    "@rainbow-me/rainbowkit": "^2.2.2",  // EVM 钱包 UI
    "wagmi": "^2.14.1",                  // EVM 钱包库
    "viem": "^2.21.54"                   // EVM 工具库
  }
}
```

**注意**：在移除这些依赖前，请确保所有文件都已清理完毕。

## ✅ 已完成的简化

1. ✅ 合约文件全部删除
2. ✅ 配置文件已简化
3. ✅ 钱包提供者已简化（仅 Solana）
4. ✅ 链配置已简化（仅 Solana）

## 🔄 下一步操作

1. **清理代码引用**：逐个检查并清理上述文件中的 EVM 引用
2. **移除依赖**：清理 `package.json` 中的 wagmi、rainbowkit、viem
3. **更新文档**：更新 README 和部署文档
4. **测试验证**：确保所有功能仅使用 Solana

---

**更新时间**：2024-12-19  
**状态**：部分完成（文件已删除，代码引用待清理）
