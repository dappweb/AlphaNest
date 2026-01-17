// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AlphaNestCore
 * @notice AlphaNest 平台核心合约 - 多资产质押系统
 * @dev 支持多种资产质押、多种锁定期、早鸟奖励
 * 
 * 功能对齐 Solana 合约:
 * 1. 多资产质押 - 支持 ETH/USDC/USDT/ALPHA
 * 2. 锁定期选择 - 灵活/30天/90天/180天/365天
 * 3. 奖励倍数 - 根据锁定期 1x-5x
 * 4. 早鸟奖励 - 前30天额外奖励
 * 5. 积分系统 - 用户活动积分
 */
contract AlphaNestCore is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============================================
    // 角色定义
    // ============================================
    
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant POINTS_MANAGER_ROLE = keccak256("POINTS_MANAGER_ROLE");

    // ============================================
    // 枚举类型
    // ============================================

    enum LockPeriod {
        Flexible,           // 灵活质押 - 1x 奖励
        ThirtyDays,         // 30天锁定 - 1.5x 奖励
        NinetyDays,         // 90天锁定 - 2x 奖励
        OneEightyDays,      // 180天锁定 - 3x 奖励
        ThreeSixtyFiveDays  // 365天锁定 - 5x 奖励
    }

    enum AssetType {
        ETH,
        USDC,
        USDT,
        ALPHA
    }

    // ============================================
    // 结构体
    // ============================================

    struct StakeInfo {
        uint256 amount;             // 质押数量
        uint256 valueUSD;           // USD 价值
        AssetType assetType;        // 资产类型
        LockPeriod lockPeriod;      // 锁定期
        uint256 startTime;          // 质押开始时间
        uint256 unlockTime;         // 解锁时间
        uint256 rewardMultiplier;   // 奖励倍数 (100 = 1x)
        uint256 earlyBirdBonus;     // 早鸟奖励 (百分比)
        uint256 pendingRewards;     // 待领取奖励
        uint256 rewardDebt;         // 奖励债务
    }

    struct PointsRecord {
        uint256 totalEarned;        // 总获得积分
        uint256 totalSpent;         // 总消耗积分
        uint256 currentBalance;     // 当前余额
        uint256 lastUpdateTime;     // 上次更新时间
    }

    struct TokenConfig {
        address tokenAddress;       // 代币地址 (ETH 为 address(0))
        uint8 decimals;             // 小数位数
        bool isActive;              // 是否激活
        uint256 minStakeAmount;     // 最小质押量
        uint256 totalStaked;        // 总质押量
        uint256 totalStakers;       // 总质押人数
    }

    struct PoolInfo {
        uint256 totalStakedValueUSD;  // 总质押价值 (USD)
        uint256 rewardPerSecond;      // 每秒奖励
        uint256 accRewardPerShare;    // 累计每份奖励
        uint256 lastRewardTime;       // 上次奖励时间
        uint256 launchTime;           // 启动时间
    }

    // ============================================
    // 状态变量
    // ============================================

    IERC20 public alphaToken;           // $ALPHA 代币
    IERC20 public usdcToken;            // USDC 代币
    IERC20 public usdtToken;            // USDT 代币
    
    address public treasury;            // 国库地址
    address public priceOracle;         // 价格预言机
    
    PoolInfo public pool;
    
    // 代币配置
    mapping(AssetType => TokenConfig) public tokenConfigs;
    
    // 用户质押信息 (用户地址 => 资产类型 => 质押信息)
    mapping(address => mapping(AssetType => StakeInfo)) public stakes;
    
    // 用户积分
    mapping(address => PointsRecord) public points;
    
    // 费用分配比例 (basis points)
    uint256 public stakersShareRate = 3000;    // 30%
    uint256 public treasuryShareRate = 4000;   // 40%
    uint256 public buybackShareRate = 3000;    // 30%
    
    uint256 public constant PRECISION = 1e18;
    uint256 public constant BASIS_POINTS = 10000;

    // ============================================
    // 事件
    // ============================================

    event Staked(
        address indexed user, 
        AssetType assetType, 
        uint256 amount, 
        uint256 valueUSD,
        LockPeriod lockPeriod,
        uint256 rewardMultiplier
    );
    event Unstaked(address indexed user, AssetType assetType, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsDistributed(uint256 stakersAmount, uint256 treasuryAmount, uint256 buybackAmount);
    
    event PointsEarned(address indexed user, uint256 amount, string reason);
    event PointsSpent(address indexed user, uint256 amount, string reason);
    
    event TokenConfigUpdated(AssetType assetType, address tokenAddress, bool isActive);
    event PriceOracleUpdated(address indexed newOracle);
    event ConfigUpdated(string param, uint256 value);

    // ============================================
    // 构造函数
    // ============================================

    constructor(
        address _alphaToken,
        address _usdcToken,
        address _usdtToken,
        address _treasury,
        address _priceOracle
    ) {
        require(_alphaToken != address(0), "Invalid ALPHA token");
        require(_treasury != address(0), "Invalid treasury");
        
        alphaToken = IERC20(_alphaToken);
        usdcToken = IERC20(_usdcToken);
        usdtToken = IERC20(_usdtToken);
        treasury = _treasury;
        priceOracle = _priceOracle;
        
        // 初始化池信息
        pool = PoolInfo({
            totalStakedValueUSD: 0,
            rewardPerSecond: 1000,  // 基础奖励率
            accRewardPerShare: 0,
            lastRewardTime: block.timestamp,
            launchTime: block.timestamp
        });
        
        // 初始化代币配置
        _initTokenConfig(AssetType.ETH, address(0), 18, 0.01 ether);
        _initTokenConfig(AssetType.USDC, _usdcToken, 6, 10 * 1e6);
        _initTokenConfig(AssetType.USDT, _usdtToken, 6, 10 * 1e6);
        _initTokenConfig(AssetType.ALPHA, _alphaToken, 18, 100 * 1e18);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(POINTS_MANAGER_ROLE, msg.sender);
    }

    // ============================================
    // 质押功能
    // ============================================

    /**
     * @notice 质押 ETH
     * @param lockPeriod 锁定期
     */
    function stakeETH(LockPeriod lockPeriod) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Amount must be > 0");
        require(msg.value >= tokenConfigs[AssetType.ETH].minStakeAmount, "Below minimum");
        
        uint256 ethPriceUSD = getETHPrice();
        uint256 valueUSD = (msg.value * ethPriceUSD) / 1e18;
        
        _stake(msg.sender, AssetType.ETH, msg.value, valueUSD, lockPeriod);
    }

    /**
     * @notice 质押 USDC
     * @param amount 质押数量
     * @param lockPeriod 锁定期
     */
    function stakeUSDC(uint256 amount, LockPeriod lockPeriod) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        require(amount >= tokenConfigs[AssetType.USDC].minStakeAmount, "Below minimum");
        
        usdcToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // USDC 是稳定币，1 USDC = 1 USD
        uint256 valueUSD = amount; // 6 位小数
        
        _stake(msg.sender, AssetType.USDC, amount, valueUSD, lockPeriod);
    }

    /**
     * @notice 质押 USDT
     * @param amount 质押数量
     * @param lockPeriod 锁定期
     */
    function stakeUSDT(uint256 amount, LockPeriod lockPeriod) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        require(amount >= tokenConfigs[AssetType.USDT].minStakeAmount, "Below minimum");
        
        usdtToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // USDT 是稳定币，1 USDT = 1 USD
        uint256 valueUSD = amount; // 6 位小数
        
        _stake(msg.sender, AssetType.USDT, amount, valueUSD, lockPeriod);
    }

    /**
     * @notice 质押 ALPHA
     * @param amount 质押数量
     * @param lockPeriod 锁定期
     */
    function stakeALPHA(uint256 amount, LockPeriod lockPeriod) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        require(amount >= tokenConfigs[AssetType.ALPHA].minStakeAmount, "Below minimum");
        
        alphaToken.safeTransferFrom(msg.sender, address(this), amount);
        
        uint256 alphaPriceUSD = getALPHAPrice();
        uint256 valueUSD = (amount * alphaPriceUSD) / 1e18;
        
        _stake(msg.sender, AssetType.ALPHA, amount, valueUSD, lockPeriod);
    }

    /**
     * @notice 解除质押
     * @param assetType 资产类型
     */
    function unstake(AssetType assetType) external nonReentrant {
        StakeInfo storage stakeInfo = stakes[msg.sender][assetType];
        require(stakeInfo.amount > 0, "No stake found");
        
        // 检查锁定期
        if (stakeInfo.lockPeriod != LockPeriod.Flexible) {
            require(block.timestamp >= stakeInfo.unlockTime, "Still locked");
        }
        
        _updateRewards(msg.sender, assetType);
        
        uint256 amount = stakeInfo.amount;
        uint256 valueUSD = stakeInfo.valueUSD;
        
        // 清除质押信息
        stakeInfo.amount = 0;
        stakeInfo.valueUSD = 0;
        
        // 更新池和代币统计
        pool.totalStakedValueUSD -= valueUSD;
        tokenConfigs[assetType].totalStaked -= amount;
        tokenConfigs[assetType].totalStakers -= 1;
        
        // 转移资产
        if (assetType == AssetType.ETH) {
            (bool success, ) = msg.sender.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else if (assetType == AssetType.USDC) {
            usdcToken.safeTransfer(msg.sender, amount);
        } else if (assetType == AssetType.USDT) {
            usdtToken.safeTransfer(msg.sender, amount);
        } else if (assetType == AssetType.ALPHA) {
            alphaToken.safeTransfer(msg.sender, amount);
        }
        
        emit Unstaked(msg.sender, assetType, amount);
    }

    /**
     * @notice 领取质押奖励
     * @param assetType 资产类型
     */
    function claimRewards(AssetType assetType) external nonReentrant {
        _updateRewards(msg.sender, assetType);
        
        StakeInfo storage stakeInfo = stakes[msg.sender][assetType];
        uint256 rewards = stakeInfo.pendingRewards;
        require(rewards > 0, "No rewards");
        
        stakeInfo.pendingRewards = 0;
        
        alphaToken.safeTransfer(msg.sender, rewards);
        
        emit RewardsClaimed(msg.sender, rewards);
    }

    // ============================================
    // 积分功能
    // ============================================

    /**
     * @notice 发放积分
     */
    function grantPoints(
        address user,
        uint256 amount,
        string calldata reason
    ) external onlyRole(POINTS_MANAGER_ROLE) {
        _addPoints(user, amount, reason);
    }

    /**
     * @notice 消耗积分
     */
    function spendPoints(
        address user,
        uint256 amount,
        string calldata reason
    ) external onlyRole(POINTS_MANAGER_ROLE) {
        _deductPoints(user, amount, reason);
    }

    // ============================================
    // 管理功能
    // ============================================

    function setTokenConfig(
        AssetType assetType,
        address tokenAddress,
        uint8 decimals,
        uint256 minStakeAmount,
        bool isActive
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        TokenConfig storage config = tokenConfigs[assetType];
        config.tokenAddress = tokenAddress;
        config.decimals = decimals;
        config.minStakeAmount = minStakeAmount;
        config.isActive = isActive;
        
        emit TokenConfigUpdated(assetType, tokenAddress, isActive);
    }

    function setPriceOracle(address _oracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        priceOracle = _oracle;
        emit PriceOracleUpdated(_oracle);
    }

    function setRewardPerSecond(uint256 _rate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _updatePoolRewards();
        pool.rewardPerSecond = _rate;
        emit ConfigUpdated("rewardPerSecond", _rate);
    }

    function setShareRates(
        uint256 _stakersRate,
        uint256 _treasuryRate,
        uint256 _buybackRate
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_stakersRate + _treasuryRate + _buybackRate == BASIS_POINTS, "Invalid rates");
        stakersShareRate = _stakersRate;
        treasuryShareRate = _treasuryRate;
        buybackShareRate = _buybackRate;
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
     * @notice 获取用户质押信息
     */
    function getStakeInfo(address user, AssetType assetType) external view returns (
        uint256 stakedAmount,
        uint256 valueUSD,
        LockPeriod lockPeriod,
        uint256 unlockTime,
        uint256 rewardMultiplier,
        uint256 earlyBirdBonus,
        uint256 pendingRewards
    ) {
        StakeInfo storage info = stakes[user][assetType];
        return (
            info.amount,
            info.valueUSD,
            info.lockPeriod,
            info.unlockTime,
            info.rewardMultiplier,
            info.earlyBirdBonus,
            _calculatePendingRewards(user, assetType)
        );
    }

    /**
     * @notice 获取用户所有质押的总 USD 价值
     */
    function getUserTotalStakedUSD(address user) external view returns (uint256 total) {
        total += stakes[user][AssetType.ETH].valueUSD;
        total += stakes[user][AssetType.USDC].valueUSD;
        total += stakes[user][AssetType.USDT].valueUSD;
        total += stakes[user][AssetType.ALPHA].valueUSD;
    }

    /**
     * @notice 获取用户积分信息
     */
    function getPointsInfo(address user) external view returns (
        uint256 balance,
        uint256 totalEarned,
        uint256 totalSpent
    ) {
        PointsRecord storage record = points[user];
        return (record.currentBalance, record.totalEarned, record.totalSpent);
    }

    /**
     * @notice 获取锁定期对应的奖励倍数
     */
    function getRewardMultiplier(LockPeriod lockPeriod) public pure returns (uint256) {
        if (lockPeriod == LockPeriod.Flexible) return 100;          // 1x
        if (lockPeriod == LockPeriod.ThirtyDays) return 150;        // 1.5x
        if (lockPeriod == LockPeriod.NinetyDays) return 200;        // 2x
        if (lockPeriod == LockPeriod.OneEightyDays) return 300;     // 3x
        if (lockPeriod == LockPeriod.ThreeSixtyFiveDays) return 500; // 5x
        return 100;
    }

    /**
     * @notice 获取锁定期时长（秒）
     */
    function getLockDuration(LockPeriod lockPeriod) public pure returns (uint256) {
        if (lockPeriod == LockPeriod.Flexible) return 0;
        if (lockPeriod == LockPeriod.ThirtyDays) return 30 days;
        if (lockPeriod == LockPeriod.NinetyDays) return 90 days;
        if (lockPeriod == LockPeriod.OneEightyDays) return 180 days;
        if (lockPeriod == LockPeriod.ThreeSixtyFiveDays) return 365 days;
        return 0;
    }

    /**
     * @notice 获取早鸟奖励百分比
     */
    function getEarlyBirdBonus() public view returns (uint256) {
        uint256 daysSinceLaunch = (block.timestamp - pool.launchTime) / 1 days;
        
        if (daysSinceLaunch <= 7) return 50;   // +50%
        if (daysSinceLaunch <= 14) return 30;  // +30%
        if (daysSinceLaunch <= 30) return 20;  // +20%
        return 0;
    }

    /**
     * @notice 获取全局质押统计
     */
    function getGlobalStats() external view returns (
        uint256 totalStakedUSD,
        uint256 totalStakers,
        uint256 rewardPerSecond
    ) {
        uint256 stakers = tokenConfigs[AssetType.ETH].totalStakers +
                         tokenConfigs[AssetType.USDC].totalStakers +
                         tokenConfigs[AssetType.USDT].totalStakers +
                         tokenConfigs[AssetType.ALPHA].totalStakers;
        
        return (pool.totalStakedValueUSD, stakers, pool.rewardPerSecond);
    }

    // ============================================
    // 价格预言机函数 (简化版)
    // ============================================

    function getETHPrice() public view returns (uint256) {
        // TODO: 集成 Chainlink 预言机
        // 返回模拟价格 $2500 (18 位小数)
        return 2500 * 1e18;
    }

    function getALPHAPrice() public view returns (uint256) {
        // TODO: 集成 Chainlink 预言机
        // 返回模拟价格 $0.001 (18 位小数)
        return 1e15; // 0.001 * 1e18
    }

    // ============================================
    // 内部函数
    // ============================================

    function _initTokenConfig(
        AssetType assetType,
        address tokenAddress,
        uint8 decimals,
        uint256 minStakeAmount
    ) internal {
        tokenConfigs[assetType] = TokenConfig({
            tokenAddress: tokenAddress,
            decimals: decimals,
            isActive: true,
            minStakeAmount: minStakeAmount,
            totalStaked: 0,
            totalStakers: 0
        });
    }

    function _stake(
        address user,
        AssetType assetType,
        uint256 amount,
        uint256 valueUSD,
        LockPeriod lockPeriod
    ) internal {
        require(tokenConfigs[assetType].isActive, "Token not active");
        
        _updateRewards(user, assetType);
        
        StakeInfo storage stakeInfo = stakes[user][assetType];
        
        // 如果是新质押
        bool isNewStake = stakeInfo.amount == 0;
        
        // 计算奖励倍数和早鸟奖励
        uint256 rewardMultiplier = getRewardMultiplier(lockPeriod);
        uint256 earlyBirdBonus = getEarlyBirdBonus();
        uint256 lockDuration = getLockDuration(lockPeriod);
        
        // 更新质押信息
        stakeInfo.amount += amount;
        stakeInfo.valueUSD += valueUSD;
        stakeInfo.assetType = assetType;
        stakeInfo.lockPeriod = lockPeriod;
        stakeInfo.startTime = block.timestamp;
        stakeInfo.unlockTime = block.timestamp + lockDuration;
        stakeInfo.rewardMultiplier = rewardMultiplier;
        stakeInfo.earlyBirdBonus = earlyBirdBonus;
        
        // 更新池统计
        pool.totalStakedValueUSD += valueUSD;
        tokenConfigs[assetType].totalStaked += amount;
        
        if (isNewStake) {
            tokenConfigs[assetType].totalStakers += 1;
        }
        
        emit Staked(user, assetType, amount, valueUSD, lockPeriod, rewardMultiplier);
    }

    function _updatePoolRewards() internal {
        if (pool.totalStakedValueUSD > 0) {
            uint256 timeElapsed = block.timestamp - pool.lastRewardTime;
            if (timeElapsed > 0) {
                uint256 reward = (timeElapsed * pool.rewardPerSecond * PRECISION) / pool.totalStakedValueUSD;
                pool.accRewardPerShare += reward;
            }
        }
        pool.lastRewardTime = block.timestamp;
    }

    function _updateRewards(address user, AssetType assetType) internal {
        _updatePoolRewards();
        
        StakeInfo storage stakeInfo = stakes[user][assetType];
        
        if (stakeInfo.valueUSD > 0) {
            uint256 pending = _calculatePendingRewards(user, assetType);
            stakeInfo.pendingRewards += pending;
        }
        
        stakeInfo.rewardDebt = (stakeInfo.valueUSD * pool.accRewardPerShare) / PRECISION;
    }

    function _calculatePendingRewards(address user, AssetType assetType) internal view returns (uint256) {
        StakeInfo storage stakeInfo = stakes[user][assetType];
        
        if (stakeInfo.valueUSD == 0) return stakeInfo.pendingRewards;
        
        uint256 accRewardPerShare = pool.accRewardPerShare;
        
        if (pool.totalStakedValueUSD > 0 && block.timestamp > pool.lastRewardTime) {
            uint256 timeElapsed = block.timestamp - pool.lastRewardTime;
            uint256 reward = (timeElapsed * pool.rewardPerSecond * PRECISION) / pool.totalStakedValueUSD;
            accRewardPerShare += reward;
        }
        
        uint256 baseReward = (stakeInfo.valueUSD * accRewardPerShare) / PRECISION - stakeInfo.rewardDebt;
        
        // 应用奖励倍数
        uint256 multipliedReward = (baseReward * stakeInfo.rewardMultiplier) / 100;
        
        // 应用早鸟奖励
        uint256 finalReward = (multipliedReward * (100 + stakeInfo.earlyBirdBonus)) / 100;
        
        return stakeInfo.pendingRewards + finalReward;
    }

    function _addPoints(address user, uint256 amount, string memory reason) internal {
        PointsRecord storage record = points[user];
        record.totalEarned += amount;
        record.currentBalance += amount;
        record.lastUpdateTime = block.timestamp;
        
        emit PointsEarned(user, amount, reason);
    }

    function _deductPoints(address user, uint256 amount, string memory reason) internal {
        PointsRecord storage record = points[user];
        require(record.currentBalance >= amount, "Insufficient points");
        
        record.totalSpent += amount;
        record.currentBalance -= amount;
        record.lastUpdateTime = block.timestamp;
        
        emit PointsSpent(user, amount, reason);
    }

    // 接收 ETH
    receive() external payable {}
}
