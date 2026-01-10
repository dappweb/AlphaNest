import { BigInt, Bytes } from '@graphprotocol/graph-ts';
import {
  PoolCreated,
  PolicyPurchased,
  PoolResolved,
  PolicyClaimed,
  PoolCancelled,
} from '../generated/AlphaGuard/AlphaGuard';
import { Pool, Policy, User, PoolResolution, GlobalStats } from '../generated/schema';

const GLOBAL_STATS_ID = 'global';

function getOrCreateGlobalStats(): GlobalStats {
  let stats = GlobalStats.load(GLOBAL_STATS_ID);
  if (!stats) {
    stats = new GlobalStats(GLOBAL_STATS_ID);
    stats.totalPools = BigInt.zero();
    stats.totalPolicies = BigInt.zero();
    stats.totalVolume = BigInt.zero();
    stats.totalPayouts = BigInt.zero();
    stats.totalUsers = BigInt.zero();
    stats.totalRugDetected = BigInt.zero();
    stats.save();
  }
  return stats;
}

function getOrCreateUser(address: Bytes, timestamp: BigInt): User {
  let user = User.load(address.toHexString());
  if (!user) {
    user = new User(address.toHexString());
    user.address = address;
    user.totalPolicies = BigInt.zero();
    user.totalInvested = BigInt.zero();
    user.totalPayout = BigInt.zero();
    user.totalWins = BigInt.zero();
    user.totalLosses = BigInt.zero();
    user.createdAt = timestamp;

    let stats = getOrCreateGlobalStats();
    stats.totalUsers = stats.totalUsers.plus(BigInt.fromI32(1));
    stats.save();
  }
  return user;
}

export function handlePoolCreated(event: PoolCreated): void {
  let pool = new Pool(event.params.poolId.toString());
  pool.poolId = event.params.poolId;
  pool.token = event.params.token;
  pool.totalRugBets = BigInt.zero();
  pool.totalSafeBets = BigInt.zero();
  pool.expiresAt = event.params.expiresAt;
  pool.minBet = event.params.minBet;
  pool.maxBet = event.params.maxBet;
  pool.status = 'ACTIVE';
  pool.outcome = 'PENDING';
  pool.createdAt = event.block.timestamp;
  pool.createdTx = event.transaction.hash;
  pool.save();

  let stats = getOrCreateGlobalStats();
  stats.totalPools = stats.totalPools.plus(BigInt.fromI32(1));
  stats.save();
}

export function handlePolicyPurchased(event: PolicyPurchased): void {
  let pool = Pool.load(event.params.poolId.toString());
  if (!pool) return;

  let policy = new Policy(event.params.policyId.toString());
  policy.policyId = event.params.policyId;
  policy.pool = pool.id;
  
  let user = getOrCreateUser(event.params.holder, event.block.timestamp);
  policy.holder = user.id;
  
  // Position: 0 = RUG, 1 = SAFE
  policy.position = event.params.position == 0 ? 'RUG' : 'SAFE';
  policy.amount = event.params.amount;
  policy.claimed = false;
  policy.createdAt = event.block.timestamp;
  policy.createdTx = event.transaction.hash;
  policy.save();

  // Update pool totals
  if (event.params.position == 0) {
    pool.totalRugBets = pool.totalRugBets.plus(event.params.amount);
  } else {
    pool.totalSafeBets = pool.totalSafeBets.plus(event.params.amount);
  }
  pool.save();

  // Update user stats
  user.totalPolicies = user.totalPolicies.plus(BigInt.fromI32(1));
  user.totalInvested = user.totalInvested.plus(event.params.amount);
  user.save();

  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.totalPolicies = stats.totalPolicies.plus(BigInt.fromI32(1));
  stats.totalVolume = stats.totalVolume.plus(event.params.amount);
  stats.save();
}

export function handlePoolResolved(event: PoolResolved): void {
  let pool = Pool.load(event.params.poolId.toString());
  if (!pool) return;

  pool.status = 'RESOLVED';
  // Outcome: 1 = RUGGED, 2 = SAFE
  pool.outcome = event.params.outcome == 1 ? 'RUGGED' : 'SAFE';
  pool.resolvedAt = event.block.timestamp;
  pool.totalPayout = event.params.totalPayout;
  pool.save();

  // Create resolution record
  let resolution = new PoolResolution(
    event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  );
  resolution.pool = pool.id;
  resolution.outcome = pool.outcome;
  resolution.totalPayout = event.params.totalPayout;
  resolution.timestamp = event.block.timestamp;
  resolution.tx = event.transaction.hash;
  resolution.save();

  // Update global stats if rugged
  if (event.params.outcome == 1) {
    let stats = getOrCreateGlobalStats();
    stats.totalRugDetected = stats.totalRugDetected.plus(BigInt.fromI32(1));
    stats.save();
  }
}

export function handlePolicyClaimed(event: PolicyClaimed): void {
  let policy = Policy.load(event.params.policyId.toString());
  if (!policy) return;

  policy.claimed = true;
  policy.payout = event.params.payout;
  policy.claimedAt = event.block.timestamp;
  policy.claimedTx = event.transaction.hash;
  policy.save();

  // Update user stats
  let user = User.load(policy.holder);
  if (user) {
    user.totalPayout = user.totalPayout.plus(event.params.payout);
    
    // Check if win or loss
    if (event.params.payout.gt(BigInt.zero())) {
      user.totalWins = user.totalWins.plus(BigInt.fromI32(1));
    } else {
      user.totalLosses = user.totalLosses.plus(BigInt.fromI32(1));
    }
    user.save();
  }

  // Update global stats
  let stats = getOrCreateGlobalStats();
  stats.totalPayouts = stats.totalPayouts.plus(event.params.payout);
  stats.save();
}

export function handlePoolCancelled(event: PoolCancelled): void {
  let pool = Pool.load(event.params.poolId.toString());
  if (!pool) return;

  pool.status = 'CANCELLED';
  pool.outcome = 'CANCELLED';
  pool.resolvedAt = event.block.timestamp;
  pool.save();
}
