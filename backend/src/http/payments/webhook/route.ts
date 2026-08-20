import { fail, ok } from "@backend/api/response";
import {
  addNotification,
  getDemoStore,
  setPaymentVerified,
  setPlotPsid,
  setPlotStatus,
} from "@backend/demo/store";
import { getPaymentGateway } from "@backend/payments";

/**
 * Gateway webhook. Status changes only after verifyWebhook() (signature checked).
 * Never trusts client-reported payment success.
 * Rejects payment if PSID / reservation payment window has expired.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  try {
    const gateway = getPaymentGateway();
    const verified = await gateway.verifyWebhook(request.headers, rawBody);
    const store = getDemoStore();
    const tx = store.transactions.find(
      (t) => t.gateway_ref === verified.gatewayRef,
    );
    if (!tx) {
      return fail("NOT_FOUND", "Transaction not found", 404);
    }

    if (tx.status === "success") {
      return ok({ duplicate: true });
    }

    const reservation = store.reservations.find(
      (r) => r.id === tx.reservation_id,
    );
    if (!reservation) {
      return fail("NOT_FOUND", "Reservation not found", 404);
    }

    const now = Date.now();
    const psidDeadline = tx.psid_expires_at
      ? new Date(tx.psid_expires_at).getTime()
      : new Date(reservation.expires_at).getTime();

    if (
      verified.status === "success" &&
      reservation.status === "pending_payment" &&
      now > psidDeadline
    ) {
      tx.status = "failed";
      tx.raw_payload = {
        ...(typeof tx.raw_payload === "object" && tx.raw_payload
          ? tx.raw_payload
          : {}),
        rejected: "psid_expired",
        attemptedAt: new Date().toISOString(),
      };
      addNotification(
        reservation.customer_id,
        "PSID expired — payment rejected",
        "This KuickPay PSID expired after 2 hours. No payment was accepted. Generate a new voucher or use your extension if offered.",
      );
      return fail(
        "PSID_EXPIRED",
        "This PSID expired. Payment cannot be accepted after the 2-hour deadline.",
        400,
      );
    }

    if (
      verified.status === "success" &&
      reservation.status !== "pending_payment"
    ) {
      return fail(
        "INVALID_STATE",
        "Reservation is not awaiting payment for this PSID.",
        400,
      );
    }

    tx.status = verified.status === "success" ? "success" : "failed";
    tx.raw_payload = verified.payload;
    if (verified.psid) {
      tx.psid = verified.psid;
    }

    if (verified.status === "success") {
      reservation.status = "reserved";
      reservation.token_amount_paid = verified.amount;
      setPlotStatus(reservation.plot_id, "reserved");
      setPaymentVerified(reservation.plot_id, true);
      if (tx.psid) setPlotPsid(reservation.plot_id, tx.psid);
      addNotification(
        reservation.customer_id,
        "Token payment confirmed",
        "Your plot is reserved. Upload legal documents to continue.",
      );
    } else {
      reservation.status = "cancelled";
      setPlotStatus(reservation.plot_id, "available");
      setPaymentVerified(reservation.plot_id, false);
      addNotification(
        reservation.customer_id,
        "Payment failed",
        "Token payment failed. The plot was released.",
      );
    }

    return ok({
      processed: true,
      status: tx.status,
      payment_verified: verified.status === "success",
      psid: tx.psid,
    });
  } catch {
    return fail("WEBHOOK_INVALID", "Webhook verification failed", 400);
  }
}
