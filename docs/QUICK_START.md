# 🚀 AlphaNest 快速启动指南

## 5 分钟快速启动

### 步骤 1: 配置 GitHub Actions（2分钟）

运行一键设置脚本：

```bash
./scripts/one-click-setup.sh
```

或手动配置 GitHub Secrets：
1. 访问：https://github.com/dappweb/AlphaNest/settings/secrets/actions
2. 添加：
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

### 步骤 2: 运行数据库迁移（1分钟）

```bash
cd apps/api
npx wrangler d1 migrations apply alphanest-production
```

### 步骤 3: 创建第一个管理员（1分钟）

```bash
./scripts/create-first-admin.sh
```

按提示输入：
- 钱包地址（你的 Solana 钱包）
- 角色（super_admin/admin/operator）
- 权限（JSON 数组，默认 `["*"]`）

### 步骤 4: 测试部署（1分钟）

```bash
git push origin main
```

查看部署状态：
- https://github.com/dappweb/AlphaNest/actions

---

## ✅ 验证清单

完成以上步骤后，验证：

- [ ] GitHub Actions 工作流正常运行
- [ ] API 部署成功
- [ ] Web 部署成功
- [ ] 数据库迁移已应用
- [ ] 管理员账户已创建
- [ ] 可以访问管理员页面并登录

---

## 🔗 重要链接

- **GitHub 仓库**: https://github.com/dappweb/AlphaNest
- **GitHub Actions**: https://github.com/dappweb/AlphaNest/actions
- **Cloudflare Dashboard**: https://dash.cloudflare.com/
- **API 端点**: https://alphanest-api.dappweb.workers.dev
- **Web 应用**: https://alphanest.pages.dev (部署后)

---

## 📚 详细文档

- [下一步操作指南](../NEXT_STEPS.md)
- [自动配置指南](./AUTO_SETUP_GUIDE.md)
- [管理员系统指南](./CONTRACT_ADMIN_GUIDE.md)
- [部署指南](../DEPLOYMENT_GUIDE.md)

---

**需要帮助？** 查看 [故障排查](./GITHUB_ACTIONS_SETUP.md#故障排查)
