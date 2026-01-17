# PopCowDefi 代币地址汇总

## 📍 当前代币地址

### 1. POPCOW 代币（引流代币）

**代币名称**: PopCow Token  
**代币符号**: POPCOW  
**代币类型**: SPL Token  
**发行平台**: Pump.fun  

**Mint 地址**:
```
8mrMRf8QwGh5bSrgzKsMmHPTTGqDcENU91SWuXEypump
```

**网络**: Solana Mainnet  
**小数位**: 6  
**用途**: 
- 用户获取和质押入场券
- 质押后获得 PopCowDefi 奖励（1:2 比例）

**代码位置**: `apps/web/src/lib/solana/constants.ts`

---

### 2. PopCowDefi 代币（平台代币）

**代币名称**: PopCow Defi Token  
**代币符号**: PopCowDefi  
**代币类型**: SPL Token  
**总供应量**: 100,000,000 (1亿)  

**Mint 地址**:
```
待部署（目前为占位符）
11111111111111111111111111111111
```

**网络**: Solana Mainnet (待部署)  
**小数位**: 9  
**用途**: 
- 平台收益分红
- 治理投票
- 手续费折扣
- 平台功能解锁

**部署状态**: ⏳ 待部署  
**部署脚本**: `contracts/staking/scripts/deploy-popcow-token.ts`

---

## 🔗 相关合约地址

### 质押合约程序 ID

**程序 ID**:
```
待部署（目前为占位符）
11111111111111111111111111111111
```

**程序名称**: PopCow Staking  
**部署状态**: ⏳ 待部署  
**代码位置**: `contracts/solana/programs/staking/src/lib.rs`

---

### PopCow Token 程序 ID

**程序 ID**:
```
PopCow1111111111111111111111111111111111111
```

**程序名称**: PopCow Token  
**功能**: 代币管理、销毁机制  
**代码位置**: `contracts/solana/programs/popcow-token/src/lib.rs`

---

## 📊 代币信息对比

| 属性 | POPCOW | PopCowDefi |
|------|--------|------------|
| **类型** | 引流代币 | 价值代币 |
| **发行方式** | Pump.fun | 平台发行 |
| **总供应量** | 无限 | 100,000,000 (固定) |
| **小数位** | 6 | 9 |
| **主要用途** | 质押入场券 | 平台权益 |
| **获取方式** | 购买 | 质押 POPCOW 挖矿 |
| **兑换比例** | - | 1 POPCOW = 2 PopCowDefi |

---

## 🔍 如何查找代币地址

### 在代码中查找

```typescript
// apps/web/src/lib/solana/constants.ts
import { POPCOW_TOKEN_MINT, POPCOWDEFI_TOKEN_MINT } from './constants';

console.log('POPCOW 地址:', POPCOW_TOKEN_MINT.toBase58());
console.log('PopCowDefi 地址:', POPCOWDEFI_TOKEN_MINT.toBase58());
```

### 在 Solana Explorer 查看

- **POPCOW**: https://solscan.io/token/8mrMRf8QwGh5bSrgzKsMmHPTTGqDcENU91SWuXEypump
- **PopCowDefi**: 待部署后更新

### 在 Birdeye 查看

- **POPCOW**: https://birdeye.so/token/8mrMRf8QwGh5bSrgzKsMmHPTTGqDcENU91SWuXEypump
- **PopCowDefi**: 待部署后更新

---

## 📝 部署后更新

部署 PopCowDefi 代币后，需要更新以下文件：

1. **`apps/web/src/lib/solana/constants.ts`**
   ```typescript
   export const POPCOWDEFI_TOKEN_MINT = new PublicKey('YOUR_DEPLOYED_MINT_ADDRESS');
   ```

2. **`contracts/staking/scripts/initialize-staking-pool.ts`**
   ```typescript
   const config = {
     popcowDefiMint: 'YOUR_DEPLOYED_MINT_ADDRESS',
     // ...
   };
   ```

3. **环境变量**
   ```bash
   NEXT_PUBLIC_POPCOWDEFI_MINT=YOUR_DEPLOYED_MINT_ADDRESS
   ```

---

## ⚠️ 重要提示

1. **POPCOW 地址已确认**: `8mrMRf8QwGh5bSrgzKsMmHPTTGqDcENU91SWuXEypump`
2. **PopCowDefi 待部署**: 使用 `deploy-popcow-token.ts` 脚本部署
3. **地址验证**: 部署后务必在 Solana Explorer 验证地址正确性
4. **安全提醒**: 不要使用未经验证的地址进行交易

---

## 📚 相关文档

- [代币发行脚本](./deploy-popcow-token.ts)
- [质押池初始化](./initialize-staking-pool.ts)
- [兑换比例说明](./STAKING_CONVERSION_RATE.md)
- [白皮书](../PopCow-Whitepaper.md)

---

*最后更新: 2026年1月15日*  
*版本: 1.0*
