// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Chainlink 价格预言机接口
 */
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}

/**
 * @title MultiAssetStaking
 * @notice 多资产质押合约 - 对齐 Solana multi-asset-staking
 * @dev 支持多种资产质押、多种锁定期、自定义代币
 * 
 * 功能:
 * 1. 多资产质押 - 支持 ETH/BNB/USDC/USDT + 自定义代币
 * 2. 锁定期选择 - 灵活/30天/90天/180天/365天
 * 3. 奖励倍数 - 根据锁定期 1x-5x
 * 4. 早鸟奖励 - 前30天额外奖励
 * 5. 自定义代币 - 管理员可添加新的质押代币
 * 6. Chainlink 价格预言机 - 从链上获取实时价格
 */
contract MultiAssetStaking is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============================================
    // 角色定义
    // ============================================
    
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

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

    // ============================================
    // 结构体
    // ============================================

    struct StakeInfo {
        uint256 amount;             // 质押数量
        uint256 valueUSD;           // USD 价值
        address tokenAddress;       // 代币地址 (ETH = address(0))
        LockPeriod lockPeriod;      // 锁定期
        uint256 startTime;          // 质押开始时间
        uint256 unlockTime;         // 解锁时间
        uint256 rewardMultiplier;   // 奖励倍数 (100 = 1x)
        uint256 earlyBirdBonus;     // 早鸟奖励 (百分比)
        uint256 pendingRewards;     // 待领取奖励
        uint256 rewardDebt;         // 奖励债务
    }

    struct TokenConfig {
        string name;                // 代币名称
        address tokenAddress;       // 代币地址 (ETH = address(0))
        uint8 decimals;             // 小数位数
        uint16 baseAPY;             // 基础 APY (basis points, 1000 = 10%)
        uint8 rewardMultiplier;     // 奖励倍数 (100 = 1x, 200 = 2x)
        uint256 minStakeAmount;     // 最小质押量
        bool isActive;              // 是否激活
        uint256 totalStaked;        // 总质押量
        uint256 totalStakers;       // 总质押人数
        uint256 createdAt;          // 创建时间
    }

    struct PoolInfo {
        uint256 totalStakedValueUSD;  // 总质押价值 (USD)
        uint256 rewardPerSecond;      // 每秒奖励
        uint256 accRewardPerShare;    // 累计每份奖励
        uint256 lastRewardTime;       // 上次奖励时间
        uint256 launchTime;           // 启动时间
        
        // 资金分配比例 (basis points)
        uint16 devFundRatio;          // 40% = 4000
        uint16 liquidityRatio;        // 30% = 3000
        uint16 rewardRatio;           // 20% = 2000
        uint16 reserveRatio;          // 10% = 1000
    }

    // ============================================
    // 状态变量
    // ============================================

    IERC20 public rewardToken;          // 奖励代币
    address public treasury;            // 国库地址
    
    // Chainlink 价格预言机
    // BSC Mainnet:
    //   BNB/USD: 0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE
    //   USDT/USD: 0xB97Ad0E74fa7d920791E90258A6E2085088b4320
    //   USDC/USD: 0x51597f405303C4377E36123cBc172b13269EA163
    // BSC Testnet:
    //   BNB/USD: 0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526
    // Ethereum Mainnet:
    //   ETH/USD: 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
    // Sepolia:
    //   ETH/USD: 0x694AA1769357215DE4FAC081bf1f309aDC325306
    
    mapping(address => address) public priceFeeds;  // token => Chainlink feed
    bool public useChainlinkOracle;     // 是否使用 Chainlink
    uint256 public oracleStalenessThreshold;  // 价格过期阈值 (秒)
    
    PoolInfo public pool;
    
    // 支持的代币列表
    address[] public supportedTokens;
    mapping(address => TokenConfig) public tokenConfigs;
    mapping(address => bool) public isTokenSupported;
    
    // 用户质押信息 (用户地址 => 代币地址 => 质押信息)
    mapping(address => mapping(address => StakeInfo)) public stakes;
    
    // 用户质押的代币列表
    mapping(address => address[]) public userStakedTokens;
    
    uint256 public constant PRECISION = 1e18;
    uint256 public constant BASIS_POINTS = 10000;
    
    // ETH 的特殊地址标识
    address public constant ETH_ADDRESS = address(0);

    // ============================================
    // 推荐返佣系统
    // ============================================
    
    struct ReferralInfo {
        address referrer;           // 推荐人地址
        uint256 totalReferred;      // 推荐人数
        uint256 totalEarned;        // 累计获得返佣
        uint256 pendingRewards;     // 待领取返佣
        uint256 refereeStakedUSD;   // 被推荐人质押总额
    }
    
    // 推荐关系 (被推荐人 => 推荐人)
    mapping(address => address) public referrers;
    // 推荐人信息
    mapping(address => ReferralInfo) public referralInfo;
    // 被推荐人列表
    mapping(address => address[]) public referees;
    // 是否已绑定推荐人
    mapping(address => bool) public hasReferrer;
    
    // 返佣比例配置 (基点，10000 = 100%)
    uint16[5] public referralRates = [500, 800, 1000, 1200, 1500]; // 5%, 8%, 10%, 12%, 15%
    uint16[5] public referralTiers = [1, 5, 10, 25, 50]; // 对应人数门槛
    
    // 被推荐人首次质押奖励 (基点)
    uint16 public inviteeBonus = 500; // 5%
    
    // 推荐系统开关
    bool public referralEnabled = true;

    // ============================================
    // 事件
    // ============================================

    event TokenAdded(
        address indexed tokenAddress,
        string name,
        uint16 baseAPY,
        uint8 rewardMultiplier
    );
    
    event TokenUpdated(
        address indexed tokenAddress,
        uint16 baseAPY,
        uint8 rewardMultiplier,
        bool isActive
    );
    
    event TokenRemoved(address indexed tokenAddress);

    event Staked(
        address indexed user, 
        address indexed tokenAddress, 
        uint256 amount, 
        uint256 valueUSD,
        LockPeriod lockPeriod,
        uint256 rewardMultiplier
    );
    
    event Unstaked(
        address indexed user, 
        address indexed tokenAddress, 
        uint256 amount
    );
    
    event RewardsClaimed(
        address indexed user, 
        address indexed tokenAddress,
        uint256 amount
    );
    
    event RewardsAdded(uint256 amount);
    event RewardRateUpdated(uint256 newRate);
    event PriceFeedUpdated(address indexed token, address indexed feed);
    event OracleSettingsUpdated(bool useChainlink, uint256 stalenessThreshold);
    
    // 推荐返佣事件
    event ReferralRegistered(address indexed referee, address indexed referrer);
    event ReferralRewardEarned(address indexed referrer, address indexed referee, uint256 amount, uint256 stakeValueUSD);
    event ReferralRewardClaimed(address indexed referrer, uint256 amount);
    event InviteeBonusEarned(address indexed invitee, uint256 bonusAmount);
    event ReferralRatesUpdated(uint16[5] rates, uint16[5] tiers);

    // ============================================
    // 构造函数
    // ============================================

    constructor(
        address _rewardToken,
        address _treasury,
        address _nativePriceFeed  // Chainlink BNB/USD 或 ETH/USD 喂价地址
    ) {
        require(_rewardToken != address(0), "Invalid reward token");
        require(_treasury != address(0), "Invalid treasury");
        
        rewardToken = IERC20(_rewardToken);
        treasury = _treasury;
        
        // 初始化 Chainlink 预言机设置
        useChainlinkOracle = true;
        oracleStalenessThreshold = 3600; // 1小时
        
        // 设置原生代币 (ETH/BNB) 价格喂价
        if (_nativePriceFeed != address(0)) {
            priceFeeds[ETH_ADDRESS] = _nativePriceFeed;
        }
        
        // 初始化池信息
        pool = PoolInfo({
            totalStakedValueUSD: 0,
            rewardPerSecond: 1000,
            accRewardPerShare: 0,
            lastRewardTime: block.timestamp,
            launchTime: block.timestamp,
            devFundRatio: 4000,
            liquidityRatio: 3000,
            rewardRatio: 2000,
            reserveRatio: 1000
        });
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        
        // 默认添加原生代币 (ETH/BNB) 支持
        _addToken(
            ETH_ADDRESS,
            "Native",  // ETH on Ethereum, BNB on BSC
            18,
            1000,  // 10% base APY
            100,   // 1x multiplier
            0.01 ether
        );
    }

    // ============================================
    // 代币管理
    // ============================================

    /**
     * @notice 添加可质押代币 (仅管理员)
     */
    function addStakeableToken(
        address tokenAddress,
        string calldata name,
        uint8 decimals,
        uint16 baseAPY,
        uint8 rewardMultiplier,
        uint256 minStakeAmount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!isTokenSupported[tokenAddress], "Token already supported");
        require(baseAPY <= 5000, "APY too high"); // max 50%
        require(rewardMultiplier >= 100, "Multiplier must be >= 100");
        
        _addToken(tokenAddress, name, decimals, baseAPY, rewardMultiplier, minStakeAmount);
        
        emit TokenAdded(tokenAddress, name, baseAPY, rewardMultiplier);
    }

    /**
     * @notice 更新代币配置 (仅管理员)
     */
    function updateTokenConfig(
        address tokenAddress,
        uint16 baseAPY,
        uint8 rewardMultiplier,
        uint256 minStakeAmount,
        bool isActive
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(isTokenSupported[tokenAddress], "Token not supported");
        
        TokenConfig storage config = tokenConfigs[tokenAddress];
        config.baseAPY = baseAPY;
        config.rewardMultiplier = rewardMultiplier;
        config.minStakeAmount = minStakeAmount;
        config.isActive = isActive;
        
        emit TokenUpdated(tokenAddress, baseAPY, rewardMultiplier, isActive);
    }

    /**
     * @notice 移除可质押代币 (仅管理员，需确保无活跃质押)
     */
    function removeStakeableToken(address tokenAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(isTokenSupported[tokenAddress], "Token not supported");
        require(tokenConfigs[tokenAddress].totalStaked == 0, "Token has active stakes");
        
        tokenConfigs[tokenAddress].isActive = false;
        
        emit TokenRemoved(tokenAddress);
    }

    // ============================================
    // 质押功能
    // ============================================

    /**
     * @notice 质押 ETH
     */
    function stakeETH(LockPeriod lockPeriod) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Amount must be > 0");
        require(isTokenSupported[ETH_ADDRESS], "ETH not supported");
        require(tokenConfigs[ETH_ADDRESS].isActive, "ETH staking inactive");
        require(msg.value >= tokenConfigs[ETH_ADDRESS].minStakeAmount, "Below minimum");
        
        uint256 ethPriceUSD = getTokenPrice(ETH_ADDRESS);
        uint256 valueUSD = (msg.value * ethPriceUSD) / 1e18;
        
        _stake(msg.sender, ETH_ADDRESS, msg.value, valueUSD, lockPeriod);
    }

    /**
     * @notice 质押 ERC20 代币
     */
    function stakeToken(
        address tokenAddress,
        uint256 amount,
        LockPeriod lockPeriod
    ) external nonReentrant whenNotPaused {
        require(tokenAddress != ETH_ADDRESS, "Use stakeETH for ETH");
        require(amount > 0, "Amount must be > 0");
        require(isTokenSupported[tokenAddress], "Token not supported");
        require(tokenConfigs[tokenAddress].isActive, "Token staking inactive");
        require(amount >= tokenConfigs[tokenAddress].minStakeAmount, "Below minimum");
        
        // 转移代币
        IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), amount);
        
        // 计算 USD 价值
        uint256 tokenPriceUSD = getTokenPrice(tokenAddress);
        uint8 decimals = tokenConfigs[tokenAddress].decimals;
        uint256 valueUSD = (amount * tokenPriceUSD) / (10 ** decimals);
        
        _stake(msg.sender, tokenAddress, amount, valueUSD, lockPeriod);
    }

    /**
     * @notice 解除质押
     */
    function unstake(address tokenAddress) external nonReentrant {
        StakeInfo storage stakeInfo = stakes[msg.sender][tokenAddress];
        require(stakeInfo.amount > 0, "No stake found");
        
        // 检查锁定期
        if (stakeInfo.lockPeriod != LockPeriod.Flexible) {
            require(block.timestamp >= stakeInfo.unlockTime, "Still locked");
        }
        
        _updateRewards(msg.sender, tokenAddress);
        
        uint256 amount = stakeInfo.amount;
        uint256 valueUSD = stakeInfo.valueUSD;
        
        // 清除质押信息
        stakeInfo.amount = 0;
        stakeInfo.valueUSD = 0;
        
        // 更新池和代币统计
        pool.totalStakedValueUSD -= valueUSD;
        tokenConfigs[tokenAddress].totalStaked -= amount;
        tokenConfigs[tokenAddress].totalStakers -= 1;
        
        // 转移资产
        if (tokenAddress == ETH_ADDRESS) {
            (bool success, ) = msg.sender.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(tokenAddress).safeTransfer(msg.sender, amount);
        }
        
        emit Unstaked(msg.sender, tokenAddress, amount);
    }

    /**
     * @notice 领取质押奖励
     */
    function claimRewards(address tokenAddress) external nonReentrant {
        _updateRewards(msg.sender, tokenAddress);
        
        StakeInfo storage stakeInfo = stakes[msg.sender][tokenAddress];
        uint256 rewards = stakeInfo.pendingRewards;
        require(rewards > 0, "No rewards");
        
        stakeInfo.pendingRewards = 0;
        
        rewardToken.safeTransfer(msg.sender, rewards);
        
        emit RewardsClaimed(msg.sender, tokenAddress, rewards);
    }

    // ============================================
    // 管理功能
    // ============================================

    /**
     * @notice 添加奖励到池子
     */
    function addRewards(uint256 amount) external onlyRole(OPERATOR_ROLE) {
        require(amount > 0, "Amount must be > 0");
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        emit RewardsAdded(amount);
    }

    /**
     * @notice 更新奖励率
     */
    function updateRewardRate(uint256 newRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _updatePoolRewards();
        pool.rewardPerSecond = newRate;
        emit RewardRateUpdated(newRate);
    }

    /**
     * @notice 设置资金分配比例
     */
    function setFundRatios(
        uint16 devFund,
        uint16 liquidity,
        uint16 reward,
        uint16 reserve
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(devFund + liquidity + reward + reserve == BASIS_POINTS, "Invalid ratios");
        pool.devFundRatio = devFund;
        pool.liquidityRatio = liquidity;
        pool.rewardRatio = reward;
        pool.reserveRatio = reserve;
    }

    /**
     * @notice 设置代币的 Chainlink 价格喂价地址
     */
    function setPriceFeed(address token, address feed) external onlyRole(DEFAULT_ADMIN_ROLE) {
        priceFeeds[token] = feed;
        emit PriceFeedUpdated(token, feed);
    }

    /**
     * @notice 批量设置价格喂价
     */
    function setPriceFeeds(
        address[] calldata tokens,
        address[] calldata feeds
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(tokens.length == feeds.length, "Length mismatch");
        for (uint256 i = 0; i < tokens.length; i++) {
            priceFeeds[tokens[i]] = feeds[i];
            emit PriceFeedUpdated(tokens[i], feeds[i]);
        }
    }

    /**
     * @notice 设置预言机使用设置
     */
    function setOracleSettings(
        bool _useChainlink,
        uint256 _stalenessThreshold
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        useChainlinkOracle = _useChainlink;
        oracleStalenessThreshold = _stalenessThreshold;
        emit OracleSettingsUpdated(_useChainlink, _stalenessThreshold);
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
    function getStakeInfo(address user, address tokenAddress) external view returns (
        uint256 stakedAmount,
        uint256 valueUSD,
        LockPeriod lockPeriod,
        uint256 unlockTime,
        uint256 rewardMultiplier,
        uint256 earlyBirdBonus,
        uint256 pendingRewards
    ) {
        StakeInfo storage info = stakes[user][tokenAddress];
        return (
            info.amount,
            info.valueUSD,
            info.lockPeriod,
            info.unlockTime,
            info.rewardMultiplier,
            info.earlyBirdBonus,
            _calculatePendingRewards(user, tokenAddress)
        );
    }

    /**
     * @notice 获取代币配置
     */
    function getTokenConfig(address tokenAddress) external view returns (
        string memory name,
        uint8 decimals,
        uint16 baseAPY,
        uint8 rewardMultiplier,
        uint256 minStakeAmount,
        bool isActive,
        uint256 totalStaked,
        uint256 totalStakers
    ) {
        TokenConfig storage config = tokenConfigs[tokenAddress];
        return (
            config.name,
            config.decimals,
            config.baseAPY,
            config.rewardMultiplier,
            config.minStakeAmount,
            config.isActive,
            config.totalStaked,
            config.totalStakers
        );
    }

    /**
     * @notice 获取所有支持的代币
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }

    /**
     * @notice 获取用户所有质押的总 USD 价值
     */
    function getUserTotalStakedUSD(address user) external view returns (uint256 total) {
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            total += stakes[user][supportedTokens[i]].valueUSD;
        }
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
        uint256 rewardPerSecond,
        uint256 supportedTokenCount
    ) {
        uint256 stakers = 0;
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            stakers += tokenConfigs[supportedTokens[i]].totalStakers;
        }
        
        return (
            pool.totalStakedValueUSD, 
            stakers, 
            pool.rewardPerSecond,
            supportedTokens.length
        );
    }

    // ============================================
    // 价格预言机函数 - Chainlink 集成
    // ============================================

    /**
     * @notice 获取代币价格 (18位小数)
     * @dev 优先使用 Chainlink，否则回退到默认值
     */
    function getTokenPrice(address tokenAddress) public view returns (uint256) {
        // 尝试从 Chainlink 获取价格
        if (useChainlinkOracle && priceFeeds[tokenAddress] != address(0)) {
            return _getChainlinkPrice(tokenAddress);
        }
        
        // 回退: 使用默认价格
        return _getFallbackPrice(tokenAddress);
    }

    /**
     * @notice 从 Chainlink 获取价格
     */
    function _getChainlinkPrice(address tokenAddress) internal view returns (uint256) {
        address feed = priceFeeds[tokenAddress];
        require(feed != address(0), "No price feed");
        
        AggregatorV3Interface priceFeed = AggregatorV3Interface(feed);
        
        (
            uint80 roundId,
            int256 answer,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        
        // 验证数据有效性
        require(answer > 0, "Invalid price");
        require(updatedAt > 0, "Round not complete");
        require(answeredInRound >= roundId, "Stale price");
        require(block.timestamp - updatedAt <= oracleStalenessThreshold, "Price too old");
        
        // Chainlink 返回 8 位小数，转换为 18 位
        uint8 feedDecimals = priceFeed.decimals();
        if (feedDecimals < 18) {
            return uint256(answer) * 10**(18 - feedDecimals);
        } else if (feedDecimals > 18) {
            return uint256(answer) / 10**(feedDecimals - 18);
        }
        return uint256(answer);
    }

    /**
     * @notice 回退价格 (无预言机时使用)
     */
    function _getFallbackPrice(address tokenAddress) internal view returns (uint256) {
        // 原生代币 (ETH/BNB) 默认价格
        if (tokenAddress == ETH_ADDRESS) {
            return 600 * 1e18; // $600 (保守估计)
        }
        
        // 稳定币 (6位小数的通常是稳定币)
        if (tokenConfigs[tokenAddress].decimals == 6) {
            return 1e18; // $1
        }
        
        // Meme 代币默认很低价格
        return 1e15; // $0.001
    }

    /**
     * @notice 检查价格喂价是否健康
     */
    function isPriceFeedHealthy(address tokenAddress) external view returns (bool healthy, string memory reason) {
        address feed = priceFeeds[tokenAddress];
        
        if (feed == address(0)) {
            return (false, "No price feed configured");
        }
        
        AggregatorV3Interface priceFeed = AggregatorV3Interface(feed);
        
        try priceFeed.latestRoundData() returns (
            uint80 roundId,
            int256 answer,
            uint256,
            uint256 updatedAt,
            uint80 answeredInRound
        ) {
            if (answer <= 0) return (false, "Invalid price");
            if (updatedAt == 0) return (false, "Round not complete");
            if (answeredInRound < roundId) return (false, "Stale price");
            if (block.timestamp - updatedAt > oracleStalenessThreshold) return (false, "Price too old");
            return (true, "Healthy");
        } catch {
            return (false, "Feed call failed");
        }
    }

    /**
     * @notice 获取价格喂价详情
     */
    function getPriceFeedInfo(address tokenAddress) external view returns (
        address feedAddress,
        uint256 price,
        uint256 lastUpdate,
        uint8 feedDecimals,
        bool isHealthy
    ) {
        feedAddress = priceFeeds[tokenAddress];
        
        if (feedAddress == address(0)) {
            price = _getFallbackPrice(tokenAddress);
            return (address(0), price, 0, 0, false);
        }
        
        AggregatorV3Interface priceFeed = AggregatorV3Interface(feedAddress);
        feedDecimals = priceFeed.decimals();
        
        try priceFeed.latestRoundData() returns (
            uint80,
            int256 answer,
            uint256,
            uint256 updatedAt,
            uint80
        ) {
            if (feedDecimals < 18) {
                price = uint256(answer) * 10**(18 - feedDecimals);
            } else {
                price = uint256(answer);
            }
            lastUpdate = updatedAt;
            isHealthy = (block.timestamp - updatedAt <= oracleStalenessThreshold) && (answer > 0);
        } catch {
            price = _getFallbackPrice(tokenAddress);
            isHealthy = false;
        }
    }

    // ============================================
    // 内部函数
    // ============================================

    function _addToken(
        address tokenAddress,
        string memory name,
        uint8 decimals,
        uint16 baseAPY,
        uint8 rewardMultiplier,
        uint256 minStakeAmount
    ) internal {
        tokenConfigs[tokenAddress] = TokenConfig({
            name: name,
            tokenAddress: tokenAddress,
            decimals: decimals,
            baseAPY: baseAPY,
            rewardMultiplier: rewardMultiplier,
            minStakeAmount: minStakeAmount,
            isActive: true,
            totalStaked: 0,
            totalStakers: 0,
            createdAt: block.timestamp
        });
        
        supportedTokens.push(tokenAddress);
        isTokenSupported[tokenAddress] = true;
    }

    function _stake(
        address user,
        address tokenAddress,
        uint256 amount,
        uint256 valueUSD,
        LockPeriod lockPeriod
    ) internal {
        _updateRewards(user, tokenAddress);
        
        StakeInfo storage stakeInfo = stakes[user][tokenAddress];
        TokenConfig storage tokenConfig = tokenConfigs[tokenAddress];
        
        // 如果是新质押
        bool isNewStake = stakeInfo.amount == 0;
        
        // 计算奖励倍数和早鸟奖励
        uint256 lockMultiplier = getRewardMultiplier(lockPeriod);
        uint256 tokenMultiplier = tokenConfig.rewardMultiplier;
        uint256 totalMultiplier = (lockMultiplier * tokenMultiplier) / 100;
        uint256 earlyBirdBonus = getEarlyBirdBonus();
        uint256 lockDuration = getLockDuration(lockPeriod);
        
        // 更新质押信息
        stakeInfo.amount += amount;
        stakeInfo.valueUSD += valueUSD;
        stakeInfo.tokenAddress = tokenAddress;
        stakeInfo.lockPeriod = lockPeriod;
        stakeInfo.startTime = block.timestamp;
        stakeInfo.unlockTime = block.timestamp + lockDuration;
        stakeInfo.rewardMultiplier = totalMultiplier;
        stakeInfo.earlyBirdBonus = earlyBirdBonus;
        
        // 更新池统计
        pool.totalStakedValueUSD += valueUSD;
        tokenConfig.totalStaked += amount;
        
        if (isNewStake) {
            tokenConfig.totalStakers += 1;
            userStakedTokens[user].push(tokenAddress);
        }
        
        // 处理推荐返佣（基于质押 USD 价值）
        _processReferralReward(user, valueUSD);
        
        emit Staked(user, tokenAddress, amount, valueUSD, lockPeriod, totalMultiplier);
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

    function _updateRewards(address user, address tokenAddress) internal {
        _updatePoolRewards();
        
        StakeInfo storage stakeInfo = stakes[user][tokenAddress];
        
        if (stakeInfo.valueUSD > 0) {
            uint256 pending = _calculatePendingRewards(user, tokenAddress);
            stakeInfo.pendingRewards += pending;
        }
        
        stakeInfo.rewardDebt = (stakeInfo.valueUSD * pool.accRewardPerShare) / PRECISION;
    }

    function _calculatePendingRewards(address user, address tokenAddress) internal view returns (uint256) {
        StakeInfo storage stakeInfo = stakes[user][tokenAddress];
        
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

    // ============================================
    // 推荐返佣功能
    // ============================================

    /**
     * @notice 注册推荐关系（被推荐人调用）
     * @param referrer 推荐人地址
     */
    function registerReferral(address referrer) external {
        require(referralEnabled, "Referral disabled");
        require(referrer != address(0), "Invalid referrer");
        require(referrer != msg.sender, "Cannot refer self");
        require(!hasReferrer[msg.sender], "Already has referrer");
        require(referrers[referrer] != msg.sender, "Circular referral");
        
        // 绑定推荐关系
        referrers[msg.sender] = referrer;
        hasReferrer[msg.sender] = true;
        referees[referrer].push(msg.sender);
        referralInfo[referrer].totalReferred += 1;
        
        emit ReferralRegistered(msg.sender, referrer);
    }

    /**
     * @notice 领取推荐返佣
     */
    function claimReferralRewards() external nonReentrant {
        ReferralInfo storage info = referralInfo[msg.sender];
        uint256 rewards = info.pendingRewards;
        require(rewards > 0, "No referral rewards");
        
        info.pendingRewards = 0;
        
        // 发放返佣（使用奖励代币）
        rewardToken.safeTransfer(msg.sender, rewards);
        
        emit ReferralRewardClaimed(msg.sender, rewards);
    }

    /**
     * @notice 获取推荐人的返佣比例
     */
    function getReferralRate(address referrer) public view returns (uint16) {
        uint256 referredCount = referralInfo[referrer].totalReferred;
        
        // 从高到低匹配等级
        for (uint256 i = 4; i >= 0; i--) {
            if (referredCount >= referralTiers[i]) {
                return referralRates[i];
            }
            if (i == 0) break;
        }
        return referralRates[0];
    }

    /**
     * @notice 获取推荐人等级 (1-5)
     */
    function getReferralTier(address referrer) public view returns (uint8) {
        uint256 referredCount = referralInfo[referrer].totalReferred;
        
        for (uint256 i = 4; i >= 0; i--) {
            if (referredCount >= referralTiers[i]) {
                return uint8(i + 1);
            }
            if (i == 0) break;
        }
        return 1;
    }

    /**
     * @notice 获取推荐统计信息
     */
    function getReferralStats(address user) external view returns (
        address referrer,
        uint256 totalReferred,
        uint256 totalEarned,
        uint256 pendingRewards,
        uint256 refereeStakedUSD,
        uint8 tier,
        uint16 currentRate
    ) {
        ReferralInfo storage info = referralInfo[user];
        return (
            referrers[user],
            info.totalReferred,
            info.totalEarned,
            info.pendingRewards,
            info.refereeStakedUSD,
            getReferralTier(user),
            getReferralRate(user)
        );
    }

    /**
     * @notice 获取推荐人的被推荐人列表
     */
    function getReferees(address referrer) external view returns (address[] memory) {
        return referees[referrer];
    }

    /**
     * @notice 更新推荐返佣配置（仅管理员）
     */
    function updateReferralConfig(
        uint16[5] calldata rates,
        uint16[5] calldata tiers,
        uint16 _inviteeBonus,
        bool _enabled
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(rates[0] <= 2000, "Rate too high"); // max 20%
        
        referralRates = rates;
        referralTiers = tiers;
        inviteeBonus = _inviteeBonus;
        referralEnabled = _enabled;
        
        emit ReferralRatesUpdated(rates, tiers);
    }

    /**
     * @notice 内部函数：处理推荐返佣
     * @dev 在质押时调用
     */
    function _processReferralReward(address staker, uint256 stakeValueUSD) internal {
        if (!referralEnabled) return;
        
        address referrer = referrers[staker];
        if (referrer == address(0)) return;
        
        // 计算推荐人返佣
        uint16 rate = getReferralRate(referrer);
        uint256 referrerReward = (stakeValueUSD * rate) / BASIS_POINTS;
        
        if (referrerReward > 0) {
            referralInfo[referrer].pendingRewards += referrerReward;
            referralInfo[referrer].totalEarned += referrerReward;
            referralInfo[referrer].refereeStakedUSD += stakeValueUSD;
            
            emit ReferralRewardEarned(referrer, staker, referrerReward, stakeValueUSD);
        }
    }

    // 接收 ETH
    receive() external payable {}
}
