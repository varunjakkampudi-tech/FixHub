import crypto from "node:crypto";
import { type Dispute, type Repository, defaultRepository } from "../db/repository";

export class DisputeService {
  constructor(private repo: Repository = defaultRepository) {}

  async raiseDispute(
    bookingId: string,
    raisedByUserId: string,
    reason: string,
    details: string,
  ): Promise<Dispute> {
    const booking = this.repo.bookings.get(bookingId);
    if (!booking) throw new Error("Booking not found");

    const disputeReference = `DSP-${Date.now().toString().slice(-6)}`;
    const dispute: Dispute = {
      id: `dsp-${crypto.randomUUID()}`,
      disputeReference,
      bookingId,
      raisedBy: raisedByUserId,
      reason,
      details,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.repo.disputes.set(dispute.id, dispute);
    booking.status = "disputed";
    booking.updatedAt = new Date().toISOString();

    return dispute;
  }

  async listDisputes(userId?: string, role?: string): Promise<Dispute[]> {
    const all = Array.from(this.repo.disputes.values());
    if (role === "admin" || !userId) {
      return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return all
      .filter((d) => d.raisedBy === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async resolveDispute(
    disputeId: string,
    resolvedByAdminId: string,
    resolutionNotes: string,
  ): Promise<Dispute> {
    const dispute = this.repo.disputes.get(disputeId);
    if (!dispute) throw new Error("Dispute not found");

    dispute.status = "resolved";
    dispute.resolvedBy = resolvedByAdminId;
    dispute.resolutionNotes = resolutionNotes;
    dispute.updatedAt = new Date().toISOString();

    return dispute;
  }
}

export const defaultDisputeService = new DisputeService(defaultRepository);
