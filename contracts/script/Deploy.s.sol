// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/AlphaGuard.sol";
import "../src/AlphaGuardOracle.sol";
import "../src/AlphaNestCore.sol";
import "../src/ReputationRegistry.sol";
import "../src/CrossChainVerifier.sol";
import "../src/TokenFactory.sol";
import "../src/AlphaToken.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usdc = vm.envAddress("USDC_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Oracle first
        AlphaGuardOracle oracle = new AlphaGuardOracle(msg.sender);
        console.log("AlphaGuardOracle deployed at:", address(oracle));

        // Deploy AlphaGuard with 2% protocol fee
        AlphaGuard alphaGuard = new AlphaGuard(
            usdc,
            address(oracle),
            200 // 2% fee
        );
        console.log("AlphaGuard deployed at:", address(alphaGuard));

        // Configure Oracle
        oracle.setAlphaGuard(address(alphaGuard));
        console.log("Oracle configured with AlphaGuard");

        vm.stopBroadcast();

        // Output deployment info
        console.log("\n=== Deployment Summary ===");
        console.log("Network:", block.chainid);
        console.log("AlphaGuard:", address(alphaGuard));
        console.log("AlphaGuardOracle:", address(oracle));
        console.log("Payment Token (USDC):", usdc);
    }
}

/**
 * @title DeployAllSepolia
 * @notice 部署所有 AlphaNest 合约到 Sepolia 测试网
 */
contract DeployAllSepolia is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== AlphaNest Full Deployment to Sepolia ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Mock USDC
        MockUSDC usdc = new MockUSDC();
        console.log("\n1. MockUSDC deployed:", address(usdc));

        // 2. Deploy $ALPHA Token
        AlphaToken alphaToken = new AlphaToken(
            deployer,  // communityPool
            deployer,  // ecosystemPool
            deployer,  // teamPool
            deployer,  // investorPool
            deployer   // liquidityPool
        );
        console.log("2. AlphaToken deployed:", address(alphaToken));

        // 3. Deploy AlphaNestCore
        AlphaNestCore core = new AlphaNestCore(
            address(alphaToken),
            deployer,  // treasury
            deployer   // buyback address
        );
        console.log("3. AlphaNestCore deployed:", address(core));

        // 4. Deploy ReputationRegistry
        ReputationRegistry reputation = new ReputationRegistry();
        console.log("4. ReputationRegistry deployed:", address(reputation));

        // 5. Deploy CrossChainVerifier
        CrossChainVerifier verifier = new CrossChainVerifier();
        console.log("5. CrossChainVerifier deployed:", address(verifier));

        // 6. Deploy TokenFactory
        TokenFactory factory = new TokenFactory(deployer);
        console.log("6. TokenFactory deployed:", address(factory));

        // 7. Deploy AlphaGuardOracle
        AlphaGuardOracle oracle = new AlphaGuardOracle(deployer);
        console.log("7. AlphaGuardOracle deployed:", address(oracle));

        // 8. Deploy AlphaGuard
        AlphaGuard alphaGuard = new AlphaGuard(
            address(usdc),
            address(oracle),
            200  // 2% fee
        );
        console.log("8. AlphaGuard deployed:", address(alphaGuard));

        // ============================================
        // Configure contracts
        // ============================================
        
        // Configure Oracle
        oracle.setAlphaGuard(address(alphaGuard));
        
        // Configure CrossChainVerifier - add supported chains
        verifier.configureChain(1, "Ethereum", true, 12);
        verifier.configureChain(8453, "Base", true, 2);
        verifier.configureChain(56, "BNB Chain", true, 15);
        verifier.configureChain(11155111, "Sepolia", true, 2);
        
        // Grant roles
        core.grantRole(core.POINTS_MANAGER_ROLE(), deployer);
        reputation.grantRole(reputation.VERIFIER_ROLE(), deployer);
        verifier.grantRole(verifier.RELAYER_ROLE(), deployer);
        
        // Mint initial ALPHA for testing
        alphaToken.mintLiquidityAllocation(50_000_000 * 1e18);  // 50M for liquidity
        
        // Mint test USDC
        usdc.mint(deployer, 10_000_000 * 10**6);  // 10M USDC

        vm.stopBroadcast();

        // ============================================
        // Output Summary
        // ============================================
        console.log("\n========================================");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("========================================");
        console.log("\nCore Contracts:");
        console.log("  AlphaToken:        ", address(alphaToken));
        console.log("  AlphaNestCore:     ", address(core));
        console.log("  ReputationRegistry:", address(reputation));
        console.log("  CrossChainVerifier:", address(verifier));
        console.log("  TokenFactory:      ", address(factory));
        console.log("\nInsurance Contracts:");
        console.log("  AlphaGuard:        ", address(alphaGuard));
        console.log("  AlphaGuardOracle:  ", address(oracle));
        console.log("\nTest Tokens:");
        console.log("  MockUSDC:          ", address(usdc));
        console.log("\n========================================");
        console.log("Save these addresses to your .env file!");
        console.log("========================================");
    }
}

contract DeployTestnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deployer address:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy mock USDC for testnet
        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC deployed at:", address(usdc));

        // Deploy Oracle with deployer as admin
        AlphaGuardOracle oracle = new AlphaGuardOracle(deployer);
        console.log("AlphaGuardOracle deployed at:", address(oracle));

        // Deploy AlphaGuard
        AlphaGuard alphaGuard = new AlphaGuard(
            address(usdc),
            address(oracle),
            200
        );
        console.log("AlphaGuard deployed at:", address(alphaGuard));

        // Configure Oracle with AlphaGuard address
        oracle.setAlphaGuard(address(alphaGuard));
        console.log("Oracle configured");

        // Mint test USDC to deployer
        usdc.mint(deployer, 1_000_000 * 10**6);
        console.log("Minted 1M USDC to deployer");

        vm.stopBroadcast();
        
        console.log("\n=== Deployment Complete ===");
        console.log("MockUSDC:", address(usdc));
        console.log("AlphaGuardOracle:", address(oracle));
        console.log("AlphaGuard:", address(alphaGuard));
    }
}

// Mock USDC for testnet
contract MockUSDC {
    string public name = "USD Coin";
    string public symbol = "USDC";
    uint8 public decimals = 6;
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
