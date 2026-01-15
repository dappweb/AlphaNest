// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CowGuard Insurance
 * @notice 去中心化保险协议，保护用户免受 Rug Pull 等风险
 * @dev 支持多种保险类型和理赔机制
 */
contract CowGuardInsurance is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ============== 枚举类型 ==============
    
    enum InsuranceType { RugPull, PriceDrop, SmartContract, Comprehensive }
    enum PolicyStatus { Active, Expired, Claimed, Cancelled }
    enum ClaimStatus { Pending, Approved, Rejected }
    
    // ============== 结构体 ==============
    
    struct InsuranceProduct {
        InsuranceType productType;
        uint256 premiumRate;      // 保费率 (basis points)
        uint256 coverageRate;     // 赔付率 (basis points, 10000 = 100%)
        uint256 minCoverage;      // 最小保额
        uint256 maxCoverage;      // 最大保额
        uint256 durationDays;     // 保险期限 (天)
        uint256 totalPolicies;    // 总保单数
        uint256 totalCoverage;    // 总保额
        bool isActive;            // 是否激活
    }
    
    struct Policy {
        address owner;
        uint256 productId;
        uint256 coverageAmount;
        uint256 premiumPaid;
        uint256 startTime;
        uint256 endTime;
        address[] coveredTokens;
        PolicyStatus status;
    }
    
    struct Claim {
        uint256 policyId;
        address claimant;
        uint256 claimAmount;
        bytes32 evidenceHash;
        ClaimStatus status;
        uint256 submittedAt;
        uint256 processedAt;
        uint256 payoutAmount;
    }
    
    // ============== 状态变量 ==============
    
    IERC20 public paymentToken;      // 支付代币 (POPCOW 或 USDC)
    address public treasury;          // 国库地址
    address public insurancePool;     // 保险池地址
    uint256 public treasuryFee = 1000; // 国库费率 10%
    
    uint256 public productCount;
    uint256 public policyCount;
    uint256 public claimCount;
    
    uint256 public totalPremiumsCollected;
    uint256 public totalClaimsPaid;
    
    mapping(uint256 => InsuranceProduct) public products;
    mapping(uint256 => Policy) public policies;
    mapping(uint256 => Claim) public claims;
    mapping(address => uint256[]) public userPolicies;
    mapping(uint256 => uint256) public policyToClaim;
    
    // ============== 事件 ==============
    
    event ProductCreated(uint256 indexed productId, InsuranceType productType);
    event ProductUpdated(uint256 indexed productId, bool isActive);
    event PolicyPurchased(uint256 indexed policyId, address indexed owner, uint256 coverageAmount);
    event PolicyCancelled(uint256 indexed policyId, uint256 refundAmount);
    event ClaimSubmitted(uint256 indexed claimId, uint256 indexed policyId, uint256 claimAmount);
    event ClaimProcessed(uint256 indexed claimId, ClaimStatus status, uint256 payoutAmount);
    
    // ============== 构造函数 ==============
    
    constructor(
        address _paymentToken,
        address _treasury,
        address _insurancePool
    ) {
        require(_paymentToken != address(0), "Invalid payment token");
        require(_treasury != address(0), "Invalid treasury");
        require(_insurancePool != address(0), "Invalid insurance pool");
        
        paymentToken = IERC20(_paymentToken);
        treasury = _treasury;
        insurancePool = _insurancePool;
    }
    
    // ============== 产品管理 ==============
    
    /**
     * @notice 创建保险产品
     */
    function createProduct(
        InsuranceType _productType,
        uint256 _premiumRate,
        uint256 _coverageRate,
        uint256 _minCoverage,
        uint256 _maxCoverage,
        uint256 _durationDays
    ) external onlyOwner {
        require(_premiumRate > 0 && _premiumRate <= 2000, "Invalid premium rate");
        require(_coverageRate > 0 && _coverageRate <= 10000, "Invalid coverage rate");
        require(_minCoverage < _maxCoverage, "Invalid coverage range");
        require(_durationDays > 0 && _durationDays <= 365, "Invalid duration");
        
        uint256 productId = productCount++;
        
        products[productId] = InsuranceProduct({
            productType: _productType,
            premiumRate: _premiumRate,
            coverageRate: _coverageRate,
            minCoverage: _minCoverage,
            maxCoverage: _maxCoverage,
            durationDays: _durationDays,
            totalPolicies: 0,
            totalCoverage: 0,
            isActive: true
        });
        
        emit ProductCreated(productId, _productType);
    }
    
    /**
     * @notice 更新产品状态
     */
    function setProductActive(uint256 _productId, bool _isActive) external onlyOwner {
        require(_productId < productCount, "Product not found");
        products[_productId].isActive = _isActive;
        emit ProductUpdated(_productId, _isActive);
    }
    
    // ============== 保险购买 ==============
    
    /**
     * @notice 购买保险
     */
    function purchaseInsurance(
        uint256 _productId,
        uint256 _coverageAmount,
        address[] calldata _coveredTokens
    ) external whenNotPaused nonReentrant returns (uint256) {
        InsuranceProduct storage product = products[_productId];
        
        require(product.isActive, "Product not active");
        require(
            _coverageAmount >= product.minCoverage && 
            _coverageAmount <= product.maxCoverage,
            "Invalid coverage amount"
        );
        require(_coveredTokens.length > 0 && _coveredTokens.length <= 10, "Invalid tokens");
        
        // 计算保费
        uint256 premium = (_coverageAmount * product.premiumRate) / 10000;
        
        // 收取保费
        uint256 treasuryAmount = (premium * treasuryFee) / 10000;
        uint256 poolAmount = premium - treasuryAmount;
        
        paymentToken.safeTransferFrom(msg.sender, treasury, treasuryAmount);
        paymentToken.safeTransferFrom(msg.sender, insurancePool, poolAmount);
        
        // 创建保单
        uint256 policyId = policyCount++;
        
        policies[policyId] = Policy({
            owner: msg.sender,
            productId: _productId,
            coverageAmount: _coverageAmount,
            premiumPaid: premium,
            startTime: block.timestamp,
            endTime: block.timestamp + (product.durationDays * 1 days),
            coveredTokens: _coveredTokens,
            status: PolicyStatus.Active
        });
        
        userPolicies[msg.sender].push(policyId);
        
        // 更新统计
        product.totalPolicies++;
        product.totalCoverage += _coverageAmount;
        totalPremiumsCollected += premium;
        
        emit PolicyPurchased(policyId, msg.sender, _coverageAmount);
        
        return policyId;
    }
    
    /**
     * @notice 取消保单 (仅限未过期且未理赔)
     */
    function cancelPolicy(uint256 _policyId) external nonReentrant {
        Policy storage policy = policies[_policyId];
        
        require(policy.owner == msg.sender, "Not policy owner");
        require(policy.status == PolicyStatus.Active, "Policy not active");
        require(block.timestamp < policy.endTime, "Policy expired");
        
        // 计算退款 (按剩余时间比例，扣除20%手续费)
        uint256 totalDuration = policy.endTime - policy.startTime;
        uint256 elapsed = block.timestamp - policy.startTime;
        uint256 remainingRatio = ((totalDuration - elapsed) * 10000) / totalDuration;
        uint256 refund = (policy.premiumPaid * remainingRatio * 80) / (10000 * 100);
        
        policy.status = PolicyStatus.Cancelled;
        
        // 从保险池退款
        paymentToken.safeTransferFrom(insurancePool, msg.sender, refund);
        
        emit PolicyCancelled(_policyId, refund);
    }
    
    // ============== 理赔管理 ==============
    
    /**
     * @notice 提交理赔申请
     */
    function submitClaim(
        uint256 _policyId,
        uint256 _claimAmount,
        bytes32 _evidenceHash
    ) external whenNotPaused nonReentrant returns (uint256) {
        Policy storage policy = policies[_policyId];
        
        require(policy.owner == msg.sender, "Not policy owner");
        require(policy.status == PolicyStatus.Active, "Policy not active");
        require(block.timestamp <= policy.endTime, "Policy expired");
        require(_claimAmount <= policy.coverageAmount, "Claim exceeds coverage");
        require(policyToClaim[_policyId] == 0, "Claim already exists");
        
        uint256 claimId = ++claimCount; // 从1开始
        
        claims[claimId] = Claim({
            policyId: _policyId,
            claimant: msg.sender,
            claimAmount: _claimAmount,
            evidenceHash: _evidenceHash,
            status: ClaimStatus.Pending,
            submittedAt: block.timestamp,
            processedAt: 0,
            payoutAmount: 0
        });
        
        policyToClaim[_policyId] = claimId;
        
        emit ClaimSubmitted(claimId, _policyId, _claimAmount);
        
        return claimId;
    }
    
    /**
     * @notice 处理理赔 (仅限管理员/DAO)
     */
    function processClaim(
        uint256 _claimId,
        bool _approved,
        uint256 _payoutAmount
    ) external onlyOwner nonReentrant {
        Claim storage claim = claims[_claimId];
        Policy storage policy = policies[claim.policyId];
        InsuranceProduct storage product = products[policy.productId];
        
        require(claim.status == ClaimStatus.Pending, "Claim not pending");
        
        if (_approved) {
            require(_payoutAmount <= claim.claimAmount, "Payout exceeds claim");
            
            // 计算实际赔付 (根据赔付率)
            uint256 actualPayout = (_payoutAmount * product.coverageRate) / 10000;
            
            // 从保险池赔付
            paymentToken.safeTransferFrom(insurancePool, claim.claimant, actualPayout);
            
            claim.status = ClaimStatus.Approved;
            claim.payoutAmount = actualPayout;
            policy.status = PolicyStatus.Claimed;
            totalClaimsPaid += actualPayout;
        } else {
            claim.status = ClaimStatus.Rejected;
        }
        
        claim.processedAt = block.timestamp;
        
        emit ClaimProcessed(_claimId, claim.status, claim.payoutAmount);
    }
    
    // ============== 管理函数 ==============
    
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }
    
    function setInsurancePool(address _insurancePool) external onlyOwner {
        require(_insurancePool != address(0), "Invalid pool");
        insurancePool = _insurancePool;
    }
    
    function setTreasuryFee(uint256 _fee) external onlyOwner {
        require(_fee <= 2000, "Fee too high"); // 最大20%
        treasuryFee = _fee;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============== 查询函数 ==============
    
    function getUserPolicies(address _user) external view returns (uint256[] memory) {
        return userPolicies[_user];
    }
    
    function getPolicyDetails(uint256 _policyId) external view returns (
        address owner,
        uint256 productId,
        uint256 coverageAmount,
        uint256 premiumPaid,
        uint256 startTime,
        uint256 endTime,
        PolicyStatus status
    ) {
        Policy storage policy = policies[_policyId];
        return (
            policy.owner,
            policy.productId,
            policy.coverageAmount,
            policy.premiumPaid,
            policy.startTime,
            policy.endTime,
            policy.status
        );
    }
    
    function getProtocolStats() external view returns (
        uint256 _productCount,
        uint256 _policyCount,
        uint256 _claimCount,
        uint256 _totalPremiums,
        uint256 _totalClaims
    ) {
        return (
            productCount,
            policyCount,
            claimCount,
            totalPremiumsCollected,
            totalClaimsPaid
        );
    }
}
