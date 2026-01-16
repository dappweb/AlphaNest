# Docker 构建状态

## 当前问题

使用 Docker 构建时遇到以下问题：

1. **Cargo 版本不兼容**
   - Docker 镜像 `pylejeune/solana-dev:latest` 中的 Cargo 版本是 1.79.0
   - 依赖包 `constant_time_eq v0.4.2` 需要 `edition2024` 特性
   - `edition2024` 需要 Cargo >= 1.85.0

2. **工具链冲突**
   - `cargo build-sbf` 使用 Solana 工具链中的旧 Cargo（1.79.0）
   - 即使更新了系统 Rust nightly，`build-sbf` 仍使用旧版本

## 已尝试的解决方案

1. ✅ 安装 Docker
2. ✅ 拉取 `pylejeune/solana-dev:latest` 镜像
3. ✅ 更新 Anchor 到 0.30.1
4. ✅ 更新 Rust nightly 工具链
5. ❌ 锁定 `constant_time_eq` 版本（传递依赖，无法直接锁定）
6. ❌ 使用 `[patch.crates-io]`（patch 无法覆盖传递依赖到旧版本）

## 推荐解决方案

### 方案 1: 使用更新的 Docker 镜像（推荐）

寻找或构建包含更新 Cargo 版本的 Docker 镜像：

```bash
# 查找更新的镜像
docker search solana | grep -i anchor
docker search anchor

# 或构建自定义 Dockerfile
```

### 方案 2: 手动构建每个程序

绕过 Anchor，直接使用 `cargo build-sbf`：

```bash
for program in programs/*/; do
    cd "$program"
    cargo build-sbf
    cd ../..
done
```

然后手动生成 IDL 和部署。

### 方案 3: 使用 GitHub Actions 或其他 CI/CD

在支持更新工具链的环境中构建，然后下载构建产物。

### 方案 4: 等待依赖更新

等待 `constant_time_eq` 或 Solana 工具链更新，支持 `edition2024`。

## 当前状态

- ❌ 构建失败：0 个 .so 文件
- ✅ Docker 环境已配置
- ✅ 所有程序 ID 已配置
- ✅ 部署脚本就绪

## 下一步

1. 尝试方案 1：寻找更新的 Docker 镜像
2. 或尝试方案 2：手动构建
3. 或等待工具链更新
