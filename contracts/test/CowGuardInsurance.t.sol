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
    uint256 public constant COVERAGE_RATE = 8000; // 80%

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
            COVERAGE_RATE, // 80% coverage rate
            100 * 10**18,   // min coverage
            10000 * 10**18, // max coverage
            30    // 30 days duration
        );
        
        // productCounter starts at 0, so first product ID is 0
        assertEq(productId, 0);
    }

    function testCreateProductOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        insurance.createProduct(
            CowGuardInsurance.InsuranceType.RugPull,
            500, COVERAGE_RATE, 100 * 10**18, 10000 * 10**18, 30
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
            500, COVERAGE_RATE, 100 * 10**18, 10000 * 10**18, 30
        );
        
        // Purchase policy
        uint256 coverageAmount = 1000 * 10**18;
        vm.prank(user1);
        uint256 policyId = insurance.purchaseInsurance(productId, coverageAmount);
        
        // policyCounter starts at 0, so first policy ID is 0
        assertEq(policyId, 0);
        
        // Verify policy info
        (
            uint256 policyProductId,
            address holder,
            uint256 coverage,
            ,,,
        ) = insurance.getPolicyInfo(policyId);
        
        assertEq(policyProductId, productId);
        assertEq(holder, user1);
        assertEq(coverage, coverageAmount);
    }

    function testPurchasePolicyInvalidCoverage() public {
        vm.prank(owner);
        uint256 productId = insurance.createProduct(
            CowGuardInsurance.InsuranceType.RugPull,
            500, COVERAGE_RATE, 100 * 10**18, 10000 * 10**18, 30
        );
        
        // Try to purchase with coverage below minimum
        vm.prank(user1);
        vm.expectRevert("Invalid coverage amount");
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
            500, COVERAGE_RATE, 100 * 10**18, 10000 * 10**18, 30
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
        
        // claimCounter starts at 0 but is pre-incremented (++claimCounter), so first claim ID is 1
        assertEq(claimId, 1);
    }

    function testSubmitClaimNotHolder() public {
        vm.prank(owner);
        uint256 productId = insurance.createProduct(
            CowGuardInsurance.InsuranceType.RugPull,
            500, COVERAGE_RATE, 100 * 10**18, 10000 * 10**18, 30
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
            500, COVERAGE_RATE, 100 * 10**18, 10000 * 10**18, 30
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
        
        // Calculate expected payout:
        // actualPayout = payoutAmount * coverageRate / 10000 = 500 * 8000 / 10000 = 400 USDT
        // fee = actualPayout * treasuryFee / 10000 = 400 * 200 / 10000 = 8 USDT
        // netPayout = actualPayout - fee = 400 - 8 = 392 USDT
        uint256 expectedPayout = (500 * 10**18 * COVERAGE_RATE / 10000);
        uint256 fee = expectedPayout * PROTOCOL_FEE / 10000;
        uint256 expectedNet = expectedPayout - fee;
        
        assertEq(balanceAfter - balanceBefore, expectedNet, "User should receive net payout");
    }

    function testCancelPolicy() public {
        vm.prank(owner);
        uint256 productId = insurance.createProduct(
            CowGuardInsurance.InsuranceType.RugPull,
            500, COVERAGE_RATE, 100 * 10**18, 10000 * 10**18, 30
        );
        
        vm.prank(user1);
        uint256 policyId = insurance.purchaseInsurance(productId, 1000 * 10**18);
        
        // Cancel policy
        vm.prank(user1);
        insurance.cancelPolicy(policyId);
        
        // Verify policy is cancelled
        (,,,,,, CowGuardInsurance.PolicyStatus status) = insurance.getPolicyInfo(policyId);
        assertEq(uint8(status), uint8(CowGuardInsurance.PolicyStatus.Cancelled));
    }

    function testPauseUnpause() public {
        vm.prank(owner);
        uint256 productId = insurance.createProduct(
            CowGuardInsurance.InsuranceType.RugPull,
            500, COVERAGE_RATE, 100 * 10**18, 10000 * 10**18, 30
        );
        
        vm.prank(owner);
        insurance.setProtocolPaused(true);
        
        vm.prank(user1);
        vm.expectRevert("Protocol paused");
        insurance.purchaseInsurance(productId, 1000 * 10**18);
        
        vm.prank(owner);
        insurance.setProtocolPaused(false);
        
        vm.prank(user1);
        insurance.purchaseInsurance(productId, 1000 * 10**18);
    }

    // ============================================
    // Protocol Stats Tests
    // ============================================

    function testProtocolStats() public {
        vm.prank(owner);
        insurance.createProduct(
            CowGuardInsurance.InsuranceType.RugPull,
            500, COVERAGE_RATE, 100 * 10**18, 10000 * 10**18, 30
        );
        vm.prank(owner);
        insurance.createProduct(
            CowGuardInsurance.InsuranceType.PriceDrop,
            800, 6000, 100 * 10**18, 5000 * 10**18, 14
        );
        
        (uint256 productCount,,,) = insurance.getProtocolStats();
        assertEq(productCount, 2);
    }

    function testCalculatePremium() public {
        vm.prank(owner);
        uint256 productId = insurance.createProduct(
            CowGuardInsurance.InsuranceType.RugPull,
            500, // 5% premium
            COVERAGE_RATE, 
            100 * 10**18, 
            10000 * 10**18, 
            30
        );
        
        uint256 coverageAmount = 1000 * 10**18;
        uint256 premium = insurance.calculatePremium(productId, coverageAmount);
        
        // Premium = 1000 * 500 / 10000 = 50 USDT
        assertEq(premium, 50 * 10**18);
    }
}
