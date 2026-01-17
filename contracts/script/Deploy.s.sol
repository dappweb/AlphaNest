// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MultiAssetStaking.sol";
import "../src/CowGuardInsurance.sol";

/**
 * @title DeployBSC
 * @notice 部署 AlphaNest 合约到 BSC (Four.meme 平台)
 * 只部署质押和保险合约
 */
contract DeployBSC is Script {
    // BSC Mainnet USDT address
    address constant BSC_USDT = 0x55d398326f99059fF775485246999027B3197955;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== AlphaNest Deployment to BSC (Four.meme) ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MultiAssetStaking (质押合约)
        MultiAssetStaking staking = new MultiAssetStaking(deployer);
        console.log("\n1. MultiAssetStaking deployed:", address(staking));

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
        console.log("\nPayment Token:");
        console.log("  USDT (BSC):         ", BSC_USDT);
        console.log("\nPlatform: Four.meme (BSC Meme Launchpad)");
        console.log("========================================");
    }
}

/**
 * @title DeployBSCTestnet
 * @notice 部署到 BSC Testnet
 */
contract DeployBSCTestnet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== AlphaNest Deployment to BSC Testnet ===");
        console.log("Deployer:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Mock USDT
        MockUSDT usdt = new MockUSDT();
        console.log("\nMockUSDT deployed:", address(usdt));

        // Deploy MultiAssetStaking
        MultiAssetStaking staking = new MultiAssetStaking(deployer);
        console.log("MultiAssetStaking deployed:", address(staking));

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
    }
}

/**
 * @title DeploySepolia
 * @notice 部署到 Sepolia 测试网 (用于 EVM 测试)
 */
contract DeploySepolia is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== AlphaNest Deployment to Sepolia ===");
        console.log("Deployer:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Mock USDT
        MockUSDT usdt = new MockUSDT();
        console.log("\nMockUSDT deployed:", address(usdt));

        // Deploy MultiAssetStaking
        MultiAssetStaking staking = new MultiAssetStaking(deployer);
        console.log("MultiAssetStaking deployed:", address(staking));

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
