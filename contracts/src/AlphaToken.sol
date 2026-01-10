// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AlphaToken
 * @notice $ALPHA - AlphaNest 平台代币
 * @dev ERC-20 代币，支持燃烧、许可和访问控制
 * 
 * 代币经济:
 * - 总供应量: 1,000,000,000 (10亿)
 * - 支持燃烧 (回购销毁机制)
 * - 支持 EIP-2612 Permit (无 Gas 授权)
 * 
 * 分配:
 * - 社区激励: 40% (4亿) - 5年线性释放
 * - 生态发展: 20% (2亿) - 2年锁仓后3年释放
 * - 团队顾问: 15% (1.5亿) - 1年锁仓+3年释放
 * - 早期投资: 10% (1亿) - 6个月锁仓+2年释放
 * - 公开销售: 10% (1亿) - TGE 50%，6个月释放剩余
 * - 流动性: 5% (0.5亿) - TGE 全部释放
 */
contract AlphaToken is ERC20, ERC20Burnable, ERC20Permit, AccessControl, Pausable {

    // ============================================
    // 角色定义
    // ============================================
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // ============================================
    // 常量
    // ============================================

    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 1e18;  // 10亿
    
    // 分配比例 (basis points)
    uint256 public constant COMMUNITY_ALLOCATION = 4000;   // 40%
    uint256 public constant ECOSYSTEM_ALLOCATION = 2000;   // 20%
    uint256 public constant TEAM_ALLOCATION = 1500;        // 15%
    uint256 public constant INVESTOR_ALLOCATION = 1000;    // 10%
    uint256 public constant PUBLIC_ALLOCATION = 1000;      // 10%
    uint256 public constant LIQUIDITY_ALLOCATION = 500;    // 5%

    // ============================================
    // 状态变量
    // ============================================

    uint256 public totalMinted;
    uint256 public totalBurned;
    
    // 分配地址
    address public communityPool;
    address public ecosystemPool;
    address public teamPool;
    address public investorPool;
    address public liquidityPool;
    
    // 铸造上限追踪
    mapping(bytes32 => uint256) public allocationMinted;

    // ============================================
    // 事件
    // ============================================

    event AllocationMinted(string indexed allocation, address indexed recipient, uint256 amount);
    event TokensBurned(address indexed burner, uint256 amount);
    event PoolAddressUpdated(string indexed pool, address indexed newAddress);

    // ============================================
    // 构造函数
    // ============================================

    constructor(
        address _communityPool,
        address _ecosystemPool,
        address _teamPool,
        address _investorPool,
        address _liquidityPool
    ) ERC20("AlphaNest Token", "ALPHA") ERC20Permit("AlphaNest Token") {
        require(_communityPool != address(0), "Invalid community pool");
        require(_ecosystemPool != address(0), "Invalid ecosystem pool");
        require(_teamPool != address(0), "Invalid team pool");
        require(_investorPool != address(0), "Invalid investor pool");
        require(_liquidityPool != address(0), "Invalid liquidity pool");
        
        communityPool = _communityPool;
        ecosystemPool = _ecosystemPool;
        teamPool = _teamPool;
        investorPool = _investorPool;
        liquidityPool = _liquidityPool;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    // ============================================
    // 铸造功能
    // ============================================

    /**
     * @notice 铸造社区激励代币
     * @param amount 铸造数量
     */
    function mintCommunityAllocation(uint256 amount) external onlyRole(MINTER_ROLE) {
        _mintAllocation("community", communityPool, amount, COMMUNITY_ALLOCATION);
    }

    /**
     * @notice 铸造生态发展代币
     * @param amount 铸造数量
     */
    function mintEcosystemAllocation(uint256 amount) external onlyRole(MINTER_ROLE) {
        _mintAllocation("ecosystem", ecosystemPool, amount, ECOSYSTEM_ALLOCATION);
    }

    /**
     * @notice 铸造团队顾问代币
     * @param amount 铸造数量
     */
    function mintTeamAllocation(uint256 amount) external onlyRole(MINTER_ROLE) {
        _mintAllocation("team", teamPool, amount, TEAM_ALLOCATION);
    }

    /**
     * @notice 铸造早期投资代币
     * @param amount 铸造数量
     */
    function mintInvestorAllocation(uint256 amount) external onlyRole(MINTER_ROLE) {
        _mintAllocation("investor", investorPool, amount, INVESTOR_ALLOCATION);
    }

    /**
     * @notice 铸造流动性代币
     * @param amount 铸造数量
     */
    function mintLiquidityAllocation(uint256 amount) external onlyRole(MINTER_ROLE) {
        _mintAllocation("liquidity", liquidityPool, amount, LIQUIDITY_ALLOCATION);
    }

    /**
     * @notice 初始分发 - TGE 时一次性铸造
     * @dev 铸造流动性 (100%) + 公开销售 (50%)
     */
    function initialDistribution() external onlyRole(MINTER_ROLE) {
        // 流动性 - 100% at TGE
        uint256 liquidityAmount = (MAX_SUPPLY * LIQUIDITY_ALLOCATION) / 10000;
        _mintAllocation("liquidity", liquidityPool, liquidityAmount, LIQUIDITY_ALLOCATION);
        
        // 公开销售 - 50% at TGE
        uint256 publicAmount = (MAX_SUPPLY * PUBLIC_ALLOCATION) / 10000 / 2;
        _mintAllocation("public", investorPool, publicAmount, PUBLIC_ALLOCATION);
    }

    // ============================================
    // 燃烧功能
    // ============================================

    /**
     * @notice 燃烧代币（覆盖父类以追踪燃烧量）
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        totalBurned += amount;
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @notice 从指定地址燃烧代币
     */
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        totalBurned += amount;
        emit TokensBurned(account, amount);
    }

    // ============================================
    // 管理功能
    // ============================================

    /**
     * @notice 更新社区池地址
     */
    function setCommunityPool(address _pool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_pool != address(0), "Invalid address");
        communityPool = _pool;
        emit PoolAddressUpdated("community", _pool);
    }

    /**
     * @notice 更新生态池地址
     */
    function setEcosystemPool(address _pool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_pool != address(0), "Invalid address");
        ecosystemPool = _pool;
        emit PoolAddressUpdated("ecosystem", _pool);
    }

    /**
     * @notice 更新团队池地址
     */
    function setTeamPool(address _pool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_pool != address(0), "Invalid address");
        teamPool = _pool;
        emit PoolAddressUpdated("team", _pool);
    }

    /**
     * @notice 更新投资者池地址
     */
    function setInvestorPool(address _pool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_pool != address(0), "Invalid address");
        investorPool = _pool;
        emit PoolAddressUpdated("investor", _pool);
    }

    /**
     * @notice 更新流动性池地址
     */
    function setLiquidityPool(address _pool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_pool != address(0), "Invalid address");
        liquidityPool = _pool;
        emit PoolAddressUpdated("liquidity", _pool);
    }

    /**
     * @notice 暂停代币转账
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice 恢复代币转账
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============================================
    // 视图函数
    // ============================================

    /**
     * @notice 获取流通供应量
     */
    function circulatingSupply() external view returns (uint256) {
        return totalMinted - totalBurned;
    }

    /**
     * @notice 获取各分配的已铸造量
     */
    function getAllocationMinted(string calldata allocation) external view returns (uint256) {
        return allocationMinted[keccak256(bytes(allocation))];
    }

    /**
     * @notice 获取各分配的剩余可铸造量
     */
    function getAllocationRemaining(string calldata allocation, uint256 allocationBps) external view returns (uint256) {
        uint256 maxAllocation = (MAX_SUPPLY * allocationBps) / 10000;
        uint256 minted = allocationMinted[keccak256(bytes(allocation))];
        return maxAllocation > minted ? maxAllocation - minted : 0;
    }

    /**
     * @notice 获取代币统计信息
     */
    function getTokenStats() external view returns (
        uint256 maxSupply,
        uint256 minted,
        uint256 burned,
        uint256 circulating
    ) {
        return (
            MAX_SUPPLY,
            totalMinted,
            totalBurned,
            totalMinted - totalBurned
        );
    }

    // ============================================
    // 内部函数
    // ============================================

    function _mintAllocation(
        string memory allocation,
        address recipient,
        uint256 amount,
        uint256 allocationBps
    ) internal {
        bytes32 allocationKey = keccak256(bytes(allocation));
        uint256 maxAllocation = (MAX_SUPPLY * allocationBps) / 10000;
        
        require(
            allocationMinted[allocationKey] + amount <= maxAllocation,
            "Allocation exceeded"
        );
        require(totalMinted + amount <= MAX_SUPPLY, "Max supply exceeded");
        
        allocationMinted[allocationKey] += amount;
        totalMinted += amount;
        
        _mint(recipient, amount);
        
        emit AllocationMinted(allocation, recipient, amount);
    }

    /**
     * @notice 转账前检查（暂停功能）
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override whenNotPaused {
        super._update(from, to, value);
    }
}
