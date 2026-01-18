// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MultiAssetStaking.sol";
import "../src/CowGuardInsurance.sol";

/**
 * @title DeployBSC
 * @notice 部署 AlphaNest 合约到 BSC (Four.meme 平台)
 * 
 * Chainlink Price Feeds (BSC Mainnet):
 * - BNB/USD: 0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE
 * - USDT/USD: 0xB97Ad0E74fa7d920791E90258A6E2085088b4320
 * - USDC/USD: 0x51597f405303C4377E36123cBc172b13269EA163
 */
contract DeployBSC is Script {
    // BSC Mainnet Tokens
    address constant BSC_USDT = 0x55d398326f99059fF775485246999027B3197955;
    address constant BSC_USDC = 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d;
    
    // Chainlink Price Feeds (BSC Mainnet)
    address constant CHAINLINK_BNB_USD = 0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE;
    address constant CHAINLINK_USDT_USD = 0xB97Ad0E74fa7d920791E90258A6E2085088b4320;
    address constant CHAINLINK_USDC_USD = 0x51597f405303C4377E36123cBc172b13269EA163;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== AlphaNest Deployment to BSC (Four.meme) ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MultiAssetStaking (质押合约)
        // 使用 USDT 作为奖励代币，BSC BNB/USD Chainlink Feed
        MultiAssetStaking staking = new MultiAssetStaking(
            BSC_USDT,              // reward token
            deployer,              // treasury
            CHAINLINK_BNB_USD      // BNB/USD price feed
        );
        console.log("\n1. MultiAssetStaking deployed:", address(staking));

        // 配置价格喂价
        address[] memory tokens = new address[](2);
        address[] memory feeds = new address[](2);
        tokens[0] = BSC_USDT;
        tokens[1] = BSC_USDC;
        feeds[0] = CHAINLINK_USDT_USD;
        feeds[1] = CHAINLINK_USDC_USD;
        staking.setPriceFeeds(tokens, feeds);
        console.log("   - Configured USDT/USDC price feeds");

        // 添加 USDT 和 USDC 为可质押代币
        staking.addStakeableToken(
            BSC_USDT,
            "USDT",
            18,
            800,   // 8% APY
            100,   // 1x multiplier
            1e18   // min 1 USDT
        );
        console.log("   - Added USDT as stakeable token");

        staking.addStakeableToken(
            BSC_USDC,
            "USDC",
            18,
            800,   // 8% APY
            100,   // 1x multiplier
            1e18   // min 1 USDC
        );
        console.log("   - Added USDC as stakeable token");

        // 2. Deploy CowGuardInsurance (保险合约)
        CowGuardInsurance insurance = new CowGuardInsurance(
            BSC_USDT,
            deployer,
            200  // 2% protocol fee
        );
        console.log("2. CowGuardInsurance deployed:", address(insurance));

        vm.stopBroadcast();

        // Output Summary
        console.log("\n========================================");
        console.log("=== BSC DEPLOYMENT COMPLETE ===");
        console.log("========================================");
        console.log("\nContracts:");
        console.log("  MultiAssetStaking:  ", address(staking));
        console.log("  CowGuardInsurance:  ", address(insurance));
        console.log("\nChainlink Price Feeds:");
        console.log("  BNB/USD:            ", CHAINLINK_BNB_USD);
        console.log("  USDT/USD:           ", CHAINLINK_USDT_USD);
        console.log("  USDC/USD:           ", CHAINLINK_USDC_USD);
        console.log("\nPlatform: Four.meme (BSC Meme Launchpad)");
        console.log("========================================");
    }
}

/**
 * @title DeployBSCTestnet
 * @notice 部署到 BSC Testnet
 * 
 * Chainlink Price Feeds (BSC Testnet):
 * - BNB/USD: 0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526
 */
contract DeployBSCTestnet is Script {
    // Chainlink BSC Testnet
    address constant CHAINLINK_BNB_USD_TESTNET = 0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== AlphaNest Deployment to BSC Testnet ===");
        console.log("Deployer:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Mock USDT
        MockUSDT usdt = new MockUSDT();
        console.log("\nMockUSDT deployed:", address(usdt));

        // Deploy MultiAssetStaking with Chainlink feed
        MultiAssetStaking staking = new MultiAssetStaking(
            address(usdt),              // reward token
            deployer,                   // treasury
            CHAINLINK_BNB_USD_TESTNET   // BNB/USD price feed
        );
        console.log("MultiAssetStaking deployed:", address(staking));
        
        // 由于测试网没有稳定币喂价，禁用 Chainlink 用回退价格
        staking.setOracleSettings(false, 3600);
        console.log("   - Oracle set to fallback mode for testnet");

        // Deploy CowGuardInsurance
        CowGuardInsurance insurance = new CowGuardInsurance(
            address(usdt),
            deployer,
            200
        );
        console.log("CowGuardInsurance deployed:", address(insurance));

        // Mint test USDT
        usdt.mint(deployer, 1_000_000 * 10**18);
        console.log("Minted 1M USDT to deployer");

        vm.stopBroadcast();
        
        console.log("\n=== BSC Testnet Deployment Complete ===");
        console.log("MockUSDT:", address(usdt));
        console.log("MultiAssetStaking:", address(staking));
        console.log("CowGuardInsurance:", address(insurance));
        console.log("Chainlink BNB/USD:", CHAINLINK_BNB_USD_TESTNET);
    }
}

/**
 * @title DeploySepolia
 * @notice 部署到 Sepolia 测试网 (用于 EVM 测试)
 * 
 * Chainlink Price Feeds (Sepolia):
 * - ETH/USD: 0x694AA1769357215DE4FAC081bf1f309aDC325306
 * - USDC/USD: 0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E
 */
contract DeploySepolia is Script {
    // Chainlink Sepolia
    address constant CHAINLINK_ETH_USD_SEPOLIA = 0x694AA1769357215DE4FAC081bf1f309aDC325306;
    address constant CHAINLINK_USDC_USD_SEPOLIA = 0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== AlphaNest Deployment to Sepolia ===");
        console.log("Deployer:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Mock USDT
        MockUSDT usdt = new MockUSDT();
        console.log("\nMockUSDT deployed:", address(usdt));

        // Deploy MultiAssetStaking with Chainlink ETH/USD feed
        MultiAssetStaking staking = new MultiAssetStaking(
            address(usdt),              // reward token  
            deployer,                   // treasury
            CHAINLINK_ETH_USD_SEPOLIA   // ETH/USD price feed
        );
        console.log("MultiAssetStaking deployed:", address(staking));
        
        // 添加 USDT 为可质押代币
        staking.addStakeableToken(
            address(usdt),
            "USDT",
            18,
            1000,  // 10% APY
            100,   // 1x multiplier
            1e18   // min 1 USDT
        );
        console.log("   - Added USDT as stakeable token");

        // Deploy CowGuardInsurance
        CowGuardInsurance insurance = new CowGuardInsurance(
            address(usdt),
            deployer,
            200
        );
        console.log("CowGuardInsurance deployed:", address(insurance));

        // Mint test USDT
        usdt.mint(deployer, 1_000_000 * 10**18);

        vm.stopBroadcast();
        
        console.log("\n=== Sepolia Deployment Complete ===");
        console.log("MockUSDT:", address(usdt));
        console.log("MultiAssetStaking:", address(staking));
        console.log("CowGuardInsurance:", address(insurance));
        console.log("Chainlink ETH/USD:", CHAINLINK_ETH_USD_SEPOLIA);
    }
}

// Mock USDT for testnet (BSC uses 18 decimals for USDT)
contract MockUSDT {
    string public name = "Tether USD";
    string public symbol = "USDT";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
