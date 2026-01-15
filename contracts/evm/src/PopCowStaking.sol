// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PopCow Staking
 * @notice 质押合约，支持多种锁定期和奖励倍数
 * @dev 支持灵活质押和固定期限质押
 */
contract PopCowStaking is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ============== 枚举类型 ==============
    
    enum LockPeriod { 
        Flexible,           // 灵活质押 - 5% APY
        ThirtyDays,         // 30天锁定 - 12% APY
        NinetyDays,         // 90天锁定 - 20% APY
        OneEightyDays,      // 180天锁定 - 35% APY
        ThreeSixtyFiveDays  // 365天锁定 - 50% APY
    }
    
    // ============== 结构体 ==============
    
    struct StakeInfo {
        uint256 amount;
        LockPeriod lockPeriod;
        uint256 stakeTime;
        uint256 unlockTime;
        uint256 rewardDebt;
        uint256 pendingRewards;
    }
    
    struct PoolInfo {
        uint256 totalStaked;
        uint256 rewardPerSecond;
        uint256 accRewardPerShare;
        uint256 lastRewardTime;
    }
    
    // ============== 常量 ==============
    
    uint256 public constant PRECISION = 1e18;
    
    // 锁定期对应的秒数
    uint256 public constant THIRTY_DAYS = 30 days;
    uint256 public constant NINETY_DAYS = 90 days;
    uint256 public constant ONE_EIGHTY_DAYS = 180 days;
    uint256 public constant THREE_SIXTY_FIVE_DAYS = 365 days;
    
    // ============== 状态变量 ==============
    
    IERC20 public stakeToken;
    IERC20 public rewardToken;
    
    PoolInfo public pool;
    mapping(address => StakeInfo) public stakes;
    
    uint256 public totalRewardsDistributed;
    uint256 public minStakeAmount = 100 * 1e18; // 最小质押100个代币
    
    // ============== 事件 ==============
    
    event Staked(address indexed user, uint256 amount, LockPeriod lockPeriod);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event EmergencyUnstaked(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event RewardsAdded(uint256 amount);
    
    // ============== 构造函数 ==============
    
    constructor(
        address _stakeToken,
        address _rewardToken,
        uint256 _rewardPerSecond
    ) {
        require(_stakeToken != address(0), "Invalid stake token");
        require(_rewardToken != address(0), "Invalid reward token");
        
        stakeToken = IERC20(_stakeToken);
        rewardToken = IERC20(_rewardToken);
        
        pool = PoolInfo({
            totalStaked: 0,
            rewardPerSecond: _rewardPerSecond,
            accRewardPerShare: 0,
            lastRewardTime: block.timestamp
        });
    }
    
    // ============== 质押函数 ==============
    
    /**
     * @notice 质押代币
     * @param _amount 质押数量
     * @param _lockPeriod 锁定期
     */
    function stake(uint256 _amount, LockPeriod _lockPeriod) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        require(_amount >= minStakeAmount, "Below minimum stake");
        
        _updatePool();
        
        StakeInfo storage userStake = stakes[msg.sender];
        
        // 如果已有质押，先结算奖励
        if (userStake.amount > 0) {
            uint256 pending = _calculatePending(msg.sender);
            userStake.pendingRewards += pending;
        }
        
        // 转入代币
        stakeToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        // 计算解锁时间
        uint256 lockDuration = _getLockDuration(_lockPeriod);
        
        // 更新质押信息
        userStake.amount += _amount;
        userStake.lockPeriod = _lockPeriod;
        userStake.stakeTime = block.timestamp;
        userStake.unlockTime = block.timestamp + lockDuration;
        userStake.rewardDebt = (userStake.amount * pool.accRewardPerShare) / PRECISION;
        
        pool.totalStaked += _amount;
        
        emit Staked(msg.sender, _amount, _lockPeriod);
    }
    
    /**
     * @notice 解除质押
     * @param _amount 解除数量
     */
    function unstake(uint256 _amount) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        
        require(userStake.amount >= _amount, "Insufficient stake");
        require(_amount > 0, "Invalid amount");
        
        // 检查锁定期 (灵活质押除外)
        if (userStake.lockPeriod != LockPeriod.Flexible) {
            require(block.timestamp >= userStake.unlockTime, "Still locked");
        }
        
        _updatePool();
        
        // 结算奖励
        uint256 pending = _calculatePending(msg.sender);
        userStake.pendingRewards += pending;
        
        // 更新质押信息
        userStake.amount -= _amount;
        userStake.rewardDebt = (userStake.amount * pool.accRewardPerShare) / PRECISION;
        
        pool.totalStaked -= _amount;
        
        // 转出代币
        stakeToken.safeTransfer(msg.sender, _amount);
        
        emit Unstaked(msg.sender, _amount);
    }
    
    /**
     * @notice 领取奖励
     */
    function claimRewards() external nonReentrant {
        _updatePool();
        
        StakeInfo storage userStake = stakes[msg.sender];
        
        uint256 pending = _calculatePending(msg.sender);
        uint256 totalRewards = userStake.pendingRewards + pending;
        
        require(totalRewards > 0, "No rewards");
        
        userStake.pendingRewards = 0;
        userStake.rewardDebt = (userStake.amount * pool.accRewardPerShare) / PRECISION;
        
        totalRewardsDistributed += totalRewards;
        
        rewardToken.safeTransfer(msg.sender, totalRewards);
        
        emit RewardsClaimed(msg.sender, totalRewards);
    }
    
    /**
     * @notice 紧急提取 (放弃奖励)
     */
    function emergencyUnstake() external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        
        uint256 amount = userStake.amount;
        require(amount > 0, "No stake");
        
        // 清空质押信息
        userStake.amount = 0;
        userStake.pendingRewards = 0;
        userStake.rewardDebt = 0;
        
        pool.totalStaked -= amount;
        
        // 转出代币
        stakeToken.safeTransfer(msg.sender, amount);
        
        emit EmergencyUnstaked(msg.sender, amount);
    }
    
    // ============== 内部函数 ==============
    
    function _updatePool() internal {
        if (block.timestamp <= pool.lastRewardTime) {
            return;
        }
        
        if (pool.totalStaked == 0) {
            pool.lastRewardTime = block.timestamp;
            return;
        }
        
        uint256 timeElapsed = block.timestamp - pool.lastRewardTime;
        uint256 reward = timeElapsed * pool.rewardPerSecond;
        
        pool.accRewardPerShare += (reward * PRECISION) / pool.totalStaked;
        pool.lastRewardTime = block.timestamp;
    }
    
    function _calculatePending(address _user) internal view returns (uint256) {
        StakeInfo storage userStake = stakes[_user];
        
        if (userStake.amount == 0) {
            return 0;
        }
        
        uint256 accRewardPerShare = pool.accRewardPerShare;
        
        if (block.timestamp > pool.lastRewardTime && pool.totalStaked > 0) {
            uint256 timeElapsed = block.timestamp - pool.lastRewardTime;
            uint256 reward = timeElapsed * pool.rewardPerSecond;
            accRewardPerShare += (reward * PRECISION) / pool.totalStaked;
        }
        
        uint256 baseReward = (userStake.amount * accRewardPerShare) / PRECISION - userStake.rewardDebt;
        
        // 应用锁定期倍数
        uint256 multiplier = _getRewardMultiplier(userStake.lockPeriod);
        
        return (baseReward * multiplier) / 100;
    }
    
    function _getLockDuration(LockPeriod _period) internal pure returns (uint256) {
        if (_period == LockPeriod.Flexible) return 0;
        if (_period == LockPeriod.ThirtyDays) return THIRTY_DAYS;
        if (_period == LockPeriod.NinetyDays) return NINETY_DAYS;
        if (_period == LockPeriod.OneEightyDays) return ONE_EIGHTY_DAYS;
        if (_period == LockPeriod.ThreeSixtyFiveDays) return THREE_SIXTY_FIVE_DAYS;
        return 0;
    }
    
    function _getRewardMultiplier(LockPeriod _period) internal pure returns (uint256) {
        if (_period == LockPeriod.Flexible) return 100;           // 1x (5% APY)
        if (_period == LockPeriod.ThirtyDays) return 240;         // 2.4x (12% APY)
        if (_period == LockPeriod.NinetyDays) return 400;         // 4x (20% APY)
        if (_period == LockPeriod.OneEightyDays) return 700;      // 7x (35% APY)
        if (_period == LockPeriod.ThreeSixtyFiveDays) return 1000; // 10x (50% APY)
        return 100;
    }
    
    // ============== 管理函数 ==============
    
    /**
     * @notice 添加奖励到池子
     */
    function addRewards(uint256 _amount) external onlyOwner {
        rewardToken.safeTransferFrom(msg.sender, address(this), _amount);
        emit RewardsAdded(_amount);
    }
    
    /**
     * @notice 更新奖励率
     */
    function setRewardPerSecond(uint256 _rewardPerSecond) external onlyOwner {
        _updatePool();
        uint256 oldRate = pool.rewardPerSecond;
        pool.rewardPerSecond = _rewardPerSecond;
        emit RewardRateUpdated(oldRate, _rewardPerSecond);
    }
    
    /**
     * @notice 设置最小质押数量
     */
    function setMinStakeAmount(uint256 _minAmount) external onlyOwner {
        minStakeAmount = _minAmount;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice 紧急提取奖励代币 (仅限紧急情况)
     */
    function emergencyWithdrawRewards(uint256 _amount) external onlyOwner {
        rewardToken.safeTransfer(msg.sender, _amount);
    }
    
    // ============== 查询函数 ==============
    
    /**
     * @notice 获取用户待领取奖励
     */
    function pendingRewards(address _user) external view returns (uint256) {
        StakeInfo storage userStake = stakes[_user];
        return userStake.pendingRewards + _calculatePending(_user);
    }
    
    /**
     * @notice 获取用户质押信息
     */
    function getUserStake(address _user) external view returns (
        uint256 amount,
        LockPeriod lockPeriod,
        uint256 stakeTime,
        uint256 unlockTime,
        uint256 pending
    ) {
        StakeInfo storage userStake = stakes[_user];
        return (
            userStake.amount,
            userStake.lockPeriod,
            userStake.stakeTime,
            userStake.unlockTime,
            userStake.pendingRewards + _calculatePending(_user)
        );
    }
    
    /**
     * @notice 获取池子信息
     */
    function getPoolInfo() external view returns (
        uint256 totalStaked,
        uint256 rewardPerSecond,
        uint256 totalDistributed
    ) {
        return (
            pool.totalStaked,
            pool.rewardPerSecond,
            totalRewardsDistributed
        );
    }
    
    /**
     * @notice 获取锁定期对应的APY
     */
    function getAPY(LockPeriod _period) external pure returns (uint256) {
        if (_period == LockPeriod.Flexible) return 5;
        if (_period == LockPeriod.ThirtyDays) return 12;
        if (_period == LockPeriod.NinetyDays) return 20;
        if (_period == LockPeriod.OneEightyDays) return 35;
        if (_period == LockPeriod.ThreeSixtyFiveDays) return 50;
        return 0;
    }
}
