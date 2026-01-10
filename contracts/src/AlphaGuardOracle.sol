// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AlphaGuardOracle
 * @notice Rug Pull 判定预言机
 * @dev 由多签或 DAO 控制的预言机，用于判定代币是否 Rug
 * 
 * 判定标准:
 * 1. 流动性撤走 > 80%
 * 2. Dev 钱包大量抛售
 * 3. 合约被标记为恶意
 * 4. 价格下跌 > 90% 在短时间内
 */
contract AlphaGuardOracle is AccessControl, Pausable {
    
    // ============================================
    // 角色定义
    // ============================================
    
    bytes32 public constant REPORTER_ROLE = keccak256("REPORTER_ROLE");
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
    
    // ============================================
    // 类型定义
    // ============================================
    
    enum TokenStatus { UNKNOWN, SAFE, RUGGED, DISPUTED }
    
    struct TokenReport {
        address token;
        TokenStatus status;
        uint256 reportedAt;
        uint256 resolvedAt;
        address reporter;
        string evidence;        // IPFS hash 或 URL
        uint256 liquidityDrop;  // 流动性下降百分比 (basis points)
        uint256 priceDrop;      // 价格下降百分比 (basis points)
    }
    
    struct DisputeInfo {
        uint256 reportId;
        address disputer;
        string reason;
        uint256 disputedAt;
        bool resolved;
    }

    // ============================================
    // 状态变量
    // ============================================
    
    address public alphaGuard;              // AlphaGuard 主合约
    uint256 public reportCounter;
    uint256 public disputeCounter;
    
    uint256 public rugThresholdLiquidity;   // Rug 判定阈值 - 流动性 (basis points)
    uint256 public rugThresholdPrice;       // Rug 判定阈值 - 价格 (basis points)
    uint256 public disputePeriod;           // 争议期 (秒)
    
    mapping(uint256 => TokenReport) public reports;
    mapping(address => uint256) public tokenLatestReport;
    mapping(uint256 => DisputeInfo) public disputes;
    mapping(uint256 => uint256[]) public reportDisputes;
    
    // ============================================
    // 事件
    // ============================================
    
    event TokenReported(
        uint256 indexed reportId,
        address indexed token,
        TokenStatus status,
        address reporter,
        string evidence
    );
    
    event TokenStatusUpdated(
        uint256 indexed reportId,
        address indexed token,
        TokenStatus oldStatus,
        TokenStatus newStatus
    );
    
    event DisputeFiled(
        uint256 indexed disputeId,
        uint256 indexed reportId,
        address disputer,
        string reason
    );
    
    event DisputeResolved(
        uint256 indexed disputeId,
        bool accepted
    );
    
    event AlphaGuardUpdated(address indexed newAlphaGuard);
    event ThresholdsUpdated(uint256 liquidityThreshold, uint256 priceThreshold);

    // ============================================
    // 构造函数
    // ============================================
    
    constructor(address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(REPORTER_ROLE, _admin);
        _grantRole(RESOLVER_ROLE, _admin);
        
        rugThresholdLiquidity = 8000;  // 80%
        rugThresholdPrice = 9000;      // 90%
        disputePeriod = 24 hours;
    }

    // ============================================
    // 管理函数
    // ============================================
    
    function setAlphaGuard(address _alphaGuard) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_alphaGuard != address(0), "Invalid address");
        alphaGuard = _alphaGuard;
        emit AlphaGuardUpdated(_alphaGuard);
    }
    
    function setThresholds(
        uint256 _liquidityThreshold,
        uint256 _priceThreshold
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_liquidityThreshold <= 10000 && _priceThreshold <= 10000, "Invalid thresholds");
        rugThresholdLiquidity = _liquidityThreshold;
        rugThresholdPrice = _priceThreshold;
        emit ThresholdsUpdated(_liquidityThreshold, _priceThreshold);
    }
    
    function setDisputePeriod(uint256 _period) external onlyRole(DEFAULT_ADMIN_ROLE) {
        disputePeriod = _period;
    }
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ============================================
    // 报告函数
    // ============================================
    
    /**
     * @notice 提交代币状态报告
     * @param token 代币地址
     * @param status 状态
     * @param evidence 证据 (IPFS hash)
     * @param liquidityDrop 流动性下降百分比
     * @param priceDrop 价格下降百分比
     */
    function reportToken(
        address token,
        TokenStatus status,
        string calldata evidence,
        uint256 liquidityDrop,
        uint256 priceDrop
    ) external onlyRole(REPORTER_ROLE) whenNotPaused returns (uint256 reportId) {
        require(token != address(0), "Invalid token");
        require(status != TokenStatus.UNKNOWN, "Invalid status");
        require(bytes(evidence).length > 0, "Evidence required");
        
        reportId = reportCounter++;
        
        reports[reportId] = TokenReport({
            token: token,
            status: status,
            reportedAt: block.timestamp,
            resolvedAt: 0,
            reporter: msg.sender,
            evidence: evidence,
            liquidityDrop: liquidityDrop,
            priceDrop: priceDrop
        });
        
        tokenLatestReport[token] = reportId;
        
        emit TokenReported(reportId, token, status, msg.sender, evidence);
    }
    
    /**
     * @notice 自动判定 Rug (基于阈值)
     */
    function autoDetectRug(
        address token,
        uint256 liquidityDrop,
        uint256 priceDrop,
        string calldata evidence
    ) external onlyRole(REPORTER_ROLE) whenNotPaused returns (uint256 reportId) {
        TokenStatus status = TokenStatus.SAFE;
        
        // 如果流动性或价格下降超过阈值，标记为 Rug
        if (liquidityDrop >= rugThresholdLiquidity || priceDrop >= rugThresholdPrice) {
            status = TokenStatus.RUGGED;
        }
        
        reportId = reportCounter++;
        
        reports[reportId] = TokenReport({
            token: token,
            status: status,
            reportedAt: block.timestamp,
            resolvedAt: status == TokenStatus.SAFE ? block.timestamp : 0,
            reporter: msg.sender,
            evidence: evidence,
            liquidityDrop: liquidityDrop,
            priceDrop: priceDrop
        });
        
        tokenLatestReport[token] = reportId;
        
        emit TokenReported(reportId, token, status, msg.sender, evidence);
    }

    // ============================================
    // 争议函数
    // ============================================
    
    /**
     * @notice 对报告提出争议
     */
    function fileDispute(
        uint256 reportId,
        string calldata reason
    ) external whenNotPaused returns (uint256 disputeId) {
        require(reportId < reportCounter, "Report not found");
        TokenReport storage report = reports[reportId];
        
        require(report.resolvedAt == 0, "Already resolved");
        require(block.timestamp <= report.reportedAt + disputePeriod, "Dispute period ended");
        require(bytes(reason).length > 0, "Reason required");
        
        // 标记为争议中
        if (report.status != TokenStatus.DISPUTED) {
            emit TokenStatusUpdated(reportId, report.token, report.status, TokenStatus.DISPUTED);
            report.status = TokenStatus.DISPUTED;
        }
        
        disputeId = disputeCounter++;
        
        disputes[disputeId] = DisputeInfo({
            reportId: reportId,
            disputer: msg.sender,
            reason: reason,
            disputedAt: block.timestamp,
            resolved: false
        });
        
        reportDisputes[reportId].push(disputeId);
        
        emit DisputeFiled(disputeId, reportId, msg.sender, reason);
    }
    
    /**
     * @notice 解决争议
     */
    function resolveDispute(
        uint256 disputeId,
        bool accepted,
        TokenStatus finalStatus
    ) external onlyRole(RESOLVER_ROLE) {
        require(disputeId < disputeCounter, "Dispute not found");
        DisputeInfo storage dispute = disputes[disputeId];
        
        require(!dispute.resolved, "Already resolved");
        require(finalStatus != TokenStatus.UNKNOWN && finalStatus != TokenStatus.DISPUTED, "Invalid status");
        
        dispute.resolved = true;
        
        TokenReport storage report = reports[dispute.reportId];
        
        emit TokenStatusUpdated(dispute.reportId, report.token, report.status, finalStatus);
        report.status = finalStatus;
        report.resolvedAt = block.timestamp;
        
        emit DisputeResolved(disputeId, accepted);
    }

    // ============================================
    // 最终结算
    // ============================================
    
    /**
     * @notice 最终确认代币状态并通知 AlphaGuard
     */
    function finalizeAndNotify(
        uint256 reportId,
        uint256 poolId
    ) external onlyRole(RESOLVER_ROLE) {
        require(reportId < reportCounter, "Report not found");
        TokenReport storage report = reports[reportId];
        
        require(report.status == TokenStatus.RUGGED || report.status == TokenStatus.SAFE, "Not finalized");
        require(report.resolvedAt > 0 || block.timestamp > report.reportedAt + disputePeriod, "Still in dispute");
        
        if (report.resolvedAt == 0) {
            report.resolvedAt = block.timestamp;
        }
        
        // 调用 AlphaGuard 结算
        if (alphaGuard != address(0)) {
            uint8 outcome = report.status == TokenStatus.RUGGED ? 1 : 2; // RUGGED = 1, SAFE = 2
            IAlphaGuard(alphaGuard).resolvePool(poolId, IAlphaGuard.Outcome(outcome));
        }
    }

    // ============================================
    // 视图函数
    // ============================================
    
    /**
     * @notice 获取代币最新状态
     */
    function getTokenStatus(address token) external view returns (TokenStatus) {
        uint256 reportId = tokenLatestReport[token];
        if (reportId == 0 && reports[0].token != token) {
            return TokenStatus.UNKNOWN;
        }
        return reports[reportId].status;
    }
    
    /**
     * @notice 获取报告详情
     */
    function getReport(uint256 reportId) external view returns (TokenReport memory) {
        require(reportId < reportCounter, "Report not found");
        return reports[reportId];
    }
    
    /**
     * @notice 检查代币是否被标记为 Rug
     */
    function isRugged(address token) external view returns (bool) {
        uint256 reportId = tokenLatestReport[token];
        if (reportId == 0 && reports[0].token != token) {
            return false;
        }
        return reports[reportId].status == TokenStatus.RUGGED;
    }
    
    /**
     * @notice 获取报告的所有争议
     */
    function getReportDisputes(uint256 reportId) external view returns (uint256[] memory) {
        return reportDisputes[reportId];
    }
}

// AlphaGuard 接口
interface IAlphaGuard {
    enum Outcome { PENDING, RUGGED, SAFE, CANCELLED }
    function resolvePool(uint256 poolId, Outcome outcome) external;
}
