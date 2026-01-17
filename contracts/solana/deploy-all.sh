#!/bin/bash

# 部署所有程序到 soldev 网络
set -e

WALLET_FILE="$HOME/.config/solana/soldev.json"
SOLDEV_RPC_URL="${SOLDEV_RPC_URL:-https://api.devnet.solana.com}"

echo "=== 开始部署到 soldev 网络 ==="
echo "钱包: $WALLET_FILE"
echo "RPC: $SOLDEV_RPC_URL"
echo ""

# 配置 Solana CLI
solana config set --url "$SOLDEV_RPC_URL" --keypair "$WALLET_FILE"

# 检查余额
BALANCE=$(solana balance | grep -oP '\d+\.\d+' || echo "0")
echo "当前余额: $BALANCE SOL"
echo ""

# 部署所有程序
PROGRAMS=(
  "popcow_token"
  "cowguard_insurance"
  "popcow_staking"
  "token_vesting"
  "yield_vault"
  "multi_asset_staking"
  "reputation_registry"
  "governance"
  "points_system"
  "referral_system"
)

for program in "${PROGRAMS[@]}"; do
  echo "部署 $program..."
  if [ -f "target/deploy/${program}.so" ]; then
    solana program deploy \
      "target/deploy/${program}.so" \
      --program-id "target/deploy/${program}-keypair.json" \
      --keypair "$WALLET_FILE" \
      --url "$SOLDEV_RPC_URL" || echo "  ⚠ $program 部署失败"
  else
    echo "  ⚠ 未找到 ${program}.so，跳过"
  fi
  echo ""
done

echo "=== 部署完成 ==="
