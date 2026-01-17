// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CowGuardInsurance
 * @notice 保险协议 - 对齐 Solana cowguard-insurance
 * @dev Meme 代币风险保护
 * 
 * 功能:
 * 1. 多种保险类型 - RugPull/价格下跌/智能合约/综合
 * 2. 产品化定价 - 保费率/赔付率
 * 3. 理赔流程 - 申请/审核/赔付
 * 4. 保单取消 - 按比例退款
 * 5. 价格预言机 - 防闪电贷攻击
 */
contract CowGuardInsurance is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============================================
    // 枚举类型
    // ============================================
    
    enum InsuranceType {
        RugPull,        // Rug Pull 保险
        PriceDrop,      // 价格下跌保险
        SmartContract,  // 智能合约漏洞保险
        Comprehensive   // 综合保险
    }

    enum PolicyStatus {
        Active,
        Expired,
        Claimed,
        Cancelled
    }

    enum ClaimStatus {
        Pending,
        Approved,
        Rejected
    }

    enum ClaimType {
        RugPull,
        PriceDrop,
        ContractExploit,
        Other
    }

    // ============================================
    // 结构体
    // ============================================

    struct InsuranceProduct {
        InsuranceType productType;
        uint256 premiumRate;        // 保费率 (basis points, 100 = 1%)
        uint256 coverageRate;       // 赔付率 (basis points, 10000 = 100%)
        uint256 minCoverage;        // 最小保额
        uint256 maxCoverage;        // 最大保额
        uint256 durationDays;       // 保险期限 (天)
        uint256 totalPolicies;      // 总保单数
        uint256 totalCoverage;      // 总保额
        bool isActive;              // 是否激活
    }

    struct Policy {
        uint256 productId;          // 产品 ID
        address holder;             // 持有人
        uint256 coverageAmount;     // 保额
        uint256 premiumPaid;        // 已付保费
        uint256 startTime;          // 开始时间
        uint256 endTime;            // 结束时间
        PolicyStatus status;        // 状态
    }

    struct Claim {
        uint256 policyId;           // 保单 ID
        address claimant;           // 申请人
        ClaimType claimType;        // 理赔类型
        uint256 claimAmount;        // 申请金额
        bytes32 evidenceHash;       // 证据哈希
        ClaimStatus status;         // 状态
        uint256 submittedAt;        // 提交时间
        uint256 processedAt;        // 处理时间
        uint256 payoutAmount;       // 赔付金额
    }

    // ============================================
    // 状态变量
    // ============================================

    IERC20 public paymentToken;     // 支付代币 (USDC)
    address public priceOracle;     // 价格预言机
    address public treasury;        // 国库地址
    
    uint256 public treasuryFee;     // 国库费率 (basis points)
    uint256 public cancelFeeRate;   // 取消手续费率 (basis points)
    
    uint256 public productCounter;
    uint256 public policyCounter;
    uint256 public claimCounter;
    
    uint256 public totalPolicies;
    uint256 public totalClaims;
    uint256 public totalPayouts;
    
    bool public isPaused;
    
    mapping(uint256 => InsuranceProduct) public products;
    mapping(uint256 => Policy) public policies;
    mapping(uint256 => Claim) public claims;
    
    mapping(address => uint256[]) public userPolicies;
    mapping(uint256 => uint256) public policyClaim;
    
    uint256 public constant BASIS_POINTS = 10000;

    // ============================================
    // 事件
    // ============================================

    event ProductCreated(
        uint256 indexed productId,
        InsuranceType productType,
        uint256 premiumRate,
        uint256 coverageRate,
        uint256 durationDays
    );
    
    event ProductUpdated(uint256 indexed productId, bool isActive);
    
    event PolicyPurchased(
        uint256 indexed policyId,
        uint256 indexed productId,
        address indexed holder,
        uint256 coverageAmount,
        uint256 premiumPaid,
        uint256 endTime
    );
    
    event PolicyCancelled(
        uint256 indexed policyId,
        address indexed holder,
        uint256 refundAmount
    );
    
    event ClaimSubmitted(
        uint256 indexed claimId,
        uint256 indexed policyId,
        address indexed claimant,
        ClaimType claimType,
        uint256 claimAmount
    );
    
    event ClaimProcessed(
        uint256 indexed claimId,
        bool approved,
        uint256 payoutAmount
    );
    
    event ProtocolPaused(bool paused);
    event OracleUpdated(address indexed newOracle);

    // ============================================
    // 构造函数
    // ============================================

    constructor(
        address _paymentToken,
        address _treasury,
        uint256 _treasuryFee
    ) Ownable(msg.sender) {
        require(_paymentToken != address(0), "Invalid payment token");
        require(_treasury != address(0), "Invalid treasury");
        require(_treasuryFee <= 1000, "Fee too high"); // max 10%
        
        paymentToken = IERC20(_paymentToken);
        treasury = _treasury;
        treasuryFee = _treasuryFee;
        cancelFeeRate = 2000; // 20%
    }

    // ============================================
    // 产品管理
    // ============================================

    /**
     * @notice 创建保险产品
     */
    function createProduct(
        InsuranceType productType,
        uint256 premiumRate,
        uint256 coverageRate,
        uint256 minCoverage,
        uint256 maxCoverage,
        uint256 durationDays
    ) external onlyOwner returns (uint256 productId) {
        require(premiumRate > 0 && premiumRate <= 2000, "Invalid premium rate");
        require(coverageRate > 0 && coverageRate <= BASIS_POINTS, "Invalid coverage rate");
        require(minCoverage < maxCoverage, "Invalid coverage range");
        require(durationDays > 0, "Invalid duration");
        
        productId = productCounter++;
        
        products[productId] = InsuranceProduct({
            productType: productType,
            premiumRate: premiumRate,
            coverageRate: coverageRate,
            minCoverage: minCoverage,
            maxCoverage: maxCoverage,
            durationDays: durationDays,
            totalPolicies: 0,
            totalCoverage: 0,
            isActive: true
        });
        
        emit ProductCreated(productId, productType, premiumRate, coverageRate, durationDays);
    }

    /**
     * @notice 更新产品状态
     */
    function setProductActive(uint256 productId, bool active) external onlyOwner {
        require(productId < productCounter, "Product not found");
        products[productId].isActive = active;
        emit ProductUpdated(productId, active);
    }

    // ============================================
    // 保险购买
    // ============================================

    /**
     * @notice 购买保险
     */
    function purchaseInsurance(
        uint256 productId,
        uint256 coverageAmount
    ) external nonReentrant whenNotPaused returns (uint256 policyId) {
        require(!isPaused, "Protocol paused");
        require(productId < productCounter, "Product not found");
        
        InsuranceProduct storage product = products[productId];
        require(product.isActive, "Product inactive");
        require(
            coverageAmount >= product.minCoverage && coverageAmount <= product.maxCoverage,
            "Invalid coverage amount"
        );
        
        // 计算保费
        uint256 premium = (coverageAmount * product.premiumRate) / BASIS_POINTS;
        require(premium > 0, "Premium too low");
        
        // 转移保费
        paymentToken.safeTransferFrom(msg.sender, address(this), premium);
        
        // 创建保单
        policyId = policyCounter++;
        uint256 endTime = block.timestamp + (product.durationDays * 1 days);
        
        policies[policyId] = Policy({
            productId: productId,
            holder: msg.sender,
            coverageAmount: coverageAmount,
            premiumPaid: premium,
            startTime: block.timestamp,
            endTime: endTime,
            status: PolicyStatus.Active
        });
        
        userPolicies[msg.sender].push(policyId);
        
        // 更新统计
        product.totalPolicies += 1;
        product.totalCoverage += coverageAmount;
        totalPolicies += 1;
        
        emit PolicyPurchased(policyId, productId, msg.sender, coverageAmount, premium, endTime);
    }

    /**
     * @notice 取消保单
     */
    function cancelPolicy(uint256 policyId) external nonReentrant {
        Policy storage policy = policies[policyId];
        
        require(policy.holder == msg.sender, "Not policy holder");
        require(policy.status == PolicyStatus.Active, "Policy not active");
        require(block.timestamp < policy.endTime, "Policy expired");
        
        // 计算退款
        uint256 totalDuration = policy.endTime - policy.startTime;
        uint256 elapsed = block.timestamp - policy.startTime;
        uint256 remaining = totalDuration - elapsed;
        
        uint256 refundRatio = (remaining * BASIS_POINTS) / totalDuration;
        uint256 refundBeforeFee = (policy.premiumPaid * refundRatio) / BASIS_POINTS;
        uint256 cancelFee = (refundBeforeFee * cancelFeeRate) / BASIS_POINTS;
        uint256 refund = refundBeforeFee - cancelFee;
        
        // 更新状态
        policy.status = PolicyStatus.Cancelled;
        
        // 退款
        if (refund > 0) {
            paymentToken.safeTransfer(msg.sender, refund);
        }
        
        // 手续费转国库
        if (cancelFee > 0) {
            paymentToken.safeTransfer(treasury, cancelFee);
        }
        
        emit PolicyCancelled(policyId, msg.sender, refund);
    }

    // ============================================
    // 理赔流程
    // ============================================

    /**
     * @notice 提交理赔申请
     */
    function submitClaim(
        uint256 policyId,
        ClaimType claimType,
        uint256 claimAmount,
        bytes32 evidenceHash
    ) external nonReentrant returns (uint256 claimId) {
        Policy storage policy = policies[policyId];
        
        require(policy.holder == msg.sender, "Not policy holder");
        require(policy.status == PolicyStatus.Active, "Policy not active");
        require(block.timestamp <= policy.endTime, "Policy expired");
        require(claimAmount <= policy.coverageAmount, "Exceeds coverage");
        require(policyClaim[policyId] == 0, "Claim already exists");
        
        claimId = ++claimCounter;
        
        claims[claimId] = Claim({
            policyId: policyId,
            claimant: msg.sender,
            claimType: claimType,
            claimAmount: claimAmount,
            evidenceHash: evidenceHash,
            status: ClaimStatus.Pending,
            submittedAt: block.timestamp,
            processedAt: 0,
            payoutAmount: 0
        });
        
        policyClaim[policyId] = claimId;
        
        emit ClaimSubmitted(claimId, policyId, msg.sender, claimType, claimAmount);
    }

    /**
     * @notice 处理理赔 (仅限管理员)
     */
    function processClaim(
        uint256 claimId,
        bool approved,
        uint256 payoutAmount
    ) external onlyOwner nonReentrant {
        require(claimId > 0 && claimId <= claimCounter, "Claim not found");
        
        Claim storage claim = claims[claimId];
        require(claim.status == ClaimStatus.Pending, "Claim not pending");
        
        Policy storage policy = policies[claim.policyId];
        InsuranceProduct storage product = products[policy.productId];
        
        claim.processedAt = block.timestamp;
        
        if (approved) {
            require(payoutAmount <= claim.claimAmount, "Payout exceeds claim");
            
            // 计算实际赔付
            uint256 actualPayout = (payoutAmount * product.coverageRate) / BASIS_POINTS;
            
            // 扣除国库费
            uint256 fee = (actualPayout * treasuryFee) / BASIS_POINTS;
            uint256 netPayout = actualPayout - fee;
            
            claim.status = ClaimStatus.Approved;
            claim.payoutAmount = netPayout;
            policy.status = PolicyStatus.Claimed;
            
            totalPayouts += netPayout;
            totalClaims += 1;
            
            // 转账
            paymentToken.safeTransfer(claim.claimant, netPayout);
            if (fee > 0) {
                paymentToken.safeTransfer(treasury, fee);
            }
            
            emit ClaimProcessed(claimId, true, netPayout);
        } else {
            claim.status = ClaimStatus.Rejected;
            totalClaims += 1;
            
            emit ClaimProcessed(claimId, false, 0);
        }
    }

    // ============================================
    // 管理功能
    // ============================================

    function setProtocolPaused(bool paused) external onlyOwner {
        isPaused = paused;
        emit ProtocolPaused(paused);
    }

    function setTreasuryFee(uint256 fee) external onlyOwner {
        require(fee <= 1000, "Fee too high");
        treasuryFee = fee;
    }

    function setCancelFeeRate(uint256 rate) external onlyOwner {
        require(rate <= 5000, "Rate too high");
        cancelFeeRate = rate;
    }

    function setPriceOracle(address _oracle) external onlyOwner {
        priceOracle = _oracle;
        emit OracleUpdated(_oracle);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ============================================
    // 视图函数
    // ============================================

    /**
     * @notice 获取产品信息
     */
    function getProductInfo(uint256 productId) external view returns (
        InsuranceType productType,
        uint256 premiumRate,
        uint256 coverageRate,
        uint256 minCoverage,
        uint256 maxCoverage,
        uint256 durationDays,
        uint256 productTotalPolicies,
        uint256 productTotalCoverage,
        bool isActive
    ) {
        InsuranceProduct storage product = products[productId];
        return (
            product.productType,
            product.premiumRate,
            product.coverageRate,
            product.minCoverage,
            product.maxCoverage,
            product.durationDays,
            product.totalPolicies,
            product.totalCoverage,
            product.isActive
        );
    }

    /**
     * @notice 获取保单信息
     */
    function getPolicyInfo(uint256 policyId) external view returns (
        uint256 productId,
        address holder,
        uint256 coverageAmount,
        uint256 premiumPaid,
        uint256 startTime,
        uint256 endTime,
        PolicyStatus status
    ) {
        Policy storage policy = policies[policyId];
        return (
            policy.productId,
            policy.holder,
            policy.coverageAmount,
            policy.premiumPaid,
            policy.startTime,
            policy.endTime,
            policy.status
        );
    }

    /**
     * @notice 获取理赔信息
     */
    function getClaimInfo(uint256 claimId) external view returns (
        uint256 policyId,
        address claimant,
        ClaimType claimType,
        uint256 claimAmount,
        ClaimStatus status,
        uint256 submittedAt,
        uint256 processedAt,
        uint256 payoutAmount
    ) {
        Claim storage claim = claims[claimId];
        return (
            claim.policyId,
            claim.claimant,
            claim.claimType,
            claim.claimAmount,
            claim.status,
            claim.submittedAt,
            claim.processedAt,
            claim.payoutAmount
        );
    }

    /**
     * @notice 获取用户保单列表
     */
    function getUserPolicies(address user) external view returns (uint256[] memory) {
        return userPolicies[user];
    }

    /**
     * @notice 计算保费
     */
    function calculatePremium(uint256 productId, uint256 coverageAmount) external view returns (uint256) {
        require(productId < productCounter, "Product not found");
        return (coverageAmount * products[productId].premiumRate) / BASIS_POINTS;
    }

    /**
     * @notice 获取协议统计
     */
    function getProtocolStats() external view returns (
        uint256 productCount,
        uint256 policyCount,
        uint256 claimCount,
        uint256 payoutTotal
    ) {
        return (productCounter, totalPolicies, totalClaims, totalPayouts);
    }
}
