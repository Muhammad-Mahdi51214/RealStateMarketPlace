import { fail, fromError, ok } from "@backend/api/response";
import { requireSessionUser } from "@backend/auth/session";
import { getDemoStore } from "@backend/demo/store";
import { getPaymentGateway } from "@backend/payments";
import { signKuickPayWebhook } from "@backend/payments/kuickpay";
import { signSandboxWebhook } from "@backend/payments/sandbox";
import { env } from "@backend/env.server";

/**
 * Poll payment status for a gateway ref (customer).
 * Demo: also allows ?simulate=paid to fire a signed webhook locally.
 */
export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const url = new URL(request.url);
    const ref = url.searchParams.get("ref");
    const simulate = url.searchParams.get("simulate");

    if (!ref) {
      return fail("VALIDATION_ERROR", "Missing ref", 400);
    }

    const store = getDemoStore();
    const tx = store.transactions.find((t) => t.gateway_ref === ref);
    if (!tx) {
      return fail("NOT_FOUND", "Transaction not found", 404);
    }

    const reservation = store.reservations.find(
      (r) => r.id === tx.reservation_id,
    );
    if (!reservation || reservation.customer_id !== user.id) {
      return fail("FORBIDDEN", "Not your transaction", 403);
    }

    if (simulate === "paid" && tx.status === "initiated") {
      const deadline = tx.psid_expires_at
        ? new Date(tx.psid_expires_at).getTime()
        : reservation
          ? new Date(reservation.expires_at).getTime()
          : 0;
      if (deadline && Date.now() > deadline) {
        return fail(
          "PSID_EXPIRED",
          "This PSID expired after 2 hours. Payment cannot be accepted.",
          400,
        );
      }

      const payload = {
        gatewayRef: tx.gateway_ref,
        amount: tx.amount,
        status: "success" as const,
        psid: tx.psid ?? undefined,
      };
      const raw = JSON.stringify(payload);
      const provider = env.server.PAYMENT_GATEWAY_PROVIDER;
      const signature =
        provider === "sandbox"
          ? signSandboxWebhook(payload)
          : signKuickPayWebhook(payload);

      const base = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await fetch(`${base}/api/payments/webhook`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(provider === "sandbox"
            ? { "x-sandbox-signature": signature }
            : { "x-kuickpay-signature": signature }),
        },
        body: raw,
      });
    }

    const gateway = getPaymentGateway();
    const gatewayStatus = await gateway.getStatus(ref);
    const fresh = store.transactions.find((t) => t.gateway_ref === ref)!;
    const freshRes = store.reservations.find(
      (r) => r.id === fresh.reservation_id,
    );

    return ok({
      gatewayRef: fresh.gateway_ref,
      psid: fresh.psid,
      amount: fresh.amount,
      status: fresh.status,
      gatewayStatus,
      reservationStatus: freshRes?.status ?? null,
      payment_verified: fresh.status === "success",
      provider: gateway.provider,
    });
  } catch (error) {
    return fromError(error);
  }
}
