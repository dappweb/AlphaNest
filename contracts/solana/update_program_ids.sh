#!/bin/bash
# 更新 Anchor.toml 中的程序 ID

declare -A PROGRAM_IDS
PROGRAM_IDS[popcow_token]=$(solana address -k target/deploy/popcow_token-keypair.json 2>/dev/null)
PROGRAM_IDS[cowguard_insurance]=$(solana address -k target/deploy/cowguard_insurance-keypair.json 2>/dev/null)
PROGRAM_IDS[popcow_staking]=$(solana address -k target/deploy/popcow_staking-keypair.json 2>/dev/null)
PROGRAM_IDS[token_vesting]=$(solana address -k target/deploy/token_vesting-keypair.json 2>/dev/null)
PROGRAM_IDS[yield_vault]=$(solana address -k target/deploy/yield_vault-keypair.json 2>/dev/null)
PROGRAM_IDS[multi_asset_staking]=$(solana address -k target/deploy/multi_asset_staking-keypair.json 2>/dev/null)
PROGRAM_IDS[reputation_registry]=$(solana address -k target/deploy/reputation_registry-keypair.json 2>/dev/null)
PROGRAM_IDS[governance]=$(solana address -k target/deploy/governance-keypair.json 2>/dev/null)
PROGRAM_IDS[points_system]=$(solana address -k target/deploy/points_system-keypair.json 2>/dev/null)
PROGRAM_IDS[referral_system]=$(solana address -k target/deploy/referral_system-keypair.json 2>/dev/null)

echo "程序 ID 映射:"
for key in "${!PROGRAM_IDS[@]}"; do
  echo "  $key = ${PROGRAM_IDS[$key]}"
done
