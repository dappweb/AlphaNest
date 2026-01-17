#!/bin/bash

# Soldev 网络部署脚本
# 使用提供的私钥部署所有 Solana 程序

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Soldev 网络部署脚本 ===${NC}"

# 私钥数组
PRIVATE_KEY_ARRAY="[24,243,40,13,251,242,198,54,1,41,175,7,3,78,239,156,94,6,250,201,18,81,249,251,88,114,92,4,81,238,206,244,61,61,241,237,128,180,248,248,150,247,198,176,129,235,104,160,88,141,96,105,40,22,120,191,207,32,5,83,84,186,168,222]"

# 创建钱包目录
WALLET_DIR="$HOME/.config/solana"
mkdir -p "$WALLET_DIR"

# 钱包文件路径
WALLET_FILE="$WALLET_DIR/soldev.json"

echo -e "${YELLOW}步骤 1: 创建钱包文件...${NC}"

# 使用 Node.js 将私钥数组转换为 keypair JSON 格式
node << EOF
const fs = require('fs');
const { Keypair } = require('@solana/web3.js');

const privateKeyArray = ${PRIVATE_KEY_ARRAY};
const secretKey = Uint8Array.from(privateKeyArray);
const keypair = Keypair.fromSecretKey(secretKey);

// 保存为 JSON 格式（包含公钥和私钥）
const keypairJson = {
  publicKey: Array.from(keypair.publicKey.toBytes()),
  secretKey: Array.from(keypair.secretKey)
};

fs.writeFileSync('${WALLET_FILE}', JSON.stringify(keypairJson, null, 2));
console.log('钱包文件已创建:', '${WALLET_FILE}');
console.log('公钥:', keypair.publicKey.toBase58());
EOF

if [ ! -f "$WALLET_FILE" ]; then
    echo -e "${RED}错误: 钱包文件创建失败${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 钱包文件创建成功${NC}"

# 配置 Solana CLI 使用 soldev 网络
# Soldev 通常使用自定义 RPC URL，这里使用常见的 soldev RPC
SOLDEV_RPC_URL="${SOLDEV_RPC_URL:-https://api.soldev.org}"

echo -e "${YELLOW}步骤 2: 配置 Solana CLI...${NC}"
solana config set --url "$SOLDEV_RPC_URL" --keypair "$WALLET_FILE"

# 检查余额
echo -e "${YELLOW}步骤 3: 检查账户余额...${NC}"
BALANCE=$(solana balance --url "$SOLDEV_RPC_URL" 2>/dev/null | grep -oP '\d+\.\d+' || echo "0")
echo "当前余额: $BALANCE SOL"

if (( $(echo "$BALANCE < 1" | bc -l 2>/dev/null || echo "1") )); then
    echo -e "${YELLOW}警告: 余额不足，可能需要获取测试 SOL${NC}"
    echo "如果 soldev 网络支持 airdrop，可以运行: solana airdrop 2"
fi

# 进入 Solana 目录
cd "$(dirname "$0")"

echo -e "${YELLOW}步骤 4: 构建所有程序...${NC}"
anchor build

if [ $? -ne 0 ]; then
    echo -e "${RED}错误: 构建失败${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 构建成功${NC}"

# 部署所有程序
echo -e "${YELLOW}步骤 5: 部署程序到 soldev 网络...${NC}"

# 获取所有程序目录
PROGRAMS=(
    "popcow-token"
    "cowguard-insurance"
    "staking"
    "token-vesting"
    "yield-vault"
    "multi-asset-staking"
    "reputation-registry"
    "governance"
    "points-system"
    "referral-system"
)

for program in "${PROGRAMS[@]}"; do
    if [ -d "programs/$program" ]; then
        echo -e "${YELLOW}部署 $program...${NC}"
        # 使用环境变量设置 RPC URL 和钱包
        ANCHOR_PROVIDER_URL="$SOLDEV_RPC_URL" ANCHOR_WALLET="$WALLET_FILE" anchor deploy --program-name "$program" || {
            echo -e "${YELLOW}警告: $program 部署失败，继续部署其他程序...${NC}"
        }
    else
        echo -e "${YELLOW}跳过 $program (目录不存在)${NC}"
    fi
done

echo -e "${GREEN}=== 部署完成 ===${NC}"
echo -e "钱包地址: $(solana address --keypair "$WALLET_FILE")"
echo -e "网络: soldev ($SOLDEV_RPC_URL)"
