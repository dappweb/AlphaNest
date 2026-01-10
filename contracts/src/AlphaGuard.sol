// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AlphaGuard
 * @notice 参数化保险协议 - 用于 Meme 代币 Rug Pull 保护
 * @dev 用户可以购买保险对赌代币是否会 Rug
 * 
 * 机制:
 * 1. 用户选择代币并选择立场 (Rug/Safe)
 * 2. 支付保费进入资金池
 * 3. 到期后根据预言机判定结果
 * 4. 胜者按比例分配资金池
 */
contract AlphaGuard is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============================================
    // 类型定义
    // ============================================
    
    enum Position { RUG, SAFE }
    enum PoolStatus { ACTIVE, RESOLVED, CANCELLED }
    enum Outcome { PENDING, RUGGED, SAFE, CANCELLED }

    struct InsurancePool {
        address token;              // 被保险的代币地址
        uint256 totalRugBets;       // Rug 方总投注
        uint256 totalSafeBets;      // Safe 方总投注
        uint256 createdAt;          // 创建时间
        uint256 expiresAt;          // 到期时间
        uint256 resolvedAt;         // 结算时间
        PoolStatus status;          // 池状态
        Outcome outcome;            // 结果
        uint256 minBet;             // 最小投注
        uint256 maxBet;             // 最大投注
    }

    struct Policy {
        uint256 poolId;             // 所属池 ID
        address holder;             // 持有人
        Position position;          // 立场
        uint256 amount;             // 投注金额
        uint256 createdAt;          // 创建时间
        bool claimed;               // 是否已领取
    }

    // ============================================
    // 状态变量
    // ============================================

    IERC20 public paymentToken;     // 支付代币 (USDC/ETH)
    address public oracle;          // 预言机地址
    
    uint256 public protocolFeeRate; // 协议费率 (basis points, 100 = 1%)
    uint256 public minPoolDuration; // 最小池持续时间
    uint256 public maxPoolDuration; // 最大池持续时间
    
    uint256 public poolCounter;     // 池计数器
    uint256 public policyCounter;   // 保单计数器
    
    mapping(uint256 => InsurancePool) public pools;
    mapping(uint256 => Policy) public policies;
    mapping(address => uint256[]) public userPolicies;
    mapping(uint256 => uint256[]) public poolPolicies;
    
    uint256 public totalProtocolFees;
    
    // ============================================
    // 事件
    // ============================================

    event PoolCreated(
        uint256 indexed poolId,
        address indexed token,
        uint256 expiresAt,
        uint256 minBet,
        uint256 maxBet
    );
    
    event PolicyPurchased(
        uint256 indexed policyId,
        uint256 indexed poolId,
        address indexed holder,
        Position position,
        uint256 amount
    );
    
    event PoolResolved(
        uint256 indexed poolId,
        Outcome outcome,
        uint256 totalPayout
    );
    
    event PolicyClaimed(
        uint256 indexed policyId,
        address indexed holder,
        uint256 payout
    );
    
    event PoolCancelled(uint256 indexed poolId);
    event OracleUpdated(address indexed newOracle);
    event FeeRateUpdated(uint256 newRate);

    // ============================================
    // 修饰符
    // ============================================

    modifier onlyOracle() {
        require(msg.sender == oracle, "Only oracle");
        _;
    }

    modifier poolExists(uint256 poolId) {
        require(poolId < poolCounter, "Pool not found");
        _;
    }

    modifier poolActive(uint256 poolId) {
        require(pools[poolId].status == PoolStatus.ACTIVE, "Pool not active");
        require(block.timestamp < pools[poolId].expiresAt, "Pool expired");
        _;
    }

    // ============================================
    // 构造函数
    // ============================================

    constructor(
        address _paymentToken,
        address _oracle,
        uint256 _protocolFeeRate
    ) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
        oracle = _oracle;
        protocolFeeRate = _protocolFeeRate;
        minPoolDuration = 1 hours;
        maxPoolDuration = 7 days;
    }

    // ============================================
    // 管理函数
    // ============================================

    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid oracle");
        oracle = _oracle;
        emit OracleUpdated(_oracle);
    }

    function setFeeRate(uint256 _rate) external onlyOwner {
        require(_rate <= 1000, "Fee too high"); // max 10%
        protocolFeeRate = _rate;
        emit FeeRateUpdated(_rate);
    }

    function setPoolDurationLimits(uint256 _min, uint256 _max) external onlyOwner {
        require(_min < _max, "Invalid limits");
        minPoolDuration = _min;
        maxPoolDuration = _max;
    }

    function withdrawFees(address to) external onlyOwner {
        uint256 amount = totalProtocolFees;
        totalProtocolFees = 0;
        paymentToken.safeTransfer(to, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ============================================
    // 核心函数
    // ============================================

    /**
     * @notice 创建新的保险池
     * @param token 被保险的代币地址
     * @param duration 持续时间（秒）
     * @param minBet 最小投注金额
     * @param maxBet 最大投注金额
     */
    function createPool(
        address token,
        uint256 duration,
        uint256 minBet,
        uint256 maxBet
    ) external onlyOwner returns (uint256 poolId) {
        require(token != address(0), "Invalid token");
        require(duration >= minPoolDuration && duration <= maxPoolDuration, "Invalid duration");
        require(minBet > 0 && maxBet >= minBet, "Invalid bet limits");

        poolId = poolCounter++;
        
        pools[poolId] = InsurancePool({
            token: token,
            totalRugBets: 0,
            totalSafeBets: 0,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + duration,
            resolvedAt: 0,
            status: PoolStatus.ACTIVE,
            outcome: Outcome.PENDING,
            minBet: minBet,
            maxBet: maxBet
        });

        emit PoolCreated(poolId, token, block.timestamp + duration, minBet, maxBet);
    }

    /**
     * @notice 购买保险
     * @param poolId 池 ID
     * @param position 立场 (RUG/SAFE)
     * @param amount 投注金额
     */
    function purchasePolicy(
        uint256 poolId,
        Position position,
        uint256 amount
    ) external nonReentrant whenNotPaused poolExists(poolId) poolActive(poolId) returns (uint256 policyId) {
        InsurancePool storage pool = pools[poolId];
        
        require(amount >= pool.minBet && amount <= pool.maxBet, "Invalid amount");
        
        // 转入资金
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // 更新池统计
        if (position == Position.RUG) {
            pool.totalRugBets += amount;
        } else {
            pool.totalSafeBets += amount;
        }
        
        // 创建保单
        policyId = policyCounter++;
        
        policies[policyId] = Policy({
            poolId: poolId,
            holder: msg.sender,
            position: position,
            amount: amount,
            createdAt: block.timestamp,
            claimed: false
        });
        
        userPolicies[msg.sender].push(policyId);
        poolPolicies[poolId].push(policyId);

        emit PolicyPurchased(policyId, poolId, msg.sender, position, amount);
    }

    /**
     * @notice 预言机结算池结果
     * @param poolId 池 ID
     * @param outcome 结果
     */
    function resolvePool(
        uint256 poolId,
        Outcome outcome
    ) external onlyOracle poolExists(poolId) {
        InsurancePool storage pool = pools[poolId];
        
        require(pool.status == PoolStatus.ACTIVE, "Pool not active");
        require(block.timestamp >= pool.expiresAt, "Pool not expired");
        require(outcome == Outcome.RUGGED || outcome == Outcome.SAFE, "Invalid outcome");
        
        pool.status = PoolStatus.RESOLVED;
        pool.outcome = outcome;
        pool.resolvedAt = block.timestamp;
        
        uint256 totalPool = pool.totalRugBets + pool.totalSafeBets;
        uint256 protocolFee = (totalPool * protocolFeeRate) / 10000;
        totalProtocolFees += protocolFee;

        emit PoolResolved(poolId, outcome, totalPool - protocolFee);
    }

    /**
     * @notice 取消池（紧急情况）
     * @param poolId 池 ID
     */
    function cancelPool(uint256 poolId) external onlyOwner poolExists(poolId) {
        InsurancePool storage pool = pools[poolId];
        require(pool.status == PoolStatus.ACTIVE, "Pool not active");
        
        pool.status = PoolStatus.CANCELLED;
        pool.outcome = Outcome.CANCELLED;
        pool.resolvedAt = block.timestamp;

        emit PoolCancelled(poolId);
    }

    /**
     * @notice 领取赔付
     * @param policyId 保单 ID
     */
    function claimPayout(uint256 policyId) external nonReentrant {
        Policy storage policy = policies[policyId];
        
        require(policy.holder == msg.sender, "Not policy holder");
        require(!policy.claimed, "Already claimed");
        
        InsurancePool storage pool = pools[policy.poolId];
        require(pool.status != PoolStatus.ACTIVE, "Pool still active");
        
        policy.claimed = true;
        
        uint256 payout = calculatePayout(policyId);
        require(payout > 0, "No payout");
        
        paymentToken.safeTransfer(msg.sender, payout);

        emit PolicyClaimed(policyId, msg.sender, payout);
    }

    // ============================================
    // 视图函数
    // ============================================

    /**
     * @notice 计算保单赔付金额
     */
    function calculatePayout(uint256 policyId) public view returns (uint256) {
        Policy storage policy = policies[policyId];
        InsurancePool storage pool = pools[policy.poolId];
        
        // 取消的池退还本金
        if (pool.outcome == Outcome.CANCELLED) {
            return policy.amount;
        }
        
        // 池未结算
        if (pool.status != PoolStatus.RESOLVED) {
            return 0;
        }
        
        // 判断是否获胜
        bool isWinner = (pool.outcome == Outcome.RUGGED && policy.position == Position.RUG) ||
                       (pool.outcome == Outcome.SAFE && policy.position == Position.SAFE);
        
        if (!isWinner) {
            return 0;
        }
        
        // 计算赔付
        uint256 totalPool = pool.totalRugBets + pool.totalSafeBets;
        uint256 protocolFee = (totalPool * protocolFeeRate) / 10000;
        uint256 payoutPool = totalPool - protocolFee;
        
        uint256 winnerPool = pool.outcome == Outcome.RUGGED ? pool.totalRugBets : pool.totalSafeBets;
        
        return (policy.amount * payoutPool) / winnerPool;
    }

    /**
     * @notice 获取池当前赔率
     */
    function getPoolOdds(uint256 poolId) external view poolExists(poolId) returns (
        uint256 rugOdds,
        uint256 safeOdds
    ) {
        InsurancePool storage pool = pools[poolId];
        uint256 total = pool.totalRugBets + pool.totalSafeBets;
        
        if (total == 0) {
            return (10000, 10000); // 1:1
        }
        
        // 赔率 = 总池 / 该方投注 (basis points)
        rugOdds = pool.totalRugBets > 0 ? (total * 10000) / pool.totalRugBets : 0;
        safeOdds = pool.totalSafeBets > 0 ? (total * 10000) / pool.totalSafeBets : 0;
    }

    /**
     * @notice 获取用户保单列表
     */
    function getUserPolicies(address user) external view returns (uint256[] memory) {
        return userPolicies[user];
    }

    /**
     * @notice 获取池保单列表
     */
    function getPoolPolicies(uint256 poolId) external view returns (uint256[] memory) {
        return poolPolicies[poolId];
    }

    /**
     * @notice 获取池信息
     */
    function getPoolInfo(uint256 poolId) external view poolExists(poolId) returns (
        address token,
        uint256 totalRugBets,
        uint256 totalSafeBets,
        uint256 expiresAt,
        PoolStatus status,
        Outcome outcome
    ) {
        InsurancePool storage pool = pools[poolId];
        return (
            pool.token,
            pool.totalRugBets,
            pool.totalSafeBets,
            pool.expiresAt,
            pool.status,
            pool.outcome
        );
    }
}
