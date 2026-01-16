#!/bin/bash

# 创建第一个管理员脚本
# 用于在数据库中创建第一个超级管理员

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   创建第一个管理员                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# 检查 wrangler
if ! command -v wrangler &> /dev/null && ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ 需要安装 wrangler 或 npx${NC}"
    exit 1
fi

WRANGLER_CMD="npx wrangler"
if command -v wrangler &> /dev/null; then
    WRANGLER_CMD="wrangler"
fi

# 获取输入
echo "请输入管理员信息："
echo ""
read -p "钱包地址 (Solana): " WALLET_ADDRESS

if [ -z "$WALLET_ADDRESS" ]; then
    echo -e "${RED}❌ 钱包地址不能为空${NC}"
    exit 1
fi

read -p "角色 (super_admin/admin/operator, 默认: super_admin): " ROLE
ROLE=${ROLE:-"super_admin"}

read -p "权限 (JSON 数组, 默认: [\"*\"]): " PERMISSIONS
PERMISSIONS=${PERMISSIONS:-'["*"]'}

read -p "数据库名称 (默认: alphanest-production): " DB_NAME
DB_NAME=${DB_NAME:-"alphanest-production"}

echo ""
echo -e "${YELLOW}正在创建管理员...${NC}"
echo ""

# 生成 SQL
SQL=$(cat <<EOF
-- 创建用户（如果不存在）
INSERT INTO users (id, wallet_address, created_at, updated_at)
SELECT 
  'admin_user_' || substr(hex(randomblob(8)), 1, 16),
  '$WALLET_ADDRESS',
  unixepoch(),
  unixepoch()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE wallet_address = '$WALLET_ADDRESS'
);

-- 获取用户 ID
-- 创建管理员
INSERT INTO admins (
  id, 
  user_id, 
  wallet_address, 
  role, 
  permissions, 
  is_active, 
  created_at, 
  updated_at
)
SELECT 
  'admin_' || substr(hex(randomblob(8)), 1, 16),
  (SELECT id FROM users WHERE wallet_address = '$WALLET_ADDRESS' LIMIT 1),
  '$WALLET_ADDRESS',
  '$ROLE',
  '$PERMISSIONS',
  1,
  unixepoch(),
  unixepoch()
WHERE NOT EXISTS (
  SELECT 1 FROM admins WHERE wallet_address = '$WALLET_ADDRESS'
);
EOF
)

# 执行 SQL
echo "$SQL" | $WRANGLER_CMD d1 execute "$DB_NAME" --command "$SQL"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ 管理员创建成功！${NC}"
    echo ""
    echo "管理员信息："
    echo "  钱包地址: $WALLET_ADDRESS"
    echo "  角色: $ROLE"
    echo "  权限: $PERMISSIONS"
    echo ""
    echo "现在可以使用此钱包地址登录管理员系统了！"
else
    echo ""
    echo -e "${RED}❌ 创建失败，请检查错误信息${NC}"
    exit 1
fi
