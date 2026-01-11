#!/bin/bash

# ============================================
# AlphaNest Sepolia 合约验证脚本
# ============================================
# 
# 使用前请确保:
# 1. 已安装 Foundry (forge, cast)
# 2. 已配置 .env 文件中的 ETHERSCAN_API_KEY
# 
# 获取 API Key: https://etherscan.io/myapikey
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

if [ "$ETHERSCAN_API_KEY" = "your_etherscan_api_key" ] || [ -z "$ETHERSCAN_API_KEY" ]; then
  echo "❌ 请先配置 ETHERSCAN_API_KEY"
  echo "获取地址: https://etherscan.io/myapikey"
  exit 1
fi

echo "🔍 开始验证 Sepolia 合约..."
echo ""

# 部署地址 (2026-01-10 部署)
MOCK_USDC="0xDfB896d01E354F39dbd9125E6790AE65D28a25Cd"
ALPHA_TOKEN="0x3eAA60E349d9Bd1E366D19369cF753CBaC1f4488"
ALPHANEST_CORE="0x687111E43D417c99F993FB6D26F4b06E465c7A94"
REPUTATION_REGISTRY="0xC3a8D57aCa3D3d244057b69129621d87c3a37574"
CROSSCHAIN_VERIFIER="0x32229e84F7b63E201d0E4B64931F8ff1571e0a60"
TOKEN_FACTORY="0x5461D1F4a6854f509D7FdD1b5722C4ceF1E479d5"
ALPHAGUARD_ORACLE="0x3a8D8Fe1bE80B0DD36Ee16758F4108EEFfeEbb57"
ALPHAGUARD="0xB72A72EFC2F42092099Af61EFf2B2B8ad8f197a9"

DEPLOYER="0x4C10831CBcF9884ba72051b5287b6c87E4F74A48"

# 验证函数
verify_contract() {
  local name=$1
  local address=$2
  local contract=$3
  local args=$4
  
  echo "📝 验证 $name ($address)..."
  
  if [ -z "$args" ]; then
    forge verify-contract \
      --chain sepolia \
      --etherscan-api-key "$ETHERSCAN_API_KEY" \
      "$address" \
      "$contract" \
      --watch || echo "⚠️ $name 验证失败或已验证"
  else
    forge verify-contract \
      --chain sepolia \
      --etherscan-api-key "$ETHERSCAN_API_KEY" \
      "$address" \
      "$contract" \
      --constructor-args "$args" \
      --watch || echo "⚠️ $name 验证失败或已验证"
  fi
  
  echo ""
}

# MockUSDC (name="USD Coin", symbol="USDC", decimals=6)
USDC_ARGS=$(cast abi-encode "constructor(string,string,uint8)" "USD Coin" "USDC" 6)
verify_contract "MockUSDC" "$MOCK_USDC" "src/AlphaToken.sol:MockERC20" "$USDC_ARGS"

# AlphaToken (name="Alpha Token", symbol="ALPHA", initialSupply=1B)
ALPHA_ARGS=$(cast abi-encode "constructor(string,string,uint256)" "Alpha Token" "ALPHA" 1000000000000000000000000000)
verify_contract "AlphaToken" "$ALPHA_TOKEN" "src/AlphaToken.sol:AlphaToken" "$ALPHA_ARGS"

# AlphaNestCore (alphaToken, usdcToken)
CORE_ARGS=$(cast abi-encode "constructor(address,address)" "$ALPHA_TOKEN" "$MOCK_USDC")
verify_contract "AlphaNestCore" "$ALPHANEST_CORE" "src/AlphaNestCore.sol:AlphaNestCore" "$CORE_ARGS"

# ReputationRegistry (无构造参数)
verify_contract "ReputationRegistry" "$REPUTATION_REGISTRY" "src/ReputationRegistry.sol:ReputationRegistry" ""

# CrossChainVerifier (无构造参数)
verify_contract "CrossChainVerifier" "$CROSSCHAIN_VERIFIER" "src/CrossChainVerifier.sol:CrossChainVerifier" ""

# TokenFactory (registry, verifier)
FACTORY_ARGS=$(cast abi-encode "constructor(address,address)" "$REPUTATION_REGISTRY" "$CROSSCHAIN_VERIFIER")
verify_contract "TokenFactory" "$TOKEN_FACTORY" "src/TokenFactory.sol:TokenFactory" "$FACTORY_ARGS"

# AlphaGuardOracle (无构造参数)
verify_contract "AlphaGuardOracle" "$ALPHAGUARD_ORACLE" "src/AlphaGuardOracle.sol:AlphaGuardOracle" ""

# AlphaGuard (usdc, oracle, treasury)
GUARD_ARGS=$(cast abi-encode "constructor(address,address,address)" "$MOCK_USDC" "$ALPHAGUARD_ORACLE" "$DEPLOYER")
verify_contract "AlphaGuard" "$ALPHAGUARD" "src/AlphaGuard.sol:AlphaGuard" "$GUARD_ARGS"

echo "✅ 所有合约验证完成!"
echo ""
echo "📋 Etherscan 链接:"
echo "   MockUSDC:           https://sepolia.etherscan.io/address/$MOCK_USDC#code"
echo "   AlphaToken:         https://sepolia.etherscan.io/address/$ALPHA_TOKEN#code"
echo "   AlphaNestCore:      https://sepolia.etherscan.io/address/$ALPHANEST_CORE#code"
echo "   ReputationRegistry: https://sepolia.etherscan.io/address/$REPUTATION_REGISTRY#code"
echo "   CrossChainVerifier: https://sepolia.etherscan.io/address/$CROSSCHAIN_VERIFIER#code"
echo "   TokenFactory:       https://sepolia.etherscan.io/address/$TOKEN_FACTORY#code"
echo "   AlphaGuardOracle:   https://sepolia.etherscan.io/address/$ALPHAGUARD_ORACLE#code"
echo "   AlphaGuard:         https://sepolia.etherscan.io/address/$ALPHAGUARD#code"
