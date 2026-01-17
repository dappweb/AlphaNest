// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MultiAssetStaking
 * @notice 多资产质押合约 - 对齐 Solana multi-asset-staking
 * @dev 支持多种资产质押、多种锁定期、自定义代币
 * 
 * 功能:
 * 1. 多资产质押 - 支持 ETH/USDC/USDT + 自定义代币
 * 2. 锁定期选择 - 灵活/30天/90天/180天/365天
 * 3. 奖励倍数 - 根据锁定期 1x-5x
 * 4. 早鸟奖励 - 前30天额外奖励
 * 5. 自定义代币 - 管理员可添加新的质押代币
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
    address public priceOracle;         // 价格预言机
    
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
    event PriceOracleUpdated(address indexed newOracle);

    // ============================================
    // 构造函数
    // ============================================

    constructor(
        address _rewardToken,
        address _treasury,
        address _priceOracle
    ) {
        require(_rewardToken != address(0), "Invalid reward token");
        require(_treasury != address(0), "Invalid treasury");
        
        rewardToken = IERC20(_rewardToken);
        treasury = _treasury;
        priceOracle = _priceOracle;
        
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
        
        // 默认添加 ETH 支持
        _addToken(
            ETH_ADDRESS,
            "ETH",
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

    function setPriceOracle(address _oracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        priceOracle = _oracle;
        emit PriceOracleUpdated(_oracle);
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
    // 价格预言机函数 (简化版)
    // ============================================

    function getTokenPrice(address tokenAddress) public view returns (uint256) {
        // TODO: 集成 Chainlink 预言机
        // 返回模拟价格 (18 位小数)
        if (tokenAddress == ETH_ADDRESS) {
            return 2500 * 1e18; // $2500
        }
        // 稳定币
        if (tokenConfigs[tokenAddress].decimals == 6) {
            return 1e18; // $1
        }
        // 其他代币默认 $0.001
        return 1e15;
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

    // 接收 ETH
    receive() external payable {}
}
