// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MultiAssetStaking.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @title MultiAssetStakingTest
 * @notice Tests for MultiAssetStaking contract
 * @dev Supports staking BNB, Four.meme tokens, and other BEP20 tokens
 */
contract MultiAssetStakingTest is Test {
    MultiAssetStaking public staking;
    MockToken public fourMeme;
    MockToken public usdt;
    
    address public owner = address(1);
    address public user1 = address(3);
    address public user2 = address(4);
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy staking contract
        staking = new MultiAssetStaking(owner);
        
        // Deploy mock tokens
        fourMeme = new MockToken("Four.meme", "FOUR");
        usdt = new MockToken("Tether USD", "USDT");
        
        // Add supported tokens
        staking.addSupportedToken(
            address(fourMeme),
            "FOUR",
            18,
            1500, // 15% base APY
            150,  // 1.5x multiplier
            100 * 10**18 // min stake
        );
        
        staking.addSupportedToken(
            address(usdt),
            "USDT",
            18,
            1000, // 10% base APY
            100,  // 1x multiplier
            50 * 10**18 // min stake
        );
        
        // Distribute tokens to users
        fourMeme.transfer(user1, 10000 * 10**18);
        fourMeme.transfer(user2, 10000 * 10**18);
        usdt.transfer(user1, 10000 * 10**18);
        usdt.transfer(user2, 10000 * 10**18);
        
        // Fund contract with reward tokens
        fourMeme.transfer(address(staking), 100000 * 10**18);
        
        vm.stopPrank();
        
        // Approve staking contract
        vm.prank(user1);
        fourMeme.approve(address(staking), type(uint256).max);
        vm.prank(user1);
        usdt.approve(address(staking), type(uint256).max);
        
        vm.prank(user2);
        fourMeme.approve(address(staking), type(uint256).max);
        vm.prank(user2);
        usdt.approve(address(staking), type(uint256).max);
        
        // Give users some BNB
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
    }

    // ============================================
    // BNB Staking Tests
    // ============================================

    function testStakeBNB() public {
        uint256 stakeAmount = 1 ether;
        
        vm.prank(user1);
        staking.stakeBNB{value: stakeAmount}(MultiAssetStaking.LockPeriod.Flexible);
        
        // Check stake info
        (uint256 stakedAmount,,,,,,) = staking.getStakeInfo(user1, address(0));
        assertEq(stakedAmount, stakeAmount);
    }

    function testStakeBNBWithLock() public {
        uint256 stakeAmount = 1 ether;
        
        vm.prank(user1);
        staking.stakeBNB{value: stakeAmount}(MultiAssetStaking.LockPeriod.ThirtyDays);
        
        (uint256 stakedAmount,, uint8 lockPeriod, uint256 unlockTime,,,) = staking.getStakeInfo(user1, address(0));
        assertEq(stakedAmount, stakeAmount);
        assertEq(lockPeriod, uint8(MultiAssetStaking.LockPeriod.ThirtyDays));
        assertTrue(unlockTime > block.timestamp);
    }

    // ============================================
    // Token Staking Tests (Four.meme)
    // ============================================

    function testStakeToken() public {
        uint256 stakeAmount = 1000 * 10**18;
        
        vm.prank(user1);
        staking.stakeToken(address(fourMeme), stakeAmount, MultiAssetStaking.LockPeriod.Flexible);
        
        (uint256 stakedAmount,,,,,,) = staking.getStakeInfo(user1, address(fourMeme));
        assertEq(stakedAmount, stakeAmount);
    }

    function testStakeTokenBelowMinimum() public {
        uint256 stakeAmount = 10 * 10**18; // Below 100 minimum
        
        vm.prank(user1);
        vm.expectRevert("Below minimum stake");
        staking.stakeToken(address(fourMeme), stakeAmount, MultiAssetStaking.LockPeriod.Flexible);
    }

    function testStakeUnsupportedToken() public {
        MockToken unsupported = new MockToken("Unsupported", "UNS");
        unsupported.transfer(user1, 1000 * 10**18);
        
        vm.prank(user1);
        unsupported.approve(address(staking), type(uint256).max);
        
        vm.prank(user1);
        vm.expectRevert("Token not supported");
        staking.stakeToken(address(unsupported), 100 * 10**18, MultiAssetStaking.LockPeriod.Flexible);
    }

    // ============================================
    // Unstake Tests
    // ============================================

    function testUnstakeBNB() public {
        uint256 stakeAmount = 1 ether;
        
        vm.prank(user1);
        staking.stakeBNB{value: stakeAmount}(MultiAssetStaking.LockPeriod.Flexible);
        
        uint256 balanceBefore = user1.balance;
        
        vm.prank(user1);
        staking.unstake(address(0));
        
        uint256 balanceAfter = user1.balance;
        assertEq(balanceAfter - balanceBefore, stakeAmount);
    }

    function testUnstakeLockedFails() public {
        uint256 stakeAmount = 1 ether;
        
        vm.prank(user1);
        staking.stakeBNB{value: stakeAmount}(MultiAssetStaking.LockPeriod.ThirtyDays);
        
        vm.prank(user1);
        vm.expectRevert("Still locked");
        staking.unstake(address(0));
    }

    function testUnstakeAfterLockExpires() public {
        uint256 stakeAmount = 1 ether;
        
        vm.prank(user1);
        staking.stakeBNB{value: stakeAmount}(MultiAssetStaking.LockPeriod.ThirtyDays);
        
        // Fast forward 31 days
        vm.warp(block.timestamp + 31 days);
        
        uint256 balanceBefore = user1.balance;
        
        vm.prank(user1);
        staking.unstake(address(0));
        
        uint256 balanceAfter = user1.balance;
        assertEq(balanceAfter - balanceBefore, stakeAmount);
    }

    // ============================================
    // Reward Tests
    // ============================================

    function testClaimRewards() public {
        uint256 stakeAmount = 1000 * 10**18;
        
        vm.prank(user1);
        staking.stakeToken(address(fourMeme), stakeAmount, MultiAssetStaking.LockPeriod.Flexible);
        
        // Fast forward 30 days
        vm.warp(block.timestamp + 30 days);
        
        (,,,,,, uint256 pendingRewards) = staking.getStakeInfo(user1, address(fourMeme));
        assertTrue(pendingRewards > 0, "Should have pending rewards");
        
        uint256 balanceBefore = fourMeme.balanceOf(user1);
        
        vm.prank(user1);
        staking.claimRewards(address(fourMeme));
        
        uint256 balanceAfter = fourMeme.balanceOf(user1);
        assertTrue(balanceAfter > balanceBefore, "Should have received rewards");
    }

    // ============================================
    // Lock Period Multiplier Tests
    // ============================================

    function testLockPeriodMultipliers() public {
        // Test different lock periods have different multipliers
        uint256 flexibleMultiplier = staking.getRewardMultiplier(MultiAssetStaking.LockPeriod.Flexible);
        uint256 thirtyDayMultiplier = staking.getRewardMultiplier(MultiAssetStaking.LockPeriod.ThirtyDays);
        uint256 yearMultiplier = staking.getRewardMultiplier(MultiAssetStaking.LockPeriod.ThreeSixtyFiveDays);
        
        assertTrue(thirtyDayMultiplier > flexibleMultiplier, "30 day should have higher multiplier");
        assertTrue(yearMultiplier > thirtyDayMultiplier, "365 day should have highest multiplier");
    }

    // ============================================
    // Admin Tests
    // ============================================

    function testAddSupportedToken() public {
        MockToken newToken = new MockToken("New Token", "NEW");
        
        vm.prank(owner);
        staking.addSupportedToken(
            address(newToken),
            "NEW",
            18,
            2000, // 20% APY
            200,  // 2x multiplier
            10 * 10**18
        );
        
        address[] memory tokens = staking.getSupportedTokens();
        bool found = false;
        for (uint i = 0; i < tokens.length; i++) {
            if (tokens[i] == address(newToken)) {
                found = true;
                break;
            }
        }
        assertTrue(found, "New token should be in supported list");
    }

    function testRemoveSupportedToken() public {
        vm.prank(owner);
        staking.removeSupportedToken(address(fourMeme));
        
        vm.prank(user1);
        vm.expectRevert("Token not supported");
        staking.stakeToken(address(fourMeme), 100 * 10**18, MultiAssetStaking.LockPeriod.Flexible);
    }

    function testPauseUnpause() public {
        vm.prank(owner);
        staking.pause();
        
        vm.prank(user1);
        vm.expectRevert();
        staking.stakeBNB{value: 1 ether}(MultiAssetStaking.LockPeriod.Flexible);
        
        vm.prank(owner);
        staking.unpause();
        
        vm.prank(user1);
        staking.stakeBNB{value: 1 ether}(MultiAssetStaking.LockPeriod.Flexible);
    }

    // ============================================
    // Global Stats Tests
    // ============================================

    function testGlobalStats() public {
        vm.prank(user1);
        staking.stakeBNB{value: 1 ether}(MultiAssetStaking.LockPeriod.Flexible);
        
        vm.prank(user2);
        staking.stakeToken(address(fourMeme), 1000 * 10**18, MultiAssetStaking.LockPeriod.ThirtyDays);
        
        (uint256 totalStakedUSD, uint256 totalStakers,,) = staking.getGlobalStats();
        
        assertTrue(totalStakedUSD > 0, "Should have total staked");
        assertEq(totalStakers, 2, "Should have 2 stakers");
    }
}
