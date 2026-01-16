#!/bin/bash

# 最终部署脚本 - 部署所有程序到 soldev 网络
set -e

WALLET_FILE="$HOME/.config/solana/soldev.json"
SOLDEV_RPC_URL="${SOLDEV_RPC_URL:-https://api.devnet.solana.com}"

echo "=========================================="
echo "  Soldev 网络部署脚本"
echo "=========================================="
echo ""
echo "钱包: $WALLET_FILE"
echo "RPC: $SOLDEV_RPC_URL"
echo ""

# 检查钱包文件
if [ ! -f "$WALLET_FILE" ]; then
    echo "❌ 错误: 钱包文件不存在: $WALLET_FILE"
    exit 1
fi

# 配置 Solana CLI
echo "📝 配置 Solana CLI..."
solana config set --url "$SOLDEV_RPC_URL" --keypair "$WALLET_FILE"

# 检查余额
echo ""
echo "💰 检查账户余额..."
BALANCE=$(solana balance 2>/dev/null | grep -oP '\d+\.\d+' || echo "0")
echo "当前余额: $BALANCE SOL"

if (( $(echo "$BALANCE < 0.5" | bc -l 2>/dev/null || echo "1") )); then
    echo "⚠️  警告: 余额不足，可能需要获取测试 SOL"
    echo "   运行: solana airdrop 2"
    echo ""
fi

# 程序列表和对应的程序 ID
declare -A PROGRAM_IDS=(
    ["popcow_token"]="GB13aFFGs6G76dSWWNwHfH596npdwFcxkR5x4Ur4uBjS"
    ["cowguard_insurance"]="3vq7cmrWBVQZF11mHCKnDhppSyyBy9xstbz6tzZqDYcg"
    ["popcow_staking"]="4pMUmKCTvxCiM6ccGyc851yhyKnaKfJ3q2umLhyZ9Y2d"
    ["token_vesting"]="FKmtGh85bPYWRCyiJc8rHN6kohJWYgrkWvc8CtXAyz8n"
    ["yield_vault"]="ECAnyfJmCxVxUSgv4MW7uvAkMophVnG5VTvEAgQt2vrP"
    ["multi_asset_staking"]="EUN7ptUWascGEbBgFVQTxmFWzMSoN95YG5JGvabNtKYF"
    ["reputation_registry"]="6RpDY1sJJyQcTkYqr3myYbLuCA5H9SLeGonyRUBhBbWt"
    ["governance"]="5QCNr7vD639eE1R3rbts78qYZQEyc3L8XJriHNcLNyLW"
    ["points_system"]="2zv8gpnD7DYogiDb591uceav7Rkxfqz5aCK18hMqPCxH"
    ["referral_system"]="Cd2NZkSS5K4kqyWQcdaGv8deE8k75JrWjwU3byQRqEju"
)

echo ""
echo "🚀 开始部署程序..."
echo ""

DEPLOYED=0
FAILED=0
SKIPPED=0

for program in "${!PROGRAM_IDS[@]}"; do
    PROGRAM_ID="${PROGRAM_IDS[$program]}"
    SO_FILE="target/deploy/${program}.so"
    KEYPAIR_FILE="target/deploy/${program}-keypair.json"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 $program"
    echo "   程序 ID: $PROGRAM_ID"
    
    if [ ! -f "$SO_FILE" ]; then
        echo "   ⚠️  跳过: 未找到 $SO_FILE"
        echo "   提示: 需要先运行 'anchor build' 构建程序"
        ((SKIPPED++))
        echo ""
        continue
    fi
    
    if [ ! -f "$KEYPAIR_FILE" ]; then
        echo "   ⚠️  跳过: 未找到 $KEYPAIR_FILE"
        ((SKIPPED++))
        echo ""
        continue
    fi
    
    echo "   部署中..."
    if solana program deploy \
        "$SO_FILE" \
        --program-id "$KEYPAIR_FILE" \
        --keypair "$WALLET_FILE" \
        --url "$SOLDEV_RPC_URL" \
        --max-signatures 2048 \
        --allow-unsafe 2>&1 | tee /tmp/deploy_${program}.log; then
        echo "   ✅ 部署成功!"
        ((DEPLOYED++))
    else
        echo "   ❌ 部署失败"
        ((FAILED++))
    fi
    echo ""
done

echo "=========================================="
echo "  部署总结"
echo "=========================================="
echo "✅ 成功: $DEPLOYED"
echo "❌ 失败: $FAILED"
echo "⚠️  跳过: $SKIPPED"
echo ""
echo "钱包地址: $(solana address --keypair "$WALLET_FILE")"
echo "网络: $SOLDEV_RPC_URL"
echo ""

if [ $DEPLOYED -gt 0 ]; then
    echo "🎉 部署完成!"
fi
