// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AlphaGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1_000_000 * 10**6);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract AlphaGuardTest is Test {
    AlphaGuard public alphaGuard;
    MockUSDC public usdc;
    
    address public owner = address(1);
    address public oracle = address(2);
    address public user1 = address(3);
    address public user2 = address(4);
    address public memeToken = address(5);
    
    uint256 public constant PROTOCOL_FEE = 200; // 2%
    uint256 public constant MIN_BET = 10 * 10**6; // 10 USDC
    uint256 public constant MAX_BET = 1000 * 10**6; // 1000 USDC

    function setUp() public {
        vm.startPrank(owner);
        
        usdc = new MockUSDC();
        alphaGuard = new AlphaGuard(address(usdc), oracle, PROTOCOL_FEE);
        
        // Distribute USDC to users
        usdc.transfer(user1, 10000 * 10**6);
        usdc.transfer(user2, 10000 * 10**6);
        
        vm.stopPrank();
        
        // Approve AlphaGuard
        vm.prank(user1);
        usdc.approve(address(alphaGuard), type(uint256).max);
        
        vm.prank(user2);
        usdc.approve(address(alphaGuard), type(uint256).max);
    }

    // ============================================
    // Pool Creation Tests
    // ============================================

    function testCreatePool() public {
        vm.prank(owner);
        uint256 poolId = alphaGuard.createPool(memeToken, 1 days, MIN_BET, MAX_BET);
        
        assertEq(poolId, 0);
        
        (
            address token,
            uint256 totalRugBets,
            uint256 totalSafeBets,
            uint256 expiresAt,
            AlphaGuard.PoolStatus status,
            AlphaGuard.Outcome outcome
        ) = alphaGuard.getPoolInfo(poolId);
        
        assertEq(token, memeToken);
        assertEq(totalRugBets, 0);
        assertEq(totalSafeBets, 0);
        assertEq(expiresAt, block.timestamp + 1 days);
        assertEq(uint256(status), uint256(AlphaGuard.PoolStatus.ACTIVE));
        assertEq(uint256(outcome), uint256(AlphaGuard.Outcome.PENDING));
    }

    function testCreatePoolOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        alphaGuard.createPool(memeToken, 1 days, MIN_BET, MAX_BET);
    }

    function testCreatePoolInvalidDuration() public {
        vm.prank(owner);
        vm.expectRevert("Invalid duration");
        alphaGuard.createPool(memeToken, 30 minutes, MIN_BET, MAX_BET);
    }

    // ============================================
    // Policy Purchase Tests
    // ============================================

    function testPurchasePolicyRug() public {
        // Create pool
        vm.prank(owner);
        uint256 poolId = alphaGuard.createPool(memeToken, 1 days, MIN_BET, MAX_BET);
        
        // Purchase policy
        uint256 betAmount = 100 * 10**6;
        vm.prank(user1);
        uint256 policyId = alphaGuard.purchasePolicy(poolId, AlphaGuard.Position.RUG, betAmount);
        
        assertEq(policyId, 0);
        
        (,uint256 totalRugBets,,,, ) = alphaGuard.getPoolInfo(poolId);
        assertEq(totalRugBets, betAmount);
        
        // Check policy
        (
            uint256 pPoolId,
            address holder,
            AlphaGuard.Position position,
            uint256 amount,
            ,
            bool claimed
        ) = alphaGuard.policies(policyId);
        
        assertEq(pPoolId, poolId);
        assertEq(holder, user1);
        assertEq(uint256(position), uint256(AlphaGuard.Position.RUG));
        assertEq(amount, betAmount);
        assertFalse(claimed);
    }

    function testPurchasePolicySafe() public {
        vm.prank(owner);
        uint256 poolId = alphaGuard.createPool(memeToken, 1 days, MIN_BET, MAX_BET);
        
        uint256 betAmount = 100 * 10**6;
        vm.prank(user2);
        alphaGuard.purchasePolicy(poolId, AlphaGuard.Position.SAFE, betAmount);
        
        (,, uint256 totalSafeBets,,, ) = alphaGuard.getPoolInfo(poolId);
        assertEq(totalSafeBets, betAmount);
    }

    function testPurchasePolicyInvalidAmount() public {
        vm.prank(owner);
        uint256 poolId = alphaGuard.createPool(memeToken, 1 days, MIN_BET, MAX_BET);
        
        vm.prank(user1);
        vm.expectRevert("Invalid amount");
        alphaGuard.purchasePolicy(poolId, AlphaGuard.Position.RUG, 1 * 10**6); // Too small
    }

    // ============================================
    // Pool Resolution Tests
    // ============================================

    function testResolvePoolRugged() public {
        // Setup
        vm.prank(owner);
        uint256 poolId = alphaGuard.createPool(memeToken, 1 days, MIN_BET, MAX_BET);
        
        vm.prank(user1);
        alphaGuard.purchasePolicy(poolId, AlphaGuard.Position.RUG, 100 * 10**6);
        
        vm.prank(user2);
        alphaGuard.purchasePolicy(poolId, AlphaGuard.Position.SAFE, 200 * 10**6);
        
        // Fast forward
        vm.warp(block.timestamp + 1 days + 1);
        
        // Resolve
        vm.prank(oracle);
        alphaGuard.resolvePool(poolId, AlphaGuard.Outcome.RUGGED);
        
        (,,,, AlphaGuard.PoolStatus status, AlphaGuard.Outcome outcome) = alphaGuard.getPoolInfo(poolId);
        assertEq(uint256(status), uint256(AlphaGuard.PoolStatus.RESOLVED));
        assertEq(uint256(outcome), uint256(AlphaGuard.Outcome.RUGGED));
    }

    function testResolvePoolOnlyOracle() public {
        vm.prank(owner);
        uint256 poolId = alphaGuard.createPool(memeToken, 1 days, MIN_BET, MAX_BET);
        
        vm.warp(block.timestamp + 1 days + 1);
        
        vm.prank(user1);
        vm.expectRevert("Only oracle");
        alphaGuard.resolvePool(poolId, AlphaGuard.Outcome.RUGGED);
    }

    // ============================================
    // Payout Tests
    // ============================================

    function testClaimPayoutWinner() public {
        // Setup pool and bets
        vm.prank(owner);
        uint256 poolId = alphaGuard.createPool(memeToken, 1 days, MIN_BET, MAX_BET);
        
        vm.prank(user1);
        uint256 policy1 = alphaGuard.purchasePolicy(poolId, AlphaGuard.Position.RUG, 100 * 10**6);
        
        vm.prank(user2);
        alphaGuard.purchasePolicy(poolId, AlphaGuard.Position.SAFE, 200 * 10**6);
        
        // Resolve as RUGGED (user1 wins)
        vm.warp(block.timestamp + 1 days + 1);
        vm.prank(oracle);
        alphaGuard.resolvePool(poolId, AlphaGuard.Outcome.RUGGED);
        
        // Calculate expected payout
        uint256 totalPool = 300 * 10**6;
        uint256 fee = (totalPool * PROTOCOL_FEE) / 10000;
        uint256 payoutPool = totalPool - fee;
        
        uint256 balanceBefore = usdc.balanceOf(user1);
        
        vm.prank(user1);
        alphaGuard.claimPayout(policy1);
        
        uint256 balanceAfter = usdc.balanceOf(user1);
        assertEq(balanceAfter - balanceBefore, payoutPool);
    }

    function testClaimPayoutLoser() public {
        vm.prank(owner);
        uint256 poolId = alphaGuard.createPool(memeToken, 1 days, MIN_BET, MAX_BET);
        
        vm.prank(user1);
        uint256 policy1 = alphaGuard.purchasePolicy(poolId, AlphaGuard.Position.RUG, 100 * 10**6);
        
        vm.prank(user2);
        alphaGuard.purchasePolicy(poolId, AlphaGuard.Position.SAFE, 200 * 10**6);
        
        // Resolve as SAFE (user1 loses)
        vm.warp(block.timestamp + 1 days + 1);
        vm.prank(oracle);
        alphaGuard.resolvePool(poolId, AlphaGuard.Outcome.SAFE);
        
        vm.prank(user1);
        vm.expectRevert("No payout");
        alphaGuard.claimPayout(policy1);
    }

    function testClaimPayoutCancelled() public {
        vm.prank(owner);
        uint256 poolId = alphaGuard.createPool(memeToken, 1 days, MIN_BET, MAX_BET);
        
        uint256 betAmount = 100 * 10**6;
        vm.prank(user1);
        uint256 policy1 = alphaGuard.purchasePolicy(poolId, AlphaGuard.Position.RUG, betAmount);
        
        // Cancel pool
        vm.prank(owner);
        alphaGuard.cancelPool(poolId);
        
        uint256 balanceBefore = usdc.balanceOf(user1);
        
        vm.prank(user1);
        alphaGuard.claimPayout(policy1);
        
        uint256 balanceAfter = usdc.balanceOf(user1);
        assertEq(balanceAfter - balanceBefore, betAmount); // Full refund
    }

    // ============================================
    // Odds Calculation Tests
    // ============================================

    function testGetPoolOdds() public {
        vm.prank(owner);
        uint256 poolId = alphaGuard.createPool(memeToken, 1 days, MIN_BET, MAX_BET);
        
        vm.prank(user1);
        alphaGuard.purchasePolicy(poolId, AlphaGuard.Position.RUG, 100 * 10**6);
        
        vm.prank(user2);
        alphaGuard.purchasePolicy(poolId, AlphaGuard.Position.SAFE, 200 * 10**6);
        
        (uint256 rugOdds, uint256 safeOdds) = alphaGuard.getPoolOdds(poolId);
        
        // Total = 300, Rug = 100, Safe = 200
        // Rug odds = 300/100 = 3x = 30000 basis points
        // Safe odds = 300/200 = 1.5x = 15000 basis points
        assertEq(rugOdds, 30000);
        assertEq(safeOdds, 15000);
    }

    // ============================================
    // Admin Tests
    // ============================================

    function testWithdrawFees() public {
        vm.prank(owner);
        uint256 poolId = alphaGuard.createPool(memeToken, 1 days, MIN_BET, MAX_BET);
        
        vm.prank(user1);
        alphaGuard.purchasePolicy(poolId, AlphaGuard.Position.RUG, 100 * 10**6);
        
        vm.prank(user2);
        alphaGuard.purchasePolicy(poolId, AlphaGuard.Position.SAFE, 200 * 10**6);
        
        vm.warp(block.timestamp + 1 days + 1);
        vm.prank(oracle);
        alphaGuard.resolvePool(poolId, AlphaGuard.Outcome.RUGGED);
        
        uint256 expectedFee = (300 * 10**6 * PROTOCOL_FEE) / 10000;
        
        uint256 balanceBefore = usdc.balanceOf(owner);
        
        vm.prank(owner);
        alphaGuard.withdrawFees(owner);
        
        uint256 balanceAfter = usdc.balanceOf(owner);
        assertEq(balanceAfter - balanceBefore, expectedFee);
    }

    function testPauseUnpause() public {
        vm.prank(owner);
        alphaGuard.pause();
        
        vm.prank(owner);
        uint256 poolId = alphaGuard.createPool(memeToken, 1 days, MIN_BET, MAX_BET);
        
        vm.prank(user1);
        vm.expectRevert();
        alphaGuard.purchasePolicy(poolId, AlphaGuard.Position.RUG, 100 * 10**6);
        
        vm.prank(owner);
        alphaGuard.unpause();
        
        vm.prank(user1);
        alphaGuard.purchasePolicy(poolId, AlphaGuard.Position.RUG, 100 * 10**6);
    }
}
