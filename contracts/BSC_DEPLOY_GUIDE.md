# BSC 部署指南

## 📋 前置条件

### 1. 环境变量配置 (.env 文件)

在 `contracts/` 目录下创建 `.env` 文件，填入以下配置：

```bash
# 部署账号私钥 (不含 0x 前缀)
# ⚠️ 此账号将成为合约的管理员/所有者
PRIVATE_KEY=your_private_key_here

# BSC RPC URL
BSC_RPC_URL=https://bsc-dataseed.binance.org/
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/

# BscScan API Key (用于合约验证)
# 获取地址: https://bscscan.com/myapikey
BSCSCAN_API_KEY=your_bscscan_api_key
```

### 2. 账户余额

确保部署账户有足够的 BNB：
- **主网**: 建议至少 0.1 BNB
- **测试网**: 可从 https://testnet.bnbchain.org/faucet-smart 获取测试 BNB

---

## 🚀 部署命令

### 部署到 BSC 主网

```bash
cd contracts

# 加载环境变量
source .env

# 部署 (使用 DeployBSC 脚本)
forge script script/Deploy.s.sol:DeployBSC \
  --rpc-url $BSC_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $BSCSCAN_API_KEY \
  -vvvv
```

### 部署到 BSC 测试网

```bash
cd contracts

# 加载环境变量
source .env

# 部署 (使用 DeployBSCTestnet 脚本)
forge script script/Deploy.s.sol:DeployBSCTestnet \
  --rpc-url $BSC_TESTNET_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $BSCSCAN_API_KEY \
  -vvvv
```

---

## 📝 部署后验证

如果部署时未自动验证，可手动验证：

```bash
# 设置合约地址环境变量
export MULTI_ASSET_STAKING=0x...  # 部署输出的地址
export COWGUARD_INSURANCE=0x...   # 部署输出的地址

# 运行验证脚本
chmod +x script/verify-bsc.sh
./script/verify-bsc.sh
```

---

## 🔧 合约配置

部署完成后，合约会自动配置以下内容：

### MultiAssetStaking (质押合约)
- ✅ USDT 作为奖励代币
- ✅ Chainlink BNB/USD 喂价
- ✅ USDT/USDC 可质押代币 (8% APY)
- ✅ 部署者为 DEFAULT_ADMIN_ROLE 和 OPERATOR_ROLE

### CowGuardInsurance (保险合约)
- ✅ USDT 作为支付代币
- ✅ 2% 协议费率
- ✅ 部署者为 Owner (管理员)

---

## 📊 BSC 合约地址参考

### BSC Mainnet 代币
| 代币 | 地址 |
|------|------|
| USDT | `0x55d398326f99059fF775485246999027B3197955` |
| USDC | `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` |

### Chainlink Price Feeds (BSC Mainnet)
| 喂价 | 地址 |
|------|------|
| BNB/USD | `0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE` |
| USDT/USD | `0xB97Ad0E74fa7d920791E90258A6E2085088b4320` |
| USDC/USD | `0x51597f405303C4377E36123cBc172b13269EA163` |

### Chainlink Price Feeds (BSC Testnet)
| 喂价 | 地址 |
|------|------|
| BNB/USD | `0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526` |

---

## ⚠️ 安全提醒

1. **私钥安全**: 绝不要将 `.env` 文件提交到 Git
2. **管理员权限**: 部署私钥对应的地址将成为合约管理员
3. **测试先行**: 建议先在 BSC Testnet 测试后再部署主网
4. **Gas 估算**: 部署两个合约预计消耗约 0.05-0.1 BNB
