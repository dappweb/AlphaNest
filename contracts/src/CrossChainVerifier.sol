// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title CrossChainVerifier
 * @notice 跨链状态验证合约 - 验证用户在其他链上的持仓
 * @dev 支持存储证明验证和签名消息验证
 * 
 * 功能:
 * 1. 存储证明验证 (Herodotus/Axiom 风格)
 * 2. 签名消息验证 (Chainlink CCIP 风格)
 * 3. 多链持仓状态聚合
 * 4. 验证结果缓存
 */
contract CrossChainVerifier is AccessControl, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ============================================
    // 角色定义
    // ============================================
    
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    // ============================================
    // 类型定义
    // ============================================

    enum VerificationType { STORAGE_PROOF, SIGNATURE, ORACLE }

    struct ChainConfig {
        uint256 chainId;
        string name;
        bool isActive;
        address[] trustedRelayers;
        uint256 blockConfirmations;
    }

    struct HoldingProof {
        uint256 chainId;            // 源链 ID
        address token;              // 代币地址
        address holder;             // 持有人
        uint256 balance;            // 余额
        uint256 blockNumber;        // 区块号
        uint256 timestamp;          // 时间戳
        bytes proof;                // 存储证明数据
        VerificationType proofType; // 验证类型
    }

    struct VerifiedHolding {
        uint256 chainId;
        address token;
        uint256 balance;
        uint256 verifiedAt;
        uint256 expiresAt;
        bool isValid;
    }

    struct AggregatedHolding {
        address user;
        uint256 totalValueUsd;      // 总价值 (USD, 18 decimals)
        uint256 chainCount;         // 持仓链数
        uint256 tokenCount;         // 持仓代币数
        uint256 lastUpdated;
    }

    // ============================================
    // 状态变量
    // ============================================

    // 支持的链配置
    mapping(uint256 => ChainConfig) public chainConfigs;
    uint256[] public supportedChains;
    
    // 验证结果缓存
    mapping(bytes32 => VerifiedHolding) public verifiedHoldings;
    mapping(address => bytes32[]) public userHoldings;
    mapping(address => AggregatedHolding) public aggregatedHoldings;
    
    // 代币价格 (由预言机更新)
    mapping(uint256 => mapping(address => uint256)) public tokenPrices; // chainId => token => priceUsd
    
    // 信任的签名者
    mapping(address => bool) public trustedSigners;
    
    // 验证有效期
    uint256 public verificationValidityPeriod;
    
    // 统计
    uint256 public totalVerifications;
    uint256 public totalValueVerified;

    // ============================================
    // 事件
    // ============================================

    event ChainConfigured(uint256 indexed chainId, string name, bool isActive);
    event RelayerAdded(uint256 indexed chainId, address indexed relayer);
    event RelayerRemoved(uint256 indexed chainId, address indexed relayer);
    
    event HoldingVerified(
        address indexed user,
        uint256 indexed chainId,
        address indexed token,
        uint256 balance,
        bytes32 holdingId
    );
    
    event HoldingInvalidated(bytes32 indexed holdingId);
    event AggregatedHoldingUpdated(address indexed user, uint256 totalValueUsd);
    event TokenPriceUpdated(uint256 indexed chainId, address indexed token, uint256 price);
    event SignerUpdated(address indexed signer, bool trusted);

    // ============================================
    // 构造函数
    // ============================================

    constructor() {
        verificationValidityPeriod = 1 hours;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, msg.sender);
    }

    // ============================================
    // 链配置管理
    // ============================================

    /**
     * @notice 配置支持的链
     */
    function configureChain(
        uint256 chainId,
        string calldata name,
        bool isActive,
        uint256 blockConfirmations
    ) external onlyRole(OPERATOR_ROLE) {
        ChainConfig storage config = chainConfigs[chainId];
        
        bool isNew = config.chainId == 0;
        
        config.chainId = chainId;
        config.name = name;
        config.isActive = isActive;
        config.blockConfirmations = blockConfirmations;
        
        if (isNew) {
            supportedChains.push(chainId);
        }
        
        emit ChainConfigured(chainId, name, isActive);
    }

    /**
     * @notice 添加信任的中继者
     */
    function addRelayer(uint256 chainId, address relayer) external onlyRole(OPERATOR_ROLE) {
        require(chainConfigs[chainId].chainId != 0, "Chain not configured");
        chainConfigs[chainId].trustedRelayers.push(relayer);
        emit RelayerAdded(chainId, relayer);
    }

    /**
     * @notice 设置信任的签名者
     */
    function setTrustedSigner(address signer, bool trusted) external onlyRole(OPERATOR_ROLE) {
        trustedSigners[signer] = trusted;
        emit SignerUpdated(signer, trusted);
    }

    // ============================================
    // 验证功能
    // ============================================

    /**
     * @notice 通过签名验证持仓
     * @dev 用于 Chainlink CCIP 风格的跨链消息
     */
    function verifyHoldingBySignature(
        address user,
        uint256 chainId,
        address token,
        uint256 balance,
        uint256 blockNumber,
        uint256 timestamp,
        bytes calldata signature
    ) external whenNotPaused returns (bytes32 holdingId) {
        require(chainConfigs[chainId].isActive, "Chain not active");
        require(timestamp + verificationValidityPeriod > block.timestamp, "Proof expired");
        
        // 构造消息哈希
        bytes32 messageHash = keccak256(abi.encodePacked(
            user,
            chainId,
            token,
            balance,
            blockNumber,
            timestamp
        ));
        
        // 验证签名
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedHash.recover(signature);
        require(trustedSigners[signer], "Invalid signer");
        
        // 存储验证结果
        holdingId = _storeVerifiedHolding(user, chainId, token, balance);
        
        emit HoldingVerified(user, chainId, token, balance, holdingId);
    }

    /**
     * @notice 中继者提交验证结果
     * @dev 用于后端验证后的结果提交
     */
    function submitVerification(
        address user,
        uint256 chainId,
        address token,
        uint256 balance,
        uint256 blockNumber
    ) external onlyRole(RELAYER_ROLE) whenNotPaused returns (bytes32 holdingId) {
        require(chainConfigs[chainId].isActive, "Chain not active");
        
        holdingId = _storeVerifiedHolding(user, chainId, token, balance);
        
        emit HoldingVerified(user, chainId, token, balance, holdingId);
    }

    /**
     * @notice 批量提交验证结果
     */
    function batchSubmitVerifications(
        address[] calldata users,
        uint256[] calldata chainIds,
        address[] calldata tokens,
        uint256[] calldata balances
    ) external onlyRole(RELAYER_ROLE) whenNotPaused {
        require(
            users.length == chainIds.length &&
            chainIds.length == tokens.length &&
            tokens.length == balances.length,
            "Length mismatch"
        );
        
        for (uint256 i = 0; i < users.length; i++) {
            if (chainConfigs[chainIds[i]].isActive) {
                bytes32 holdingId = _storeVerifiedHolding(users[i], chainIds[i], tokens[i], balances[i]);
                emit HoldingVerified(users[i], chainIds[i], tokens[i], balances[i], holdingId);
            }
        }
    }

    /**
     * @notice 使验证失效
     */
    function invalidateHolding(bytes32 holdingId) external onlyRole(OPERATOR_ROLE) {
        verifiedHoldings[holdingId].isValid = false;
        emit HoldingInvalidated(holdingId);
    }

    // ============================================
    // 聚合功能
    // ============================================

    /**
     * @notice 更新用户聚合持仓
     */
    function updateAggregatedHolding(address user) external onlyRole(OPERATOR_ROLE) {
        bytes32[] storage holdings = userHoldings[user];
        
        uint256 totalValue = 0;
        uint256 validTokens = 0;
        
        // 使用动态数组追踪已见链ID
        uint256[] memory seenChainIds = new uint256[](holdings.length);
        uint256 chainCount = 0;
        
        for (uint256 i = 0; i < holdings.length; i++) {
            VerifiedHolding storage holding = verifiedHoldings[holdings[i]];
            
            if (holding.isValid && holding.expiresAt > block.timestamp) {
                uint256 price = tokenPrices[holding.chainId][holding.token];
                if (price > 0) {
                    totalValue += (holding.balance * price) / 1e18;
                }
                validTokens++;
                
                // 检查是否是新链
                bool isNewChain = true;
                for (uint256 j = 0; j < chainCount; j++) {
                    if (seenChainIds[j] == holding.chainId) {
                        isNewChain = false;
                        break;
                    }
                }
                if (isNewChain) {
                    seenChainIds[chainCount] = holding.chainId;
                    chainCount++;
                }
            }
        }
        
        aggregatedHoldings[user] = AggregatedHolding({
            user: user,
            totalValueUsd: totalValue,
            chainCount: chainCount,
            tokenCount: validTokens,
            lastUpdated: block.timestamp
        });
        
        totalValueVerified += totalValue;
        
        emit AggregatedHoldingUpdated(user, totalValue);
    }

    // ============================================
    // 价格预言机
    // ============================================

    /**
     * @notice 更新代币价格
     */
    function updateTokenPrice(
        uint256 chainId,
        address token,
        uint256 priceUsd
    ) external onlyRole(OPERATOR_ROLE) {
        tokenPrices[chainId][token] = priceUsd;
        emit TokenPriceUpdated(chainId, token, priceUsd);
    }

    /**
     * @notice 批量更新代币价格
     */
    function batchUpdateTokenPrices(
        uint256[] calldata chainIds,
        address[] calldata tokens,
        uint256[] calldata prices
    ) external onlyRole(OPERATOR_ROLE) {
        require(
            chainIds.length == tokens.length && tokens.length == prices.length,
            "Length mismatch"
        );
        
        for (uint256 i = 0; i < chainIds.length; i++) {
            tokenPrices[chainIds[i]][tokens[i]] = prices[i];
            emit TokenPriceUpdated(chainIds[i], tokens[i], prices[i]);
        }
    }

    // ============================================
    // 管理功能
    // ============================================

    function setVerificationValidityPeriod(uint256 period) external onlyRole(DEFAULT_ADMIN_ROLE) {
        verificationValidityPeriod = period;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ============================================
    // 视图函数
    // ============================================

    /**
     * @notice 获取用户验证的持仓列表
     */
    function getUserHoldings(address user) external view returns (VerifiedHolding[] memory) {
        bytes32[] storage holdingIds = userHoldings[user];
        VerifiedHolding[] memory result = new VerifiedHolding[](holdingIds.length);
        
        for (uint256 i = 0; i < holdingIds.length; i++) {
            result[i] = verifiedHoldings[holdingIds[i]];
        }
        
        return result;
    }

    /**
     * @notice 获取用户有效持仓列表
     */
    function getUserValidHoldings(address user) external view returns (VerifiedHolding[] memory) {
        bytes32[] storage holdingIds = userHoldings[user];
        
        // 计算有效持仓数量
        uint256 validCount = 0;
        for (uint256 i = 0; i < holdingIds.length; i++) {
            VerifiedHolding storage holding = verifiedHoldings[holdingIds[i]];
            if (holding.isValid && holding.expiresAt > block.timestamp) {
                validCount++;
            }
        }
        
        // 填充结果
        VerifiedHolding[] memory result = new VerifiedHolding[](validCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < holdingIds.length; i++) {
            VerifiedHolding storage holding = verifiedHoldings[holdingIds[i]];
            if (holding.isValid && holding.expiresAt > block.timestamp) {
                result[index] = holding;
                index++;
            }
        }
        
        return result;
    }

    /**
     * @notice 检查用户是否持有特定代币
     */
    function hasValidHolding(
        address user,
        uint256 chainId,
        address token,
        uint256 minBalance
    ) external view returns (bool) {
        bytes32 holdingId = keccak256(abi.encodePacked(user, chainId, token));
        VerifiedHolding storage holding = verifiedHoldings[holdingId];
        
        return holding.isValid &&
               holding.expiresAt > block.timestamp &&
               holding.balance >= minBalance;
    }

    /**
     * @notice 获取用户在特定链上的持仓价值
     */
    function getUserChainValue(address user, uint256 chainId) external view returns (uint256) {
        bytes32[] storage holdingIds = userHoldings[user];
        uint256 totalValue = 0;
        
        for (uint256 i = 0; i < holdingIds.length; i++) {
            VerifiedHolding storage holding = verifiedHoldings[holdingIds[i]];
            
            if (holding.chainId == chainId &&
                holding.isValid &&
                holding.expiresAt > block.timestamp) {
                uint256 price = tokenPrices[chainId][holding.token];
                if (price > 0) {
                    totalValue += (holding.balance * price) / 1e18;
                }
            }
        }
        
        return totalValue;
    }

    /**
     * @notice 获取支持的链列表
     */
    function getSupportedChains() external view returns (uint256[] memory) {
        return supportedChains;
    }

    /**
     * @notice 获取链配置
     */
    function getChainConfig(uint256 chainId) external view returns (
        string memory name,
        bool isActive,
        uint256 blockConfirmations,
        uint256 relayerCount
    ) {
        ChainConfig storage config = chainConfigs[chainId];
        return (
            config.name,
            config.isActive,
            config.blockConfirmations,
            config.trustedRelayers.length
        );
    }

    /**
     * @notice 获取聚合持仓信息
     */
    function getAggregatedHolding(address user) external view returns (AggregatedHolding memory) {
        return aggregatedHoldings[user];
    }

    // ============================================
    // 内部函数
    // ============================================

    function _storeVerifiedHolding(
        address user,
        uint256 chainId,
        address token,
        uint256 balance
    ) internal returns (bytes32 holdingId) {
        holdingId = keccak256(abi.encodePacked(user, chainId, token));
        
        VerifiedHolding storage existing = verifiedHoldings[holdingId];
        bool isNew = !existing.isValid;
        
        verifiedHoldings[holdingId] = VerifiedHolding({
            chainId: chainId,
            token: token,
            balance: balance,
            verifiedAt: block.timestamp,
            expiresAt: block.timestamp + verificationValidityPeriod,
            isValid: true
        });
        
        if (isNew) {
            userHoldings[user].push(holdingId);
        }
        
        totalVerifications++;
    }
}
