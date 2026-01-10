// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AlphaNestCore
 * @notice AlphaNest 平台核心合约 - 积分系统与质押权重管理
 * @dev 管理用户积分、$ALPHA 质押、挖矿权重计算
 * 
 * 功能:
 * 1. 积分系统 - 用户通过各种活动获取积分
 * 2. 质押系统 - 用户质押 $ALPHA 获得分红和挖矿权重
 * 3. 手续费分配 - 协议收入分配给质押者
 * 4. 尸体币复活 - 归零币销毁兑换积分
 */
contract AlphaNestCore is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============================================
    // 角色定义
    // ============================================
    
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant POINTS_MANAGER_ROLE = keccak256("POINTS_MANAGER_ROLE");

    // ============================================
    // 类型定义
    // ============================================

    struct StakeInfo {
        uint256 amount;             // 质押数量
        uint256 startTime;          // 质押开始时间
        uint256 lastClaimTime;      // 上次领取时间
        uint256 accumulatedRewards; // 累计待领取奖励
    }

    struct PointsRecord {
        uint256 totalEarned;        // 总获得积分
        uint256 totalSpent;         // 总消耗积分
        uint256 currentBalance;     // 当前余额
        uint256 lastUpdateTime;     // 上次更新时间
    }

    struct DeadCoinBurn {
        address token;              // 被销毁的代币
        uint256 amount;             // 销毁数量
        uint256 pointsReceived;     // 获得的积分
        uint256 timestamp;          // 时间戳
    }

    // ============================================
    // 状态变量
    // ============================================

    IERC20 public alphaToken;           // $ALPHA 代币
    
    // 质押相关
    uint256 public totalStaked;         // 总质押量
    uint256 public rewardPerShare;      // 每份质押的累计奖励
    uint256 public lastRewardTime;      // 上次奖励分配时间
    uint256 public minStakeAmount;      // 最小质押量
    uint256 public unstakeCooldown;     // 解除质押冷却期
    
    // 费用分配
    uint256 public stakersShareRate;    // 质押者分成比例 (basis points, 3000 = 30%)
    uint256 public treasuryShareRate;   // 国库分成比例 (4000 = 40%)
    uint256 public buybackShareRate;    // 回购销毁比例 (3000 = 30%)
    
    address public treasury;            // 国库地址
    address public buybackAddress;      // 回购地址
    
    // 积分相关
    uint256 public pointsPerVerify;     // 每次验证获得的积分
    uint256 public deadCoinPointRate;   // 尸体币兑换比率 (basis points)
    
    // 映射
    mapping(address => StakeInfo) public stakes;
    mapping(address => PointsRecord) public points;
    mapping(address => DeadCoinBurn[]) public burnHistory;
    mapping(address => uint256) public pendingUnstake;
    mapping(address => uint256) public unstakeRequestTime;
    
    // 白名单代币 (可用于兑换积分的尸体币)
    mapping(address => bool) public whitelistedDeadCoins;
    mapping(address => uint256) public deadCoinValues;  // 代币对应的积分价值
    
    uint256 public constant PRECISION = 1e18;

    // ============================================
    // 事件
    // ============================================

    event Staked(address indexed user, uint256 amount, uint256 totalStaked);
    event UnstakeRequested(address indexed user, uint256 amount, uint256 unlockTime);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsDistributed(uint256 stakersAmount, uint256 treasuryAmount, uint256 buybackAmount);
    
    event PointsEarned(address indexed user, uint256 amount, string reason);
    event PointsSpent(address indexed user, uint256 amount, string reason);
    event DeadCoinBurned(address indexed user, address indexed token, uint256 amount, uint256 pointsReceived);
    
    event DeadCoinWhitelisted(address indexed token, uint256 pointValue);
    event DeadCoinRemoved(address indexed token);
    event ConfigUpdated(string param, uint256 value);

    // ============================================
    // 构造函数
    // ============================================

    constructor(
        address _alphaToken,
        address _treasury,
        address _buybackAddress
    ) {
        require(_alphaToken != address(0), "Invalid token");
        require(_treasury != address(0), "Invalid treasury");
        require(_buybackAddress != address(0), "Invalid buyback");
        
        alphaToken = IERC20(_alphaToken);
        treasury = _treasury;
        buybackAddress = _buybackAddress;
        
        // 默认配置
        stakersShareRate = 3000;    // 30%
        treasuryShareRate = 4000;   // 40%
        buybackShareRate = 3000;    // 30%
        
        minStakeAmount = 100 * 1e18;     // 最小 100 $ALPHA
        unstakeCooldown = 7 days;         // 7天冷却期
        pointsPerVerify = 100;            // 每次验证 100 积分
        deadCoinPointRate = 1000;         // 10% 价值转换
        
        lastRewardTime = block.timestamp;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(POINTS_MANAGER_ROLE, msg.sender);
    }

    // ============================================
    // 质押功能
    // ============================================

    /**
     * @notice 质押 $ALPHA 代币
     * @param amount 质押数量
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount >= minStakeAmount, "Below minimum stake");
        
        _updateRewards(msg.sender);
        
        alphaToken.safeTransferFrom(msg.sender, address(this), amount);
        
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].startTime = block.timestamp;
        totalStaked += amount;
        
        emit Staked(msg.sender, amount, totalStaked);
    }

    /**
     * @notice 请求解除质押
     * @param amount 解除数量
     */
    function requestUnstake(uint256 amount) external nonReentrant {
        StakeInfo storage stakeInfo = stakes[msg.sender];
        require(stakeInfo.amount >= amount, "Insufficient stake");
        require(pendingUnstake[msg.sender] == 0, "Pending unstake exists");
        
        _updateRewards(msg.sender);
        
        stakeInfo.amount -= amount;
        totalStaked -= amount;
        
        pendingUnstake[msg.sender] = amount;
        unstakeRequestTime[msg.sender] = block.timestamp;
        
        emit UnstakeRequested(msg.sender, amount, block.timestamp + unstakeCooldown);
    }

    /**
     * @notice 完成解除质押（冷却期后）
     */
    function completeUnstake() external nonReentrant {
        uint256 amount = pendingUnstake[msg.sender];
        require(amount > 0, "No pending unstake");
        require(
            block.timestamp >= unstakeRequestTime[msg.sender] + unstakeCooldown,
            "Cooldown not finished"
        );
        
        pendingUnstake[msg.sender] = 0;
        unstakeRequestTime[msg.sender] = 0;
        
        alphaToken.safeTransfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }

    /**
     * @notice 领取质押奖励
     */
    function claimRewards() external nonReentrant {
        _updateRewards(msg.sender);
        
        uint256 rewards = stakes[msg.sender].accumulatedRewards;
        require(rewards > 0, "No rewards");
        
        stakes[msg.sender].accumulatedRewards = 0;
        stakes[msg.sender].lastClaimTime = block.timestamp;
        
        alphaToken.safeTransfer(msg.sender, rewards);
        
        emit RewardsClaimed(msg.sender, rewards);
    }

    // ============================================
    // 积分功能
    // ============================================

    /**
     * @notice 发放积分（仅限积分管理员）
     * @param user 用户地址
     * @param amount 积分数量
     * @param reason 原因
     */
    function grantPoints(
        address user,
        uint256 amount,
        string calldata reason
    ) external onlyRole(POINTS_MANAGER_ROLE) {
        _addPoints(user, amount, reason);
    }

    /**
     * @notice 批量发放积分
     * @param users 用户地址数组
     * @param amounts 积分数量数组
     * @param reason 原因
     */
    function batchGrantPoints(
        address[] calldata users,
        uint256[] calldata amounts,
        string calldata reason
    ) external onlyRole(POINTS_MANAGER_ROLE) {
        require(users.length == amounts.length, "Length mismatch");
        
        for (uint256 i = 0; i < users.length; i++) {
            _addPoints(users[i], amounts[i], reason);
        }
    }

    /**
     * @notice 消耗积分（仅限积分管理员）
     * @param user 用户地址
     * @param amount 积分数量
     * @param reason 原因
     */
    function spendPoints(
        address user,
        uint256 amount,
        string calldata reason
    ) external onlyRole(POINTS_MANAGER_ROLE) {
        _deductPoints(user, amount, reason);
    }

    /**
     * @notice 验证持仓获取积分
     * @dev 前端调用验证后，后端调用此函数发放积分
     */
    function verifyAndEarn(address user) external onlyRole(POINTS_MANAGER_ROLE) {
        _addPoints(user, pointsPerVerify, "verify_holding");
    }

    // ============================================
    // 尸体币复活功能
    // ============================================

    /**
     * @notice 销毁尸体币兑换积分
     * @param token 代币地址
     * @param amount 销毁数量
     */
    function burnDeadCoin(address token, uint256 amount) external nonReentrant whenNotPaused {
        require(whitelistedDeadCoins[token], "Token not whitelisted");
        require(amount > 0, "Amount must be > 0");
        
        // 转入代币到销毁地址
        IERC20(token).safeTransferFrom(msg.sender, address(0xdead), amount);
        
        // 计算积分
        uint256 tokenValue = deadCoinValues[token];
        uint256 pointsToGrant = (amount * tokenValue * deadCoinPointRate) / (10000 * PRECISION);
        
        // 发放积分
        _addPoints(msg.sender, pointsToGrant, "dead_coin_burn");
        
        // 记录历史
        burnHistory[msg.sender].push(DeadCoinBurn({
            token: token,
            amount: amount,
            pointsReceived: pointsToGrant,
            timestamp: block.timestamp
        }));
        
        emit DeadCoinBurned(msg.sender, token, amount, pointsToGrant);
    }

    // ============================================
    // 费用分配
    // ============================================

    /**
     * @notice 分配协议收入
     * @param amount 收入金额
     */
    function distributeRevenue(uint256 amount) external onlyRole(OPERATOR_ROLE) nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        alphaToken.safeTransferFrom(msg.sender, address(this), amount);
        
        uint256 stakersAmount = (amount * stakersShareRate) / 10000;
        uint256 treasuryAmount = (amount * treasuryShareRate) / 10000;
        uint256 buybackAmount = amount - stakersAmount - treasuryAmount;
        
        // 分配给质押者
        if (totalStaked > 0 && stakersAmount > 0) {
            rewardPerShare += (stakersAmount * PRECISION) / totalStaked;
        }
        
        // 转入国库
        if (treasuryAmount > 0) {
            alphaToken.safeTransfer(treasury, treasuryAmount);
        }
        
        // 转入回购地址
        if (buybackAmount > 0) {
            alphaToken.safeTransfer(buybackAddress, buybackAmount);
        }
        
        lastRewardTime = block.timestamp;
        
        emit RewardsDistributed(stakersAmount, treasuryAmount, buybackAmount);
    }

    // ============================================
    // 管理功能
    // ============================================

    function setMinStakeAmount(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        minStakeAmount = amount;
        emit ConfigUpdated("minStakeAmount", amount);
    }

    function setUnstakeCooldown(uint256 duration) external onlyRole(DEFAULT_ADMIN_ROLE) {
        unstakeCooldown = duration;
        emit ConfigUpdated("unstakeCooldown", duration);
    }

    function setPointsPerVerify(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        pointsPerVerify = amount;
        emit ConfigUpdated("pointsPerVerify", amount);
    }

    function setDeadCoinPointRate(uint256 rate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(rate <= 10000, "Rate too high");
        deadCoinPointRate = rate;
        emit ConfigUpdated("deadCoinPointRate", rate);
    }

    function setShareRates(
        uint256 _stakersRate,
        uint256 _treasuryRate,
        uint256 _buybackRate
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_stakersRate + _treasuryRate + _buybackRate == 10000, "Invalid rates");
        stakersShareRate = _stakersRate;
        treasuryShareRate = _treasuryRate;
        buybackShareRate = _buybackRate;
    }

    function setTreasury(address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_treasury != address(0), "Invalid address");
        treasury = _treasury;
    }

    function setBuybackAddress(address _buyback) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_buyback != address(0), "Invalid address");
        buybackAddress = _buyback;
    }

    function whitelistDeadCoin(address token, uint256 pointValue) external onlyRole(OPERATOR_ROLE) {
        whitelistedDeadCoins[token] = true;
        deadCoinValues[token] = pointValue;
        emit DeadCoinWhitelisted(token, pointValue);
    }

    function removeDeadCoin(address token) external onlyRole(OPERATOR_ROLE) {
        whitelistedDeadCoins[token] = false;
        deadCoinValues[token] = 0;
        emit DeadCoinRemoved(token);
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
    function getStakeInfo(address user) external view returns (
        uint256 stakedAmount,
        uint256 pendingRewards,
        uint256 pendingUnstakeAmount,
        uint256 unstakeUnlockTime
    ) {
        StakeInfo storage stakeInfo = stakes[user];
        
        stakedAmount = stakeInfo.amount;
        pendingRewards = _pendingRewards(user);
        pendingUnstakeAmount = pendingUnstake[user];
        
        if (pendingUnstakeAmount > 0) {
            unstakeUnlockTime = unstakeRequestTime[user] + unstakeCooldown;
        }
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
     * @notice 获取用户挖矿权重
     * @dev 权重 = 质押量 * 时间系数
     */
    function getMiningWeight(address user) external view returns (uint256) {
        StakeInfo storage stakeInfo = stakes[user];
        if (stakeInfo.amount == 0) return 0;
        
        // 时间系数: 质押越久权重越高 (最高 2x)
        uint256 stakeDuration = block.timestamp - stakeInfo.startTime;
        uint256 timeMultiplier = PRECISION + (stakeDuration * PRECISION) / (365 days);
        if (timeMultiplier > 2 * PRECISION) {
            timeMultiplier = 2 * PRECISION;
        }
        
        return (stakeInfo.amount * timeMultiplier) / PRECISION;
    }

    /**
     * @notice 获取用户尸体币销毁历史
     */
    function getBurnHistory(address user) external view returns (DeadCoinBurn[] memory) {
        return burnHistory[user];
    }

    /**
     * @notice 获取年化收益率 (APY) 估算
     */
    function getEstimatedAPY() external view returns (uint256) {
        if (totalStaked == 0) return 0;
        
        // 简化估算: 基于最近分配的奖励
        // 实际 APY 取决于协议收入
        return (rewardPerShare * 365 days * 10000) / PRECISION;
    }

    // ============================================
    // 内部函数
    // ============================================

    function _updateRewards(address user) internal {
        StakeInfo storage stakeInfo = stakes[user];
        
        if (stakeInfo.amount > 0) {
            uint256 pending = _pendingRewards(user);
            stakeInfo.accumulatedRewards += pending;
        }
        
        stakeInfo.lastClaimTime = block.timestamp;
    }

    function _pendingRewards(address user) internal view returns (uint256) {
        StakeInfo storage stakeInfo = stakes[user];
        
        if (stakeInfo.amount == 0) return 0;
        
        return (stakeInfo.amount * rewardPerShare) / PRECISION - 
               (stakeInfo.amount * stakeInfo.lastClaimTime) / PRECISION;
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
}
