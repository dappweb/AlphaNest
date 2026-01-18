#!/bin/bash
# 从 Git 历史中完全移除 .env 文件
# ⚠️ 警告：这会重写 Git 历史，需要强制推送

set -e

echo "⚠️  警告：此脚本将从 Git 历史中完全移除 .env 文件"
echo "⚠️  这会重写 Git 历史，所有协作者需要重新克隆仓库"
echo ""
read -p "确认继续？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "已取消"
    exit 1
fi

# 使用 git filter-branch 或 git filter-repo 移除 .env 文件
if command -v git-filter-repo &> /dev/null; then
    echo "使用 git-filter-repo 移除 .env 文件..."
    git filter-repo --path .env --invert-paths --force
else
    echo "使用 git filter-branch 移除 .env 文件..."
    git filter-branch --force --index-filter \
        "git rm --cached --ignore-unmatch .env" \
        --prune-empty --tag-name-filter cat -- --all
fi

echo ""
echo "✅ .env 文件已从 Git 历史中移除"
echo ""
echo "⚠️  下一步操作："
echo "1. 检查 git log 确认 .env 已被移除"
echo "2. 强制推送到远程仓库: git push --force --all"
echo "3. 通知所有协作者重新克隆仓库"
echo "4. 立即更换所有泄露的私钥和钱包！"
echo ""
echo "⚠️  重要：如果仓库已公开，私钥可能已被泄露，请立即："
echo "   - 转移所有资金到新钱包"
echo "   - 更换所有 API 密钥"
echo "   - 更换所有服务密码"
