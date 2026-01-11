# 智能合约部署指南

## 1. 获取 Sepolia 测试网 ETH

访问以下水龙头获取测试 ETH：
- https://sepoliafaucet.com
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucets.chain.link/sepolia

## 2. 获取 RPC URL

注册 Alchemy 或 Infura 获取免费 RPC：
- Alchemy: https://dashboard.alchemy.com
- Infura: https://infura.io

## 3. 配置环境变量

在终端中运行：

```bash
# 设置私钥 (不带 0x 前缀)
export PRIVATE_KEY="你的私钥"

# 设置 Sepolia RPC URL
export SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/你的API_KEY"

# (可选) Etherscan API Key 用于验证合约
export ETHERSCAN_API_KEY="你的Etherscan_API_Key"
```

## 4. 部署到 Sepolia

```bash
cd contracts

# 部署所有合约
forge script script/Deploy.s.sol:DeployAllSepolia \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  -vvvv

# 验证合约 (可选)
forge verify-contract <合约地址> src/AlphaToken.sol:AlphaToken \
  --chain sepolia \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## 5. 保存部署地址

部署成功后，将输出的合约地址保存到前端配置：

```bash
# 更新前端环境变量
# apps/web/.env.local

NEXT_PUBLIC_ALPHAGUARD_ADDRESS=<AlphaGuard地址>
NEXT_PUBLIC_ALPHANEST_CORE_ADDRESS=<AlphaNestCore地址>
NEXT_PUBLIC_USDC_ADDRESS=<MockUSDC地址>
```

## 快速部署命令

一键部署 (需要先设置环境变量)：

```bash
cd /home/zyj_dev/AlphaNest/contracts && \
forge script script/Deploy.s.sol:DeployAllSepolia \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  -vvvv
```

## 部署到 Base 主网

⚠️ 主网部署需要真实 ETH，请谨慎操作！

```bash
export BASE_RPC_URL="https://mainnet.base.org"

forge script script/Deploy.s.sol:DeployAllBase \
  --rpc-url $BASE_RPC_URL \
  --broadcast \
  -vvvv
```
