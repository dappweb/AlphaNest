// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CowGuardInsurance.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDT is ERC20 {
    constructor() ERC20("Tether USD", "USDT") {
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @title CowGuardInsuranceTest
 * @notice Tests for CowGuardInsurance contract
 * @dev Supports Four.meme (BSC) and pump.fun (Solana) meme tokens
 */
contract CowGuardInsuranceTest is Test {
    CowGuardInsurance public insurance;
    MockUSDT public usdt;
    
    address public owner = address(1);
    address public user1 = address(3);
    address public user2 = address(4);
    address public memeToken = address(5); // Four.meme token
    
    uint256 public constant PROTOCOL_FEE = 200; // 2%

    function setUp() public {
        vm.startPrank(owner);
        
        usdt = new MockUSDT();
        insurance = new CowGuardInsurance(address(usdt), owner, PROTOCOL_FEE);
        
        // Distribute USDT to users
        usdt.transfer(user1, 10000 * 10**18);
        usdt.transfer(user2, 10000 * 10**18);
        
        vm.stopPrank();
        
        // Approve insurance contract
        vm.prank(user1);
        usdt.approve(address(insurance), type(uint256).max);
        
        vm.prank(user2);
        usdt.approve(address(insurance), type(uint256).max);
    }

    // ============================================
    // Product Creation Tests
    // ============================================

    function testCreateProduct() public {
        vm.prank(owner);
        uint256 productId = insurance.createProduct(
            CowGuardInsurance.InsuranceType.RugPull,
            500,  // 5% premium rate
            8000, // 80% coverage rate
            100 * 10**18,   // min coverage
            10000 * 10**18, // max coverage
            30    // 30 days duration
        );
        
        assertEq(productId, 1);
    }

    function testCreateProductOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        insurance.createProduct(
            CowGuardInsurance.InsuranceType.RugPull,
            500, 8000, 100 * 10**18, 10000 * 10**18, 30
        );
    }

    // ============================================
    // Policy Purchase Tests
    // ============================================

    function testPurchasePolicy() public {
        // Create product first
        vm.prank(owner);
        uint256 productId = insurance.createProduct(
            CowGuardInsurance.InsuranceType.RugPull,
            500, 8000, 100 * 10**18, 10000 * 10**18, 30
        );
        
        // Purchase policy
        uint256 coverageAmount = 1000 * 10**18;
        vm.prank(user1);
        uint256 policyId = insurance.purchaseInsurance(productId, coverageAmount);
        
        assertEq(policyId, 1);
    }

    function testPurchasePolicyInvalidCoverage() public {
        vm.prank(owner);
        uint256 productId = insurance.createProduct(
            CowGuardInsurance.InsuranceType.RugPull,
            500, 8000, 100 * 10**18, 10000 * 10**18, 30
        );
        
        // Try to purchase with coverage below minimum
        vm.prank(user1);
        vm.expectRevert("Coverage below minimum");
        insurance.purchaseInsurance(productId, 10 * 10**18);
    }

    // ============================================
    // Claim Tests
    // ============================================

    function testSubmitClaim() public {
        // Setup
        vm.prank(owner);
        uint256 productId = insurance.createProduct(
            CowGuardInsurance.InsuranceType.RugPull,
            500, 8000, 100 * 10**18, 10000 * 10**18, 30
        );
        
        vm.prank(user1);
        uint256 policyId = insurance.purchaseInsurance(productId, 1000 * 10**18);
        
        // Submit claim
        vm.prank(user1);
        uint256 claimId = insurance.submitClaim(
            policyId,
            CowGuardInsurance.ClaimType.RugPull,
            500 * 10**18,
            bytes32(0)
        );
        
        assertEq(claimId, 1);
    }

    function testSubmitClaimNotHolder() public {
        vm.prank(owner);
        uint256 productId = insurance.createProduct(
            CowGuardInsurance.InsuranceType.RugPull,
            500, 8000, 100 * 10**18, 10000 * 10**18, 30
        );
        
        vm.prank(user1);
        uint256 policyId = insurance.purchaseInsurance(productId, 1000 * 10**18);
        
        // User2 tries to claim on user1's policy
        vm.prank(user2);
        vm.expectRevert("Not policy holder");
        insurance.submitClaim(policyId, CowGuardInsurance.ClaimType.RugPull, 500 * 10**18, bytes32(0));
    }

    // ============================================
    // Admin Tests
    // ============================================

    function testProcessClaim() public {
        // Setup policy and claim
        vm.prank(owner);
        uint256 productId = insurance.createProduct(
            CowGuardInsurance.InsuranceType.RugPull,
            500, 8000, 100 * 10**18, 10000 * 10**18, 30
        );
        
        vm.prank(user1);
        uint256 policyId = insurance.purchaseInsurance(productId, 1000 * 10**18);
        
        vm.prank(user1);
        uint256 claimId = insurance.submitClaim(
            policyId,
            CowGuardInsurance.ClaimType.RugPull,
            500 * 10**18,
            bytes32(0)
        );
        
        // Fund insurance pool
        vm.prank(owner);
        usdt.transfer(address(insurance), 10000 * 10**18);
        
        // Process claim
        uint256 balanceBefore = usdt.balanceOf(user1);
        
        vm.prank(owner);
        insurance.processClaim(claimId, true, 500 * 10**18);
        
        uint256 balanceAfter = usdt.balanceOf(user1);
        assertEq(balanceAfter - balanceBefore, 500 * 10**18);
    }

    function testCancelPolicy() public {
        vm.prank(owner);
        uint256 productId = insurance.createProduct(
            CowGuardInsurance.InsuranceType.RugPull,
            500, 8000, 100 * 10**18, 10000 * 10**18, 30
        );
        
        vm.prank(user1);
        uint256 policyId = insurance.purchaseInsurance(productId, 1000 * 10**18);
        
        // Cancel policy
        vm.prank(user1);
        insurance.cancelPolicy(policyId);
    }

    function testPauseUnpause() public {
        vm.prank(owner);
        insurance.pause();
        
        vm.prank(owner);
        uint256 productId = insurance.createProduct(
            CowGuardInsurance.InsuranceType.RugPull,
            500, 8000, 100 * 10**18, 10000 * 10**18, 30
        );
        
        vm.prank(user1);
        vm.expectRevert();
        insurance.purchaseInsurance(productId, 1000 * 10**18);
        
        vm.prank(owner);
        insurance.unpause();
        
        vm.prank(user1);
        insurance.purchaseInsurance(productId, 1000 * 10**18);
    }
}
