# GitBook 快速复制粘贴导入指南

由于 GitBook API 限制，建议使用以下方法快速导入：

## 🚀 方法：复制粘贴（最快）

### 步骤 1: 打开 GitBook Space

访问: **https://app.gitbook.com/spaces/lXNHdMcZvKclDpQx8AXm**

### 步骤 2: 创建页面并复制内容

按照以下顺序创建页面，每个页面创建后，打开对应的 Markdown 文件，复制全部内容，粘贴到 GitBook 编辑器：

#### 1. 创建根页面：介绍

1. 点击左侧 "+" → "New page"
2. 标题: `AlphaNest 介绍`
3. 打开项目中的 `README.md` 文件
4. 全选复制 (Ctrl+A, Ctrl+C)
5. 粘贴到 GitBook 编辑器
6. 点击 "Publish"

#### 2. 创建分组：设置指南

1. 点击左侧 "+" → "New group"
2. 名称: `设置指南`

#### 3. 在"设置指南"分组下创建页面

**页面 1: 设置指南**
- 标题: `设置指南`
- 文件: `SETUP_GUIDE.md`
- 复制粘贴内容

**页面 2: GitBook 设置**
- 标题: `GitBook 文档同步设置`
- 文件: `GITBOOK_SETUP.md`
- 复制粘贴内容

#### 4. 创建分组：部署

1. 点击左侧 "+" → "New group"
2. 名称: `部署`

#### 5. 在"部署"分组下创建页面

**页面 1: 快速启动**
- 标题: `快速启动指南`
- 文件: `PRODUCTION_QUICK_START.md`

**页面 2: 部署指南**
- 标题: `部署指南`
- 文件: `DEPLOYMENT_GUIDE.md`

**页面 3: 生产检查清单**
- 标题: `生产环境检查清单`
- 文件: `PRODUCTION_CHECKLIST.md`

**页面 4: 可行性报告**
- 标题: `生产环境可行性报告`
- 文件: `PRODUCTION_FEASIBILITY_REPORT.md`

#### 6. 创建分组：开发

1. 点击左侧 "+" → "New group"
2. 名称: `开发`

#### 7. 在"开发"分组下创建页面

**页面: 功能可用性**
- 标题: `功能可用性报告`
- 文件: `FUNCTIONAL_AVAILABILITY_REPORT.md`

## 📋 文件位置

所有文件都在项目根目录：

```
/home/zyj_dev/AlphaNest/
├── README.md
├── SETUP_GUIDE.md
├── PRODUCTION_QUICK_START.md
├── DEPLOYMENT_GUIDE.md
├── PRODUCTION_CHECKLIST.md
├── PRODUCTION_FEASIBILITY_REPORT.md
├── FUNCTIONAL_AVAILABILITY_REPORT.md
└── GITBOOK_SETUP.md
```

## ⚡ 快速操作提示

1. **使用两个窗口**：
   - 窗口1: GitBook 编辑器
   - 窗口2: 文件管理器或编辑器打开 Markdown 文件

2. **批量操作**：
   - 先创建所有页面（空页面）
   - 然后逐个填充内容

3. **复制技巧**：
   - 在文件编辑器中: `Ctrl+A` (全选) → `Ctrl+C` (复制)
   - 在 GitBook 中: `Ctrl+V` (粘贴)

## ✅ 完成检查

导入完成后确认：
- [ ] 8 个文档都已创建
- [ ] 内容完整
- [ ] 格式正确
- [ ] 链接可访问

---

**预计时间**: 10-15 分钟
