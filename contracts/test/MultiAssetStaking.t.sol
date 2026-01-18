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

// Mock Chainlink Price Feed
contract MockPriceFeed {
    int256 private _price;
    uint8 private _decimals;
    
    constructor(int256 price, uint8 feedDecimals) {
        _price = price;
        _decimals = feedDecimals;
    }
    
    function decimals() external view returns (uint8) {
        return _decimals;
    }
    
    function description() external pure returns (string memory) {
        return "Mock Price Feed";
    }
    
    function version() external pure returns (uint256) {
        return 1;
    }
    
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (1, _price, block.timestamp, block.timestamp, 1);
    }
    
    function setPrice(int256 newPrice) external {
        _price = newPrice;
    }
}

/**
 * @title MultiAssetStakingTest
 * @notice Tests for MultiAssetStaking contract
 * @dev Supports staking BNB/ETH, Four.meme tokens, and other ERC20 tokens
 */
contract MultiAssetStakingTest is Test {
    MultiAssetStaking public staking;
    MockToken public rewardToken;
    MockToken public fourMeme;
    MockToken public usdt;
    MockPriceFeed public nativePriceFeed;
    MockPriceFeed public fourMemePriceFeed;
    
    address public owner = address(1);
    address public treasury = address(2);
    address public user1 = address(3);
    address public user2 = address(4);
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy mock tokens
        rewardToken = new MockToken("Reward Token", "RWD");
        fourMeme = new MockToken("Four.meme", "FOUR");
        usdt = new MockToken("Tether USD", "USDT");
        
        // Deploy mock price feeds
        // BNB/ETH at $600, 8 decimals (Chainlink standard)
        nativePriceFeed = new MockPriceFeed(600 * 10**8, 8);
        // FOUR at $0.01
        fourMemePriceFeed = new MockPriceFeed(1 * 10**6, 8); // $0.01
        
        // Deploy staking contract with Chainlink integration
        staking = new MultiAssetStaking(
            address(rewardToken),     // reward token
            treasury,                  // treasury
            address(nativePriceFeed)   // native (ETH/BNB) price feed
        );
        
        // Add supported tokens
        staking.addStakeableToken(
            address(fourMeme),
            "FOUR",
            18,
            1500, // 15% base APY
            150,  // 1.5x multiplier
            100 * 10**18 // min stake
        );
        
        staking.addStakeableToken(
            address(usdt),
            "USDT",
            18,
            1000, // 10% base APY
            100,  // 1x multiplier
            50 * 10**18 // min stake
        );
        
        // Set price feed for FOUR token
        staking.setPriceFeed(address(fourMeme), address(fourMemePriceFeed));
        
        // Distribute tokens to users
        fourMeme.transfer(user1, 10000 * 10**18);
        fourMeme.transfer(user2, 10000 * 10**18);
        usdt.transfer(user1, 10000 * 10**18);
        usdt.transfer(user2, 10000 * 10**18);
        
        // Fund contract with reward tokens
        rewardToken.transfer(address(staking), 100000 * 10**18);
        
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
        
        // Give users some native token (ETH/BNB)
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
    }

    // ============================================
    // Native Token (ETH/BNB) Staking Tests
    // ============================================

    function testStakeETH() public {
        uint256 stakeAmount = 1 ether;
        
        vm.prank(user1);
        staking.stakeETH{value: stakeAmount}(MultiAssetStaking.LockPeriod.Flexible);
        
        // Check stake info
        (uint256 stakedAmount,,,,,,) = staking.getStakeInfo(user1, address(0));
        assertEq(stakedAmount, stakeAmount);
    }

    function testStakeETHWithLock() public {
        uint256 stakeAmount = 1 ether;
        
        vm.prank(user1);
        staking.stakeETH{value: stakeAmount}(MultiAssetStaking.LockPeriod.ThirtyDays);
        
        (uint256 stakedAmount,, MultiAssetStaking.LockPeriod lockPeriod, uint256 unlockTime,,,) = staking.getStakeInfo(user1, address(0));
        assertEq(stakedAmount, stakeAmount);
        assertEq(uint8(lockPeriod), uint8(MultiAssetStaking.LockPeriod.ThirtyDays));
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
        vm.expectRevert("Below minimum");
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

    function testUnstakeETH() public {
        uint256 stakeAmount = 1 ether;
        
        vm.prank(user1);
        staking.stakeETH{value: stakeAmount}(MultiAssetStaking.LockPeriod.Flexible);
        
        uint256 balanceBefore = user1.balance;
        
        vm.prank(user1);
        staking.unstake(address(0));
        
        uint256 balanceAfter = user1.balance;
        assertEq(balanceAfter - balanceBefore, stakeAmount);
    }

    function testUnstakeLockedFails() public {
        uint256 stakeAmount = 1 ether;
        
        vm.prank(user1);
        staking.stakeETH{value: stakeAmount}(MultiAssetStaking.LockPeriod.ThirtyDays);
        
        vm.prank(user1);
        vm.expectRevert("Still locked");
        staking.unstake(address(0));
    }

    function testUnstakeAfterLockExpires() public {
        uint256 stakeAmount = 1 ether;
        
        vm.prank(user1);
        staking.stakeETH{value: stakeAmount}(MultiAssetStaking.LockPeriod.ThirtyDays);
        
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
        
        uint256 balanceBefore = rewardToken.balanceOf(user1);
        
        vm.prank(user1);
        staking.claimRewards(address(fourMeme));
        
        uint256 balanceAfter = rewardToken.balanceOf(user1);
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
    // Chainlink Price Feed Tests
    // ============================================

    function testGetTokenPriceFromChainlink() public view {
        // Native token price should come from Chainlink feed
        uint256 nativePrice = staking.getTokenPrice(address(0));
        assertEq(nativePrice, 600 * 10**18, "Native price should be $600");
        
        // FOUR token price from its feed
        uint256 fourPrice = staking.getTokenPrice(address(fourMeme));
        assertEq(fourPrice, 1 * 10**16, "FOUR price should be $0.01");
    }

    function testPriceFeedHealthCheck() public view {
        (bool healthy, string memory reason) = staking.isPriceFeedHealthy(address(0));
        assertTrue(healthy, "Native price feed should be healthy");
        assertEq(reason, "Healthy");
    }

    function testFallbackPriceWhenNoFeed() public view {
        // USDT has no feed set, should use fallback
        uint256 usdtPrice = staking.getTokenPrice(address(usdt));
        // Fallback for unknown tokens
        assertTrue(usdtPrice > 0, "Should have a fallback price");
    }

    function testSetPriceFeed() public {
        MockPriceFeed newFeed = new MockPriceFeed(2 * 10**8, 8); // $2
        
        vm.prank(owner);
        staking.setPriceFeed(address(usdt), address(newFeed));
        
        uint256 usdtPrice = staking.getTokenPrice(address(usdt));
        assertEq(usdtPrice, 2 * 10**18, "USDT price should be $2 from new feed");
    }

    function testDisableChainlink() public {
        vm.prank(owner);
        staking.setOracleSettings(false, 3600);
        
        // Should use fallback price now
        uint256 nativePrice = staking.getTokenPrice(address(0));
        assertEq(nativePrice, 600 * 10**18, "Should use fallback price ($600)");
    }

    // ============================================
    // Admin Tests
    // ============================================

    function testAddStakeableToken() public {
        MockToken newToken = new MockToken("New Token", "NEW");
        
        vm.prank(owner);
        staking.addStakeableToken(
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

    function testRemoveStakeableToken() public {
        vm.prank(owner);
        staking.removeStakeableToken(address(fourMeme));
        
        // Token is deactivated, not removed from list
        (,,,,,bool isActive,,) = staking.getTokenConfig(address(fourMeme));
        assertFalse(isActive, "Token should be inactive");
    }

    function testPauseUnpause() public {
        vm.prank(owner);
        staking.pause();
        
        vm.prank(user1);
        vm.expectRevert();
        staking.stakeETH{value: 1 ether}(MultiAssetStaking.LockPeriod.Flexible);
        
        vm.prank(owner);
        staking.unpause();
        
        vm.prank(user1);
        staking.stakeETH{value: 1 ether}(MultiAssetStaking.LockPeriod.Flexible);
    }

    // ============================================
    // Global Stats Tests
    // ============================================

    function testGlobalStats() public {
        vm.prank(user1);
        staking.stakeETH{value: 1 ether}(MultiAssetStaking.LockPeriod.Flexible);
        
        vm.prank(user2);
        staking.stakeToken(address(fourMeme), 1000 * 10**18, MultiAssetStaking.LockPeriod.ThirtyDays);
        
        (uint256 totalStakedUSD, uint256 totalStakers,,) = staking.getGlobalStats();
        
        assertTrue(totalStakedUSD > 0, "Should have total staked");
        assertEq(totalStakers, 2, "Should have 2 stakers");
    }
}
