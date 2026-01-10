// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title MemeToken
 * @notice 标准化 Meme 代币模板
 */
contract MemeToken is ERC20, ERC20Burnable {
    address public immutable creator;
    address public immutable factory;
    uint256 public immutable createdAt;
    
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        address creator_
    ) ERC20(name_, symbol_) {
        creator = creator_;
        factory = msg.sender;
        createdAt = block.timestamp;
        _mint(creator_, totalSupply_);
    }
}

/**
 * @title TokenFactory
 * @notice Meme 代币发行工厂 - 标准化代币创建
 * @dev 提供统一的代币发行接口和追踪
 * 
 * 功能:
 * 1. 标准化代币创建
 * 2. 发行费用收取
 * 3. 代币追踪和索引
 * 4. Dev 关联记录
 */
contract TokenFactory is AccessControl, ReentrancyGuard, Pausable {

    // ============================================
    // 角色定义
    // ============================================
    
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // ============================================
    // 类型定义
    // ============================================

    struct TokenInfo {
        address tokenAddress;       // 代币合约地址
        string name;                // 名称
        string symbol;              // 符号
        uint256 totalSupply;        // 总供应量
        address creator;            // 创建者
        uint256 createdAt;          // 创建时间
        uint256 launchFee;          // 发行费用
        bool isVerified;            // 是否已验证
    }

    struct LaunchConfig {
        uint256 minSupply;          // 最小供应量
        uint256 maxSupply;          // 最大供应量
        uint256 baseFee;            // 基础发行费
        uint256 verifiedDevDiscount;// 认证 Dev 折扣 (basis points)
        bool requireVerification;   // 是否需要 Dev 认证
    }

    // ============================================
    // 状态变量
    // ============================================

    LaunchConfig public launchConfig;
    
    address public feeRecipient;
    address public reputationRegistry;
    
    uint256 public tokenCounter;
    uint256 public totalFeesCollected;
    
    // 代币映射
    mapping(address => TokenInfo) public tokens;
    mapping(address => address[]) public creatorTokens;
    mapping(string => bool) public symbolExists;
    
    address[] public allTokens;

    // ============================================
    // 事件
    // ============================================

    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 totalSupply,
        uint256 fee
    );
    
    event TokenVerified(address indexed tokenAddress);
    event ConfigUpdated(string param);
    event FeeRecipientUpdated(address indexed newRecipient);

    // ============================================
    // 构造函数
    // ============================================

    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        
        feeRecipient = _feeRecipient;
        
        // 默认配置
        launchConfig = LaunchConfig({
            minSupply: 1_000_000 * 1e18,        // 最小 100万
            maxSupply: 1_000_000_000_000 * 1e18, // 最大 1万亿
            baseFee: 0.01 ether,                 // 基础费用 0.01 ETH
            verifiedDevDiscount: 5000,           // 认证 Dev 50% 折扣
            requireVerification: false           // 默认不要求认证
        });
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    // ============================================
    // 代币创建
    // ============================================

    /**
     * @notice 创建新 Meme 代币
     * @param name_ 代币名称
     * @param symbol_ 代币符号
     * @param totalSupply_ 总供应量
     */
    function createToken(
        string calldata name_,
        string calldata symbol_,
        uint256 totalSupply_
    ) external payable nonReentrant whenNotPaused returns (address tokenAddress) {
        require(bytes(name_).length > 0 && bytes(name_).length <= 32, "Invalid name");
        require(bytes(symbol_).length > 0 && bytes(symbol_).length <= 10, "Invalid symbol");
        require(!symbolExists[symbol_], "Symbol exists");
        require(
            totalSupply_ >= launchConfig.minSupply && 
            totalSupply_ <= launchConfig.maxSupply,
            "Invalid supply"
        );
        
        // 计算费用
        uint256 fee = _calculateFee(msg.sender);
        require(msg.value >= fee, "Insufficient fee");
        
        // 创建代币
        MemeToken token = new MemeToken(name_, symbol_, totalSupply_, msg.sender);
        tokenAddress = address(token);
        
        // 存储信息
        tokens[tokenAddress] = TokenInfo({
            tokenAddress: tokenAddress,
            name: name_,
            symbol: symbol_,
            totalSupply: totalSupply_,
            creator: msg.sender,
            createdAt: block.timestamp,
            launchFee: fee,
            isVerified: false
        });
        
        creatorTokens[msg.sender].push(tokenAddress);
        allTokens.push(tokenAddress);
        symbolExists[symbol_] = true;
        tokenCounter++;
        totalFeesCollected += fee;
        
        // 转移费用
        if (fee > 0) {
            (bool success, ) = feeRecipient.call{value: fee}("");
            require(success, "Fee transfer failed");
        }
        
        // 退还多余 ETH
        if (msg.value > fee) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - fee}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit TokenCreated(tokenAddress, msg.sender, name_, symbol_, totalSupply_, fee);
    }

    /**
     * @notice 免费创建代币（仅限 Operator）
     * @dev 用于平台官方矩阵代币发行
     */
    function createTokenFree(
        string calldata name_,
        string calldata symbol_,
        uint256 totalSupply_,
        address creator_
    ) external onlyRole(OPERATOR_ROLE) returns (address tokenAddress) {
        require(bytes(name_).length > 0 && bytes(name_).length <= 32, "Invalid name");
        require(bytes(symbol_).length > 0 && bytes(symbol_).length <= 10, "Invalid symbol");
        require(!symbolExists[symbol_], "Symbol exists");
        require(creator_ != address(0), "Invalid creator");
        
        // 创建代币
        MemeToken token = new MemeToken(name_, symbol_, totalSupply_, creator_);
        tokenAddress = address(token);
        
        // 存储信息
        tokens[tokenAddress] = TokenInfo({
            tokenAddress: tokenAddress,
            name: name_,
            symbol: symbol_,
            totalSupply: totalSupply_,
            creator: creator_,
            createdAt: block.timestamp,
            launchFee: 0,
            isVerified: true  // 官方代币自动验证
        });
        
        creatorTokens[creator_].push(tokenAddress);
        allTokens.push(tokenAddress);
        symbolExists[symbol_] = true;
        tokenCounter++;
        
        emit TokenCreated(tokenAddress, creator_, name_, symbol_, totalSupply_, 0);
        emit TokenVerified(tokenAddress);
    }

    // ============================================
    // 管理功能
    // ============================================

    /**
     * @notice 验证代币
     */
    function verifyToken(address tokenAddress) external onlyRole(OPERATOR_ROLE) {
        require(tokens[tokenAddress].tokenAddress != address(0), "Token not found");
        tokens[tokenAddress].isVerified = true;
        emit TokenVerified(tokenAddress);
    }

    /**
     * @notice 设置发行配置
     */
    function setLaunchConfig(
        uint256 minSupply,
        uint256 maxSupply,
        uint256 baseFee,
        uint256 verifiedDevDiscount,
        bool requireVerification
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(minSupply < maxSupply, "Invalid supply range");
        require(verifiedDevDiscount <= 10000, "Invalid discount");
        
        launchConfig = LaunchConfig({
            minSupply: minSupply,
            maxSupply: maxSupply,
            baseFee: baseFee,
            verifiedDevDiscount: verifiedDevDiscount,
            requireVerification: requireVerification
        });
        
        emit ConfigUpdated("launchConfig");
    }

    /**
     * @notice 设置费用接收地址
     */
    function setFeeRecipient(address _feeRecipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeRecipient != address(0), "Invalid address");
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(_feeRecipient);
    }

    /**
     * @notice 设置信誉注册表地址
     */
    function setReputationRegistry(address _registry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        reputationRegistry = _registry;
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
     * @notice 获取代币信息
     */
    function getTokenInfo(address tokenAddress) external view returns (TokenInfo memory) {
        return tokens[tokenAddress];
    }

    /**
     * @notice 获取创建者的代币列表
     */
    function getCreatorTokens(address creator) external view returns (address[] memory) {
        return creatorTokens[creator];
    }

    /**
     * @notice 获取所有代币列表（分页）
     */
    function getAllTokens(uint256 offset, uint256 limit) external view returns (address[] memory) {
        uint256 total = allTokens.length;
        if (offset >= total) {
            return new address[](0);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = allTokens[i];
        }
        
        return result;
    }

    /**
     * @notice 获取总代币数量
     */
    function getTotalTokenCount() external view returns (uint256) {
        return allTokens.length;
    }

    /**
     * @notice 计算发行费用
     */
    function calculateFee(address creator) external view returns (uint256) {
        return _calculateFee(creator);
    }

    /**
     * @notice 检查符号是否可用
     */
    function isSymbolAvailable(string calldata symbol_) external view returns (bool) {
        return !symbolExists[symbol_];
    }

    // ============================================
    // 内部函数
    // ============================================

    function _calculateFee(address creator) internal view returns (uint256) {
        uint256 fee = launchConfig.baseFee;
        
        // TODO: 查询 ReputationRegistry 检查是否为认证 Dev
        // 如果是认证 Dev，应用折扣
        // if (reputationRegistry != address(0)) {
        //     bool isVerified = IReputationRegistry(reputationRegistry).isVerifiedDev(creator);
        //     if (isVerified) {
        //         fee = fee * (10000 - launchConfig.verifiedDevDiscount) / 10000;
        //     }
        // }
        
        return fee;
    }
}
