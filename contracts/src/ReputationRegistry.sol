// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ReputationRegistry
 * @notice Dev 信誉评分系统 - 链上信誉存储与管理
 * @dev 存储和管理 Dev 的信誉数据，支持红V认证
 * 
 * 功能:
 * 1. Dev 信誉评分存储
 * 2. 发币历史记录
 * 3. 红V认证系统
 * 4. 高危地址标记
 * 5. 跟单订阅管理
 */
contract ReputationRegistry is AccessControl, Pausable {

    // ============================================
    // 角色定义
    // ============================================
    
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // ============================================
    // 类型定义
    // ============================================

    enum Tier { UNRANKED, BRONZE, SILVER, GOLD, PLATINUM, DIAMOND }
    enum VerificationStatus { NONE, PENDING, VERIFIED, REVOKED }
    enum RiskLevel { UNKNOWN, LOW, MEDIUM, HIGH, CRITICAL }

    struct DevProfile {
        address wallet;                 // Dev 钱包地址
        string devAlias;                // 别名
        uint256 score;                  // 信誉分 (0-100)
        Tier tier;                      // 等级
        VerificationStatus verification;// 认证状态
        uint256 verificationStake;      // 认证质押金额
        uint256 totalLaunches;          // 总发币数
        uint256 successfulLaunches;     // 成功发币数
        uint256 rugCount;               // Rug 次数
        uint256 totalVolume;            // 总交易量
        uint256 avgAthMultiplier;       // 平均 ATH 倍数 (basis points)
        uint256 createdAt;              // 创建时间
        uint256 updatedAt;              // 更新时间
        RiskLevel riskLevel;            // 风险等级
    }

    struct LaunchRecord {
        address token;                  // 代币地址
        uint256 chain;                  // 链 ID
        uint256 launchTime;             // 发射时间
        uint256 initialLiquidity;       // 初始流动性
        uint256 athMarketCap;           // ATH 市值
        uint256 currentMarketCap;       // 当前市值
        bool isRugged;                  // 是否 Rug
        bool isGraduated;               // 是否毕业 (上 CEX)
        uint256 holderCount;            // 持有人数
    }

    struct Subscription {
        address subscriber;             // 订阅者
        address dev;                    // 被订阅的 Dev
        uint256 subscribedAt;           // 订阅时间
        bool notifyTelegram;            // Telegram 通知
        bool notifyDiscord;             // Discord 通知
        bool autoBuyEnabled;            // 自动跟单
        uint256 autoBuyAmount;          // 自动跟单金额
    }

    // ============================================
    // 状态变量
    // ============================================

    uint256 public devCounter;
    uint256 public launchCounter;
    uint256 public subscriptionCounter;
    
    uint256 public verificationStakeAmount;     // 认证所需质押金额
    uint256 public minScoreForVerification;     // 申请认证最低分数
    
    // 等级阈值
    uint256 public bronzeThreshold;     // 20
    uint256 public silverThreshold;     // 40
    uint256 public goldThreshold;       // 60
    uint256 public platinumThreshold;   // 80
    uint256 public diamondThreshold;    // 95

    // 映射
    mapping(address => DevProfile) public devProfiles;
    mapping(address => bool) public isRegisteredDev;
    mapping(address => LaunchRecord[]) public devLaunches;
    mapping(address => address[]) public relatedWallets;     // 关联钱包
    mapping(address => bool) public blacklistedAddresses;    // 黑名单
    mapping(address => string) public blacklistReasons;      // 黑名单原因
    
    // 订阅关系
    mapping(uint256 => Subscription) public subscriptions;
    mapping(address => uint256[]) public userSubscriptions;  // 用户的订阅列表
    mapping(address => uint256[]) public devSubscribers;     // Dev 的订阅者列表
    mapping(address => mapping(address => bool)) public isSubscribed;
    
    // Dev 列表 (用于排行榜)
    address[] public devList;

    // ============================================
    // 事件
    // ============================================

    event DevRegistered(address indexed dev, string devAlias);
    event DevScoreUpdated(address indexed dev, uint256 oldScore, uint256 newScore, Tier newTier);
    event LaunchRecorded(address indexed dev, address indexed token, uint256 chainId);
    event LaunchUpdated(address indexed dev, address indexed token, bool isRugged, bool isGraduated);
    
    event VerificationRequested(address indexed dev, uint256 stakeAmount);
    event VerificationApproved(address indexed dev);
    event VerificationRevoked(address indexed dev, string reason);
    
    event AddressBlacklisted(address indexed addr, string reason);
    event AddressWhitelisted(address indexed addr);
    event RelatedWalletAdded(address indexed dev, address indexed wallet);
    
    event Subscribed(address indexed subscriber, address indexed dev, uint256 subscriptionId);
    event Unsubscribed(address indexed subscriber, address indexed dev);
    event SubscriptionUpdated(uint256 indexed subscriptionId);

    // ============================================
    // 构造函数
    // ============================================

    constructor() {
        // 默认配置
        verificationStakeAmount = 10000 * 1e18;  // 10,000 $ALPHA
        minScoreForVerification = 60;
        
        bronzeThreshold = 20;
        silverThreshold = 40;
        goldThreshold = 60;
        platinumThreshold = 80;
        diamondThreshold = 95;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    // ============================================
    // Dev 管理功能
    // ============================================

    /**
     * @notice 注册新 Dev
     * @param dev Dev 钱包地址
     * @param devAlias_ Dev 别名
     */
    function registerDev(address dev, string calldata devAlias_) external onlyRole(OPERATOR_ROLE) {
        require(!isRegisteredDev[dev], "Dev already registered");
        require(dev != address(0), "Invalid address");
        
        devProfiles[dev] = DevProfile({
            wallet: dev,
            devAlias: devAlias_,
            score: 50,  // 初始分数 50
            tier: Tier.BRONZE,
            verification: VerificationStatus.NONE,
            verificationStake: 0,
            totalLaunches: 0,
            successfulLaunches: 0,
            rugCount: 0,
            totalVolume: 0,
            avgAthMultiplier: 0,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            riskLevel: RiskLevel.UNKNOWN
        });
        
        isRegisteredDev[dev] = true;
        devList.push(dev);
        devCounter++;
        
        emit DevRegistered(dev, devAlias_);
    }

    /**
     * @notice 更新 Dev 分数
     * @param dev Dev 地址
     * @param newScore 新分数 (0-100)
     */
    function updateScore(address dev, uint256 newScore) external onlyRole(OPERATOR_ROLE) {
        require(isRegisteredDev[dev], "Dev not registered");
        require(newScore <= 100, "Score must be <= 100");
        
        DevProfile storage profile = devProfiles[dev];
        uint256 oldScore = profile.score;
        
        profile.score = newScore;
        profile.tier = _calculateTier(newScore);
        profile.updatedAt = block.timestamp;
        
        emit DevScoreUpdated(dev, oldScore, newScore, profile.tier);
    }

    /**
     * @notice 批量更新 Dev 分数
     */
    function batchUpdateScores(
        address[] calldata devs,
        uint256[] calldata scores
    ) external onlyRole(OPERATOR_ROLE) {
        require(devs.length == scores.length, "Length mismatch");
        
        for (uint256 i = 0; i < devs.length; i++) {
            if (isRegisteredDev[devs[i]] && scores[i] <= 100) {
                DevProfile storage profile = devProfiles[devs[i]];
                uint256 oldScore = profile.score;
                
                profile.score = scores[i];
                profile.tier = _calculateTier(scores[i]);
                profile.updatedAt = block.timestamp;
                
                emit DevScoreUpdated(devs[i], oldScore, scores[i], profile.tier);
            }
        }
    }

    /**
     * @notice 记录发币
     */
    function recordLaunch(
        address dev,
        address token,
        uint256 chainId,
        uint256 initialLiquidity
    ) external onlyRole(OPERATOR_ROLE) {
        require(isRegisteredDev[dev], "Dev not registered");
        
        devLaunches[dev].push(LaunchRecord({
            token: token,
            chain: chainId,
            launchTime: block.timestamp,
            initialLiquidity: initialLiquidity,
            athMarketCap: 0,
            currentMarketCap: 0,
            isRugged: false,
            isGraduated: false,
            holderCount: 0
        }));
        
        devProfiles[dev].totalLaunches++;
        devProfiles[dev].updatedAt = block.timestamp;
        launchCounter++;
        
        emit LaunchRecorded(dev, token, chainId);
    }

    /**
     * @notice 更新发币状态
     */
    function updateLaunchStatus(
        address dev,
        uint256 launchIndex,
        uint256 athMarketCap,
        uint256 currentMarketCap,
        uint256 holderCount,
        bool isRugged,
        bool isGraduated
    ) external onlyRole(OPERATOR_ROLE) {
        require(launchIndex < devLaunches[dev].length, "Invalid index");
        
        LaunchRecord storage launch = devLaunches[dev][launchIndex];
        launch.athMarketCap = athMarketCap;
        launch.currentMarketCap = currentMarketCap;
        launch.holderCount = holderCount;
        
        if (isRugged && !launch.isRugged) {
            launch.isRugged = true;
            devProfiles[dev].rugCount++;
        }
        
        if (isGraduated && !launch.isGraduated) {
            launch.isGraduated = true;
            devProfiles[dev].successfulLaunches++;
        }
        
        devProfiles[dev].updatedAt = block.timestamp;
        
        emit LaunchUpdated(dev, launch.token, isRugged, isGraduated);
    }

    // ============================================
    // 认证功能
    // ============================================

    /**
     * @notice 申请红V认证 (需要外部转入质押金)
     */
    function requestVerification(address dev) external onlyRole(OPERATOR_ROLE) {
        require(isRegisteredDev[dev], "Dev not registered");
        
        DevProfile storage profile = devProfiles[dev];
        require(profile.verification == VerificationStatus.NONE, "Already requested/verified");
        require(profile.score >= minScoreForVerification, "Score too low");
        
        profile.verification = VerificationStatus.PENDING;
        profile.verificationStake = verificationStakeAmount;
        profile.updatedAt = block.timestamp;
        
        emit VerificationRequested(dev, verificationStakeAmount);
    }

    /**
     * @notice 批准认证
     */
    function approveVerification(address dev) external onlyRole(VERIFIER_ROLE) {
        require(isRegisteredDev[dev], "Dev not registered");
        
        DevProfile storage profile = devProfiles[dev];
        require(profile.verification == VerificationStatus.PENDING, "Not pending");
        
        profile.verification = VerificationStatus.VERIFIED;
        profile.updatedAt = block.timestamp;
        
        emit VerificationApproved(dev);
    }

    /**
     * @notice 撤销认证
     */
    function revokeVerification(address dev, string calldata reason) external onlyRole(VERIFIER_ROLE) {
        require(isRegisteredDev[dev], "Dev not registered");
        
        DevProfile storage profile = devProfiles[dev];
        require(profile.verification == VerificationStatus.VERIFIED, "Not verified");
        
        profile.verification = VerificationStatus.REVOKED;
        profile.updatedAt = block.timestamp;
        
        emit VerificationRevoked(dev, reason);
    }

    // ============================================
    // 风险管理
    // ============================================

    /**
     * @notice 设置风险等级
     */
    function setRiskLevel(address dev, RiskLevel level) external onlyRole(OPERATOR_ROLE) {
        require(isRegisteredDev[dev], "Dev not registered");
        devProfiles[dev].riskLevel = level;
        devProfiles[dev].updatedAt = block.timestamp;
    }

    /**
     * @notice 添加黑名单
     */
    function blacklistAddress(address addr, string calldata reason) external onlyRole(OPERATOR_ROLE) {
        blacklistedAddresses[addr] = true;
        blacklistReasons[addr] = reason;
        emit AddressBlacklisted(addr, reason);
    }

    /**
     * @notice 移除黑名单
     */
    function whitelistAddress(address addr) external onlyRole(OPERATOR_ROLE) {
        blacklistedAddresses[addr] = false;
        blacklistReasons[addr] = "";
        emit AddressWhitelisted(addr);
    }

    /**
     * @notice 添加关联钱包
     */
    function addRelatedWallet(address dev, address wallet) external onlyRole(OPERATOR_ROLE) {
        require(isRegisteredDev[dev], "Dev not registered");
        relatedWallets[dev].push(wallet);
        emit RelatedWalletAdded(dev, wallet);
    }

    // ============================================
    // 订阅功能
    // ============================================

    /**
     * @notice 订阅 Dev
     */
    function subscribe(
        address subscriber,
        address dev,
        bool notifyTelegram,
        bool notifyDiscord,
        bool autoBuyEnabled,
        uint256 autoBuyAmount
    ) external onlyRole(OPERATOR_ROLE) returns (uint256 subscriptionId) {
        require(isRegisteredDev[dev], "Dev not registered");
        require(!isSubscribed[subscriber][dev], "Already subscribed");
        
        subscriptionId = subscriptionCounter++;
        
        subscriptions[subscriptionId] = Subscription({
            subscriber: subscriber,
            dev: dev,
            subscribedAt: block.timestamp,
            notifyTelegram: notifyTelegram,
            notifyDiscord: notifyDiscord,
            autoBuyEnabled: autoBuyEnabled,
            autoBuyAmount: autoBuyAmount
        });
        
        userSubscriptions[subscriber].push(subscriptionId);
        devSubscribers[dev].push(subscriptionId);
        isSubscribed[subscriber][dev] = true;
        
        emit Subscribed(subscriber, dev, subscriptionId);
    }

    /**
     * @notice 取消订阅
     */
    function unsubscribe(address subscriber, address dev) external onlyRole(OPERATOR_ROLE) {
        require(isSubscribed[subscriber][dev], "Not subscribed");
        
        isSubscribed[subscriber][dev] = false;
        
        emit Unsubscribed(subscriber, dev);
    }

    /**
     * @notice 更新订阅设置
     */
    function updateSubscription(
        uint256 subscriptionId,
        bool notifyTelegram,
        bool notifyDiscord,
        bool autoBuyEnabled,
        uint256 autoBuyAmount
    ) external onlyRole(OPERATOR_ROLE) {
        Subscription storage sub = subscriptions[subscriptionId];
        require(sub.subscriber != address(0), "Invalid subscription");
        
        sub.notifyTelegram = notifyTelegram;
        sub.notifyDiscord = notifyDiscord;
        sub.autoBuyEnabled = autoBuyEnabled;
        sub.autoBuyAmount = autoBuyAmount;
        
        emit SubscriptionUpdated(subscriptionId);
    }

    // ============================================
    // 管理功能
    // ============================================

    function setVerificationStakeAmount(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        verificationStakeAmount = amount;
    }

    function setMinScoreForVerification(uint256 score) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(score <= 100, "Invalid score");
        minScoreForVerification = score;
    }

    function setTierThresholds(
        uint256 _bronze,
        uint256 _silver,
        uint256 _gold,
        uint256 _platinum,
        uint256 _diamond
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_bronze < _silver && _silver < _gold && _gold < _platinum && _platinum < _diamond, "Invalid thresholds");
        bronzeThreshold = _bronze;
        silverThreshold = _silver;
        goldThreshold = _gold;
        platinumThreshold = _platinum;
        diamondThreshold = _diamond;
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
     * @notice 获取 Dev 完整信息
     */
    function getDevProfile(address dev) external view returns (DevProfile memory) {
        return devProfiles[dev];
    }

    /**
     * @notice 获取 Dev 发币历史
     */
    function getDevLaunches(address dev) external view returns (LaunchRecord[] memory) {
        return devLaunches[dev];
    }

    /**
     * @notice 获取 Dev 关联钱包
     */
    function getRelatedWallets(address dev) external view returns (address[] memory) {
        return relatedWallets[dev];
    }

    /**
     * @notice 获取用户订阅列表
     */
    function getUserSubscriptions(address user) external view returns (uint256[] memory) {
        return userSubscriptions[user];
    }

    /**
     * @notice 获取 Dev 订阅者列表
     */
    function getDevSubscribers(address dev) external view returns (uint256[] memory) {
        return devSubscribers[dev];
    }

    /**
     * @notice 获取 Dev 胜率
     */
    function getWinRate(address dev) external view returns (uint256) {
        DevProfile storage profile = devProfiles[dev];
        if (profile.totalLaunches == 0) return 0;
        return (profile.successfulLaunches * 10000) / profile.totalLaunches;
    }

    /**
     * @notice 获取 Dev 列表 (分页)
     */
    function getDevList(uint256 offset, uint256 limit) external view returns (address[] memory) {
        uint256 total = devList.length;
        if (offset >= total) {
            return new address[](0);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = devList[i];
        }
        
        return result;
    }

    /**
     * @notice 获取总 Dev 数量
     */
    function getTotalDevCount() external view returns (uint256) {
        return devList.length;
    }

    // ============================================
    // 内部函数
    // ============================================

    function _calculateTier(uint256 score) internal view returns (Tier) {
        if (score >= diamondThreshold) return Tier.DIAMOND;
        if (score >= platinumThreshold) return Tier.PLATINUM;
        if (score >= goldThreshold) return Tier.GOLD;
        if (score >= silverThreshold) return Tier.SILVER;
        if (score >= bronzeThreshold) return Tier.BRONZE;
        return Tier.UNRANKED;
    }
}
