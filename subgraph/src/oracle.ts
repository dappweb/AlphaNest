import { BigInt, Bytes } from '@graphprotocol/graph-ts';
import {
  TokenReported,
  TokenStatusUpdated,
  DisputeFiled,
  DisputeResolved,
} from '../generated/AlphaGuardOracle/AlphaGuardOracle';
import { TokenReport, Dispute } from '../generated/schema';

function getTokenStatusString(status: i32): string {
  switch (status) {
    case 0:
      return 'UNKNOWN';
    case 1:
      return 'SAFE';
    case 2:
      return 'RUGGED';
    case 3:
      return 'DISPUTED';
    default:
      return 'UNKNOWN';
  }
}

export function handleTokenReported(event: TokenReported): void {
  let report = new TokenReport(event.params.reportId.toString());
  report.reportId = event.params.reportId;
  report.token = event.params.token;
  report.status = getTokenStatusString(event.params.status);
  report.reporter = event.params.reporter;
  report.evidence = event.params.evidence;
  report.reportedAt = event.block.timestamp;
  report.save();
}

export function handleTokenStatusUpdated(event: TokenStatusUpdated): void {
  let report = TokenReport.load(event.params.reportId.toString());
  if (!report) return;

  report.status = getTokenStatusString(event.params.newStatus);
  
  // If resolved (SAFE or RUGGED), set resolved timestamp
  if (event.params.newStatus == 1 || event.params.newStatus == 2) {
    report.resolvedAt = event.block.timestamp;
  }
  
  report.save();
}

export function handleDisputeFiled(event: DisputeFiled): void {
  let dispute = new Dispute(event.params.disputeId.toString());
  dispute.disputeId = event.params.disputeId;
  dispute.report = event.params.reportId.toString();
  dispute.disputer = event.params.disputer;
  dispute.reason = event.params.reason;
  dispute.resolved = false;
  dispute.disputedAt = event.block.timestamp;
  dispute.save();
}

export function handleDisputeResolved(event: DisputeResolved): void {
  let dispute = Dispute.load(event.params.disputeId.toString());
  if (!dispute) return;

  dispute.resolved = true;
  dispute.accepted = event.params.accepted;
  dispute.resolvedAt = event.block.timestamp;
  dispute.save();
}
