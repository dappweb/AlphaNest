# GitBook 手动设置指南

由于 GitBook API 的限制，建议通过以下方式设置文档：

## 方法 1: 使用 GitBook Web UI (推荐)

### 步骤 1: 创建 Space

1. 访问 https://app.gitbook.com
2. 使用您的账户登录
3. 点击 "Create new" → "Space"
4. 输入 Space 名称: "AlphaNest Documentation"
5. 选择可见性 (Public 或 Private)
6. 创建 Space

### 步骤 2: 获取 Space ID

Space ID 可以从以下位置获取：
- URL: `https://app.gitbook.com/spaces/{SPACE_ID}/...`
- 或通过 API: `GET https://api.gitbook.com/v1/spaces` (需要认证)

### 步骤 3: 导入文档

1. 在 GitBook Space 中，点击 "Import"
2. 选择 "Import from files"
3. 上传以下 Markdown 文件：
   - `README.md`
   - `SETUP_GUIDE.md`
   - `DEPLOYMENT_GUIDE.md`
   - `PRODUCTION_CHECKLIST.md`
   - `PRODUCTION_FEASIBILITY_REPORT.md`
   - `FUNCTIONAL_AVAILABILITY_REPORT.md`
   - `PRODUCTION_QUICK_START.md`
   - `GITBOOK_SETUP.md`

### 步骤 4: 组织文档结构

在 GitBook 中创建以下结构：

```
AlphaNest Documentation
├── 介绍
│   └── AlphaNest 介绍 (README.md)
├── 设置指南
│   ├── 设置指南 (SETUP_GUIDE.md)
│   └── GitBook 文档同步 (GITBOOK_SETUP.md)
├── 部署
│   ├── 快速启动 (PRODUCTION_QUICK_START.md)
│   ├── 部署指南 (DEPLOYMENT_GUIDE.md)
│   ├── 生产检查清单 (PRODUCTION_CHECKLIST.md)
│   └── 可行性报告 (PRODUCTION_FEASIBILITY_REPORT.md)
└── 开发
    └── 功能可用性 (FUNCTIONAL_AVAILABILITY_REPORT.md)
```

## 方法 2: 使用 GitBook CLI

### 安装 GitBook CLI

```bash
npm install -g gitbook-cli
```

### 初始化 GitBook 项目

```bash
# 创建 GitBook 目录
mkdir alphanest-docs
cd alphanest-docs

# 初始化
gitbook init

# 创建 SUMMARY.md 定义结构
cat > SUMMARY.md << 'EOF'
# Summary

* [介绍](README.md)
* [设置指南](setup/guide.md)
* [部署](deployment/)
  * [快速启动](deployment/quick-start.md)
  * [部署指南](deployment/guide.md)
  * [生产检查清单](deployment/production-checklist.md)
  * [可行性报告](deployment/feasibility-report.md)
* [开发](development/)
  * [功能可用性](development/functional-availability.md)
EOF

# 复制文档文件
cp ../README.md .
mkdir -p setup deployment development
cp ../SETUP_GUIDE.md setup/guide.md
cp ../PRODUCTION_QUICK_START.md deployment/quick-start.md
cp ../DEPLOYMENT_GUIDE.md deployment/guide.md
cp ../PRODUCTION_CHECKLIST.md deployment/production-checklist.md
cp ../PRODUCTION_FEASIBILITY_REPORT.md deployment/feasibility-report.md
cp ../FUNCTIONAL_AVAILABILITY_REPORT.md development/functional-availability.md

# 预览
gitbook serve

# 构建
gitbook build
```

### 发布到 GitBook

```bash
# 安装 GitBook 发布工具
npm install -g @gitbook/cli

# 登录
gitbook login

# 发布
gitbook publish
```

## 方法 3: 使用 API (需要 Space ID)

如果您已经有 Space ID，可以使用提供的脚本：

```bash
# 设置环境变量
export GITBOOK_API_KEY=gb_api_ANiQcNrXuLcNYWVOr9bQ10X2HZu8WWdij6bu0Eo4
export GITBOOK_SPACE_ID=your_space_id_here

# 运行同步脚本
node scripts/sync-to-gitbook.js
```

## API Key 使用

您的 GitBook API Key:
```
gb_api_ANiQcNrXuLcNYWVOr9bQ10X2HZu8WWdij6bu0Eo4
```

### 测试 API Key

```bash
curl -H "Authorization: Bearer gb_api_ANiQcNrXuLcNYWVOr9bQ10X2HZu8WWdij6bu0Eo4" \
  https://api.gitbook.com/v1/user
```

### 获取 Space 列表

```bash
curl -H "Authorization: Bearer gb_api_ANiQcNrXuLcNYWVOr9bQ10X2HZu8WWdij6bu0Eo4" \
  https://api.gitbook.com/v1/spaces
```

## 推荐工作流

1. **首次设置**: 使用 GitBook Web UI 创建 Space 和导入文档
2. **后续更新**: 
   - 手动更新 (通过 Web UI)
   - 或使用 API 脚本 (如果有 Space ID)

## 文档链接

设置完成后，您的文档将可通过以下链接访问：

- **编辑**: https://app.gitbook.com/spaces/{SPACE_ID}
- **公开访问**: https://{SPACE_ID}.gitbook.io (如果设置为公开)

---

**提示**: GitBook API 可能有限制，建议优先使用 Web UI 进行初始设置。
