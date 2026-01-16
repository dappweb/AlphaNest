#!/bin/bash

# 准备部署脚本 - 使用预构建文件
set -e

echo "=========================================="
echo "  准备使用预构建文件部署"
echo "=========================================="
echo ""

WALLET_FILE="$HOME/.config/solana/soldev.json"
DEPLOY_DIR="target/deploy"

# 检查钱包
if [ ! -f "$WALLET_FILE" ]; then
    echo "❌ 错误: 钱包文件不存在: $WALLET_FILE"
    exit 1
fi

# 检查 keypair
KEYPAIR_COUNT=$(ls -1 $DEPLOY_DIR/*-keypair.json 2>/dev/null | wc -l)
if [ $KEYPAIR_COUNT -eq 0 ]; then
    echo "⚠️  未找到 keypair 文件，正在生成..."
    node generate-program-keys.js
fi

echo "✅ Keypair 文件: $KEYPAIR_COUNT 个"
echo ""

# 检查构建文件
SO_COUNT=$(ls -1 $DEPLOY_DIR/*.so 2>/dev/null | wc -l)
echo "📦 构建文件检查:"
echo "   找到 $SO_COUNT 个 .so 文件"
echo ""

if [ $SO_COUNT -eq 0 ]; then
    echo "⚠️  未找到预构建文件 (.so)"
    echo ""
    echo "请将构建好的 .so 文件放到 $DEPLOY_DIR/ 目录"
    echo ""
    echo "需要的文件:"
    echo "  - popcow_token.so"
    echo "  - cowguard_insurance.so"
    echo "  - popcow_staking.so"
    echo "  - token_vesting.so"
    echo "  - yield_vault.so"
    echo "  - multi_asset_staking.so"
    echo "  - reputation_registry.so"
    echo "  - governance.so"
    echo "  - points_system.so"
    echo "  - referral_system.so"
    echo ""
    echo "获取方式:"
    echo "  1. 在其他环境构建后传输"
    echo "  2. 使用 Docker 构建"
    echo "  3. 从其他来源获取"
    echo ""
    exit 1
fi

# 列出找到的文件
echo "找到的构建文件:"
ls -1 $DEPLOY_DIR/*.so 2>/dev/null | while read file; do
    basename "$file"
done
echo ""

# 检查余额
echo "💰 检查账户余额..."
BALANCE=$(solana balance 2>/dev/null | grep -oP '\d+\.\d+' || echo "0")
echo "当前余额: $BALANCE SOL"
echo ""

if (( $(echo "$BALANCE < 1" | bc -l 2>/dev/null || echo "1") )); then
    echo "⚠️  警告: 余额不足，可能需要获取测试 SOL"
    echo "   运行: solana airdrop 2"
    echo ""
fi

echo "✅ 准备完成！"
echo ""
echo "运行以下命令开始部署:"
echo "  ./final-deploy.sh"
echo ""
