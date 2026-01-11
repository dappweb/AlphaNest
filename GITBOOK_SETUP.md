# GitBook 文档同步设置指南

## 📚 概述

本指南说明如何将 AlphaNest 项目文档同步到 GitBook。

## 🔑 API Key 配置

已配置的 GitBook API Key:
```
gb_api_ANiQcNrXuLcNYWVOr9bQ10X2HZu8WWdij6bu0Eo4
```

## 🚀 快速开始

### 方法 1: 使用 GitBook Web UI (推荐)

这是最简单的方法，适合首次设置：

1. **访问 GitBook**: https://app.gitbook.com
2. **创建新 Space**: 点击 "Create new" → "Space"
3. **导入文档**: 在 Space 中点击 "Import" → "Import from files"
4. **上传文档**: 选择项目根目录下的 Markdown 文件

详细步骤请参考: [scripts/gitbook-manual-setup.md](./scripts/gitbook-manual-setup.md)

### 方法 2: 使用同步脚本

如果您已经有 GitBook Space ID：

```bash
# 设置环境变量
export GITBOOK_API_KEY=gb_api_ANiQcNrXuLcNYWVOr9bQ10X2HZu8WWdij6bu0Eo4
export GITBOOK_SPACE_ID=your_space_id_here

# 运行同步脚本
node scripts/sync-to-gitbook.js
```

## 📁 文档列表

以下文档将被同步到 GitBook:

| 文件 | 路径 | 标题 |
|------|------|------|
| `README.md` | `introduction` | AlphaNest 介绍 |
| `SETUP_GUIDE.md` | `setup/guide` | 设置指南 |
| `PRODUCTION_QUICK_START.md` | `deployment/quick-start` | 快速启动 |
| `DEPLOYMENT_GUIDE.md` | `deployment/guide` | 部署指南 |
| `PRODUCTION_CHECKLIST.md` | `deployment/production-checklist` | 生产检查清单 |
| `PRODUCTION_FEASIBILITY_REPORT.md` | `deployment/feasibility-report` | 可行性报告 |
| `FUNCTIONAL_AVAILABILITY_REPORT.md` | `development/functional-availability` | 功能可用性报告 |
| `GITBOOK_SETUP.md` | `setup/gitbook` | GitBook 文档同步设置 |

## 🔧 获取 Space ID

### 通过 Web UI

1. 访问您的 GitBook Space
2. URL 格式: `https://app.gitbook.com/spaces/{SPACE_ID}/...`
3. 从 URL 中复制 Space ID

### 通过 API

```bash
curl -H "Authorization: Bearer gb_api_ANiQcNrXuLcNYWVOr9bQ10X2HZu8WWdij6bu0Eo4" \
  https://api.gitbook.com/v1/spaces
```

## 📖 文档结构

建议的 GitBook 文档结构：

```
AlphaNest Documentation
├── 介绍
│   └── AlphaNest 介绍
├── 设置指南
│   ├── 设置指南
│   └── GitBook 文档同步
├── 部署
│   ├── 快速启动
│   ├── 部署指南
│   ├── 生产检查清单
│   └── 可行性报告
└── 开发
    └── 功能可用性
```

## 🔄 自动化同步

### 使用 npm scripts

在项目根目录创建 `package.json` (如果不存在):

```json
{
  "scripts": {
    "docs:sync": "node scripts/sync-to-gitbook.js"
  }
}
```

运行:

```bash
npm run docs:sync
```

### 使用 GitHub Actions

创建 `.github/workflows/gitbook-sync.yml`:

```yaml
name: Sync to GitBook

on:
  push:
    branches: [main]
    paths:
      - '*.md'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Sync to GitBook
        env:
          GITBOOK_API_KEY: ${{ secrets.GITBOOK_API_KEY }}
          GITBOOK_SPACE_ID: ${{ secrets.GITBOOK_SPACE_ID }}
        run: |
          node scripts/sync-to-gitbook.js
```

## 🐛 故障排查

### 错误: API Key 无效

- 检查 API Key 是否正确
- 确认 API Key 有访问权限
- 测试 API Key: `curl -H "Authorization: Bearer YOUR_KEY" https://api.gitbook.com/v1/user`

### 错误: Space 不存在

- 首次使用需要通过 Web UI 创建 Space
- 获取 Space ID 并设置环境变量
- 参考 [手动设置指南](./scripts/gitbook-manual-setup.md)

### 错误: 内容创建失败

- 检查文件路径是否正确
- 确认 Markdown 格式有效
- 查看 API 错误信息

## 📚 参考资源

- [GitBook API 文档](https://docs.gitbook.com/api)
- [GitBook API 认证](https://docs.gitbook.com/api/authentication)
- [GitBook Content API](https://docs.gitbook.com/api/content)

## ✅ 检查清单

- [ ] GitBook 账户已创建
- [ ] API Key 已配置
- [ ] Space 已创建 (通过 Web UI)
- [ ] Space ID 已获取
- [ ] 环境变量已设置
- [ ] 同步脚本已运行
- [ ] 文档已成功同步
- [ ] 文档链接可访问

## 🔗 相关文件

- [手动设置指南](./scripts/gitbook-manual-setup.md) - 详细的 Web UI 设置步骤
- [同步脚本](./scripts/sync-to-gitbook.js) - 自动化同步脚本
- [配置文件](./scripts/gitbook-config.json) - GitBook 配置

---

**最后更新**: 2026-01-11  
**状态**: ✅ 脚本已就绪，等待 Space ID
