// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PopCow Token
 * @notice ERC20 代币，支持自动销毁、暂停和权限管理
 * @dev 用于 Base, Ethereum, BSC, Arbitrum 等 EVM 链
 */
contract PopCowToken is ERC20, ERC20Burnable, ERC20Permit, Ownable2Step, Pausable, ReentrancyGuard {
    
    // ============== 常量 ==============
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 10亿
    uint256 public constant MAX_BURN_RATE = 100; // 最大1% (100 basis points)
    
    // ============== 状态变量 ==============
    uint256 public burnRate = 20; // 0.2% = 20 basis points
    uint256 public totalBurned;
    address public treasury;
    
    mapping(address => bool) public isExcludedFromFee;
    mapping(address => bool) public isBlacklisted;
    
    // ============== 事件 ==============
    event BurnRateUpdated(uint256 oldRate, uint256 newRate);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event ExcludedFromFee(address indexed account, bool excluded);
    event Blacklisted(address indexed account, bool blacklisted);
    event TokensBurned(address indexed from, uint256 amount);
    
    // ============== 构造函数 ==============
    constructor(address _treasury) 
        ERC20("PopCow Token", "POPCOW") 
        ERC20Permit("PopCow Token")
    {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
        
        _mint(msg.sender, MAX_SUPPLY);
        
        // 排除部署者和国库
        isExcludedFromFee[msg.sender] = true;
        isExcludedFromFee[_treasury] = true;
    }
    
    // ============== 转账函数 ==============
    
    function transfer(address to, uint256 amount) 
        public 
        override 
        whenNotPaused 
        returns (bool) 
    {
        _checkBlacklist(msg.sender, to);
        return _transferWithBurn(msg.sender, to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        whenNotPaused 
        returns (bool) 
    {
        _checkBlacklist(from, to);
        _spendAllowance(from, msg.sender, amount);
        return _transferWithBurn(from, to, amount);
    }
    
    function _transferWithBurn(address from, address to, uint256 amount) 
        internal 
        returns (bool) 
    {
        require(to != address(0), "Transfer to zero address");
        
        if (isExcludedFromFee[from] || isExcludedFromFee[to] || burnRate == 0) {
            _transfer(from, to, amount);
        } else {
            uint256 burnAmount = (amount * burnRate) / 10000;
            uint256 transferAmount = amount - burnAmount;
            
            _transfer(from, to, transferAmount);
            
            if (burnAmount > 0) {
                _burn(from, burnAmount);
                totalBurned += burnAmount;
                emit TokensBurned(from, burnAmount);
            }
        }
        return true;
    }
    
    function _checkBlacklist(address from, address to) internal view {
        require(!isBlacklisted[from], "Sender is blacklisted");
        require(!isBlacklisted[to], "Recipient is blacklisted");
    }
    
    // ============== 管理函数 ==============
    
    /**
     * @notice 设置销毁率
     * @param _burnRate 新的销毁率 (basis points, 100 = 1%)
     */
    function setBurnRate(uint256 _burnRate) external onlyOwner {
        require(_burnRate <= MAX_BURN_RATE, "Exceeds max burn rate");
        uint256 oldRate = burnRate;
        burnRate = _burnRate;
        emit BurnRateUpdated(oldRate, _burnRate);
    }
    
    /**
     * @notice 设置国库地址
     * @param _treasury 新的国库地址
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        address oldTreasury = treasury;
        treasury = _treasury;
        isExcludedFromFee[_treasury] = true;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }
    
    /**
     * @notice 设置地址是否排除费用
     * @param account 目标地址
     * @param excluded 是否排除
     */
    function setExcludedFromFee(address account, bool excluded) external onlyOwner {
        isExcludedFromFee[account] = excluded;
        emit ExcludedFromFee(account, excluded);
    }
    
    /**
     * @notice 设置地址黑名单状态
     * @param account 目标地址
     * @param blacklisted 是否加入黑名单
     */
    function setBlacklisted(address account, bool blacklisted) external onlyOwner {
        require(account != owner(), "Cannot blacklist owner");
        isBlacklisted[account] = blacklisted;
        emit Blacklisted(account, blacklisted);
    }
    
    /**
     * @notice 批量设置黑名单
     * @param accounts 地址数组
     * @param blacklisted 是否加入黑名单
     */
    function batchSetBlacklisted(address[] calldata accounts, bool blacklisted) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] != owner()) {
                isBlacklisted[accounts[i]] = blacklisted;
                emit Blacklisted(accounts[i], blacklisted);
            }
        }
    }
    
    /**
     * @notice 暂停代币转账
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice 恢复代币转账
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice 管理员销毁代币
     * @param amount 销毁数量
     */
    function adminBurn(uint256 amount) external onlyOwner {
        _burn(msg.sender, amount);
        totalBurned += amount;
        emit TokensBurned(msg.sender, amount);
    }
    
    // ============== 查询函数 ==============
    
    /**
     * @notice 获取当前流通量
     */
    function circulatingSupply() external view returns (uint256) {
        return totalSupply();
    }
    
    /**
     * @notice 获取销毁统计
     */
    function burnStats() external view returns (
        uint256 _totalBurned,
        uint256 _burnRate,
        uint256 _remainingSupply
    ) {
        return (totalBurned, burnRate, totalSupply());
    }
}
