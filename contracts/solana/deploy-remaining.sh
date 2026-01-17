#!/bin/bash
# 部署剩余的程序到 devnet

set -e

cd "$(dirname "$0")"

echo "=== 部署剩余程序到 devnet ==="
echo ""

# 检查余额
balance=$(solana balance --url devnet 2>&1 | grep -oP '\d+\.\d+' || echo "0")
echo "当前余额: $balance SOL"
echo ""

# 需要部署的程序列表（按大小排序）
programs=(
    "yield_vault"
    "reputation_registry"
    "popcow_staking"
    "cowguard_insurance"
    "multi_asset_staking"
)

deployed_count=0
failed_count=0

for program in "${programs[@]}"; do
    so_file="target/deploy/${program}.so"
    keypair_file="target/deploy/${program}-keypair.json"
    
    if [ ! -f "$so_file" ]; then
        echo "⚠️  跳过 $program: 构建文件不存在"
        continue
    fi
    
    if [ ! -f "$keypair_file" ]; then
        echo "⚠️  跳过 $program: keypair 文件不存在"
        continue
    fi
    
    # 检查是否已部署
    program_id=$(solana address -k "$keypair_file" 2>/dev/null)
    if solana program show "$program_id" --url devnet 2>&1 | grep -q "Program Id"; then
        echo "✅ $program: 已部署 ($program_id)"
        continue
    fi
    
    echo "部署 $program..."
    result=$(solana program deploy "$so_file" --program-id "$keypair_file" --url devnet 2>&1)
    
    if echo "$result" | grep -q "Program Id"; then
        program_id=$(echo "$result" | grep "Program Id" | awk '{print $3}')
        signature=$(echo "$result" | grep "Signature" | awk '{print $2}')
        echo "  ✅ 部署成功"
        echo "  Program ID: $program_id"
        echo "  Signature: $signature"
        deployed_count=$((deployed_count + 1))
    else
        error=$(echo "$result" | grep -E "(Error|insufficient)" | head -1)
        echo "  ❌ 部署失败: $error"
        failed_count=$((failed_count + 1))
        
        # 检查余额
        balance=$(solana balance --url devnet 2>&1 | grep -oP '\d+\.\d+' || echo "0")
        if (( $(echo "$balance < 2.0" | bc -l 2>/dev/null || echo "1") )); then
            echo ""
            echo "⚠️  余额不足 ($balance SOL)，停止部署"
            break
        fi
    fi
    
    echo ""
    sleep 1
done

echo "=== 部署完成 ==="
echo "成功: $deployed_count 个程序"
echo "失败: $failed_count 个程序"
echo ""
echo "当前余额: $(solana balance --url devnet 2>&1 | grep -oP '\d+\.\d+' || echo '检查中...') SOL"
