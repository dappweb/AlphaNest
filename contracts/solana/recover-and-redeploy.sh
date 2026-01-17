#!/bin/bash
# 回收已部署程序的租金并重新部署

set -e

cd "$(dirname "$0")"

echo "=== 回收程序租金并重新部署 ==="
echo ""

# 检查余额
current_balance=$(solana balance --url devnet 2>&1 | grep -oP '\d+\.\d+' || echo "0")
echo "当前余额: $current_balance SOL"
echo ""

# 已部署的程序 ID
deployed_programs=(
    "7ezXYQTAtaBYT9aN7ZJnztfoyUk1LNb8xArqbWJBN63N:popcow_token"
    "g1MeF25X1keZqdDDqtqi49SBFvTvE2YCRBbovdDQ3X7:token_vesting"
    "ApBvLgb7YG4T8GNuaGXp1YVd9dBNRmjj2HmNdrKmSeWj:referral_system"
    "9ffadCibzkjgAgFA88Q6jGSK4vSuq7Wa45nhWgPaqjYC:governance"
    "Fp6vHW8wVLEkZvgEpHt8o1WENaBW7xhmXQx1okQvU5HH:points_system"
)

echo "⚠️  警告: 关闭程序账户会回收租金，但程序将无法使用"
echo "按 Ctrl+C 取消，或按 Enter 继续..."
read

total_recovered=0

# 关闭程序账户并回收租金
for program_info in "${deployed_programs[@]}"; do
    IFS=':' read -r pid name <<< "$program_info"
    
    echo ""
    echo "关闭程序: $name ($pid)"
    
    # 检查程序是否存在
    if solana program show "$pid" --url devnet 2>&1 | grep -q "Program Id"; then
        # 获取程序账户余额
        balance_before=$(solana account "$pid" --url devnet 2>&1 | grep "Balance:" | awk '{print $2}' | sed 's/SOL//' || echo "0")
        
        echo "  程序账户余额: $balance_before SOL"
        
        # 关闭程序账户（使用 --bypass-warning 标志）
        result=$(solana program close "$pid" --url devnet --bypass-warning 2>&1)
        
        if echo "$result" | grep -q "Signature"; then
            echo "  ✅ 程序已关闭，租金已回收"
            total_recovered=$(echo "$total_recovered + $balance_before" | bc -l 2>/dev/null || echo "$total_recovered")
        else
            echo "  ❌ 关闭失败: $(echo "$result" | grep -E "(Error|error)" | head -1)"
        fi
    else
        echo "  ⚠️  程序不存在或已关闭"
    fi
    
    sleep 1
done

echo ""
echo "=== 回收完成 ==="
new_balance=$(solana balance --url devnet 2>&1 | grep -oP '\d+\.\d+' || echo "0")
echo "新余额: $new_balance SOL"
echo "回收的租金: ~$total_recovered SOL"
echo ""

# 检查是否足够重新部署
echo "检查是否足够重新部署所有程序..."
required=$(echo "10 * 2.5" | bc -l)
if (( $(echo "$new_balance >= $required" | bc -l 2>/dev/null || echo "0") )); then
    echo "✅ 余额充足，可以重新部署所有程序"
    echo ""
    echo "开始重新部署..."
    ./deploy-remaining.sh
else
    echo "⚠️  余额不足 ($new_balance SOL < $required SOL)"
    echo "需要至少 $required SOL 才能重新部署所有程序"
fi
