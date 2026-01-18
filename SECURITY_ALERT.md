# 🚨 安全警报：.env 文件泄露

## 问题描述

`.env` 文件已被提交到 Git 仓库，可能包含敏感信息（私钥、API 密钥等）。

## 立即采取的行动

### 1. 紧急措施（立即执行）

- [ ] **转移所有资金**：立即将所有代币从受影响的钱包转移到新钱包
- [ ] **更换私钥**：生成新的钱包和私钥
- [ ] **更换 API 密钥**：
  - BSCScan API Key
  - Helius API Key
  - WalletConnect Project ID
  - 其他所有 API 密钥
- [ ] **更换服务密码**：所有相关服务的密码

### 2. 清理 Git 历史

已创建脚本 `/scripts/remove-env-from-git.sh` 用于从 Git 历史中移除 `.env` 文件。

**使用方法：**
```bash
cd /home/zyj_dev/AlphaNest
./scripts/remove-env-from-git.sh
```

**注意：**
- 这会重写 Git 历史
- 需要强制推送：`git push --force --all`
- 所有协作者需要重新克隆仓库

### 3. 验证清理

检查 `.env` 是否已从 Git 历史中移除：
```bash
git log --all --full-history -- .env
```

如果没有任何输出，说明已成功移除。

### 4. 预防措施

✅ `.gitignore` 已更新，包含更严格的 `.env` 文件规则

**检查清单：**
- [ ] 确认 `.gitignore` 包含 `.env*` 规则
- [ ] 使用 `git check-ignore .env` 验证文件被忽略
- [ ] 在提交前使用 `git status` 检查是否有 `.env` 文件
- [ ] 考虑使用 Git hooks 自动检查

## 受影响的内容

检查以下文件是否包含敏感信息：

- [ ] `.env` (根目录)
- [ ] `contracts/.env`
- [ ] `apps/web/.env*`
- [ ] `apps/api/.env*`
- [ ] 任何包含 `PRIVATE_KEY`、`API_KEY`、`SECRET` 的文件

## 新钱包设置

### Solana 钱包
```bash
# 生成新钱包
solana-keygen new --outfile ~/.config/solana/mainnet-keypair.json

# 检查地址
solana address -k ~/.config/solana/mainnet-keypair.json
```

### BSC 钱包
使用 MetaMask 或其他钱包工具生成新地址。

## 更新环境变量

创建新的 `.env` 文件，使用新的密钥：

```bash
# 从 .env.example 复制模板
cp .env.example .env

# 填入新的密钥（不要提交到 Git！）
```

## 监控

- [ ] 监控旧钱包地址的异常活动
- [ ] 检查所有相关服务的访问日志
- [ ] 设置资金转移警报

## 联系支持

如果发现资金被盗或异常活动：
1. 立即冻结相关账户
2. 联系交易所支持
3. 报告安全事件

---

**最后更新：** 2026-01-18
**状态：** 🔴 紧急处理中
