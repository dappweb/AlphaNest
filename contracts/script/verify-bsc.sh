#!/bin/bash

# ============================================
# AlphaNest BSC 合约验证脚本
# ============================================
# 
# 使用前请确保:
# 1. 已安装 Foundry (forge, cast)
# 2. 已配置 .env 文件中的 BSCSCAN_API_KEY
# 3. 已成功部署合约并记录地址
# 
# 获取 API Key: https://bscscan.com/myapikey
# ============================================

set -e

cd "$(dirname "$0")/.."

# 加载环境变量
if [ -f .env ]; then
  source .env
else
  echo "❌ 未找到 .env 文件"
  exit 1
fi

if [ -z "$BSCSCAN_API_KEY" ]; then
  echo "❌ 请先配置 BSCSCAN_API_KEY"
  echo "获取地址: https://bscscan.com/myapikey"
  exit 1
fi

# 检查部署地址是否已设置
if [ -z "$MULTI_ASSET_STAKING" ] || [ -z "$COWGUARD_INSURANCE" ]; then
  echo "❌ 请先设置合约部署地址环境变量:"
  echo "   export MULTI_ASSET_STAKING=0x..."
  echo "   export COWGUARD_INSURANCE=0x..."
  exit 1
fi

# 获取部署者地址
DEPLOYER=$(cast wallet address --private-key "$PRIVATE_KEY")

echo "🔍 开始验证 BSC 合约..."
echo "📋 部署者地址: $DEPLOYER"
echo ""

# BSC Mainnet 配置
BSC_USDT="0x55d398326f99059fF775485246999027B3197955"
CHAINLINK_BNB_USD="0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE"

# 验证函数
verify_contract() {
  local name=$1
  local address=$2
  local contract=$3
  local args=$4
  
  echo "📝 验证 $name ($address)..."
  
  if [ -z "$args" ]; then
    forge verify-contract \
      --chain 56 \
      --etherscan-api-key "$BSCSCAN_API_KEY" \
      "$address" \
      "$contract" \
      --watch || echo "⚠️ $name 验证失败或已验证"
  else
    forge verify-contract \
      --chain 56 \
      --etherscan-api-key "$BSCSCAN_API_KEY" \
      "$address" \
      "$contract" \
      --constructor-args "$args" \
      --watch || echo "⚠️ $name 验证失败或已验证"
  fi
  
  echo ""
}

# MultiAssetStaking (rewardToken, treasury, nativePriceFeed)
STAKING_ARGS=$(cast abi-encode "constructor(address,address,address)" "$BSC_USDT" "$DEPLOYER" "$CHAINLINK_BNB_USD")
verify_contract "MultiAssetStaking" "$MULTI_ASSET_STAKING" "src/MultiAssetStaking.sol:MultiAssetStaking" "$STAKING_ARGS"

# CowGuardInsurance (paymentToken, treasury, treasuryFee)
# treasuryFee = 200 (2%)
INSURANCE_ARGS=$(cast abi-encode "constructor(address,address,uint256)" "$BSC_USDT" "$DEPLOYER" 200)
verify_contract "CowGuardInsurance" "$COWGUARD_INSURANCE" "src/CowGuardInsurance.sol:CowGuardInsurance" "$INSURANCE_ARGS"

echo "✅ BSC 合约验证完成!"
echo ""
echo "📋 BscScan 链接:"
echo "   MultiAssetStaking:  https://bscscan.com/address/$MULTI_ASSET_STAKING#code"
echo "   CowGuardInsurance:  https://bscscan.com/address/$COWGUARD_INSURANCE#code"
echo ""
echo "📋 Chainlink 喂价地址:"
echo "   BNB/USD:  https://bscscan.com/address/$CHAINLINK_BNB_USD"
