import { randomUUID } from "crypto";
import { z } from "zod";
import { fail, fromError, ok } from "@backend/api/response";
import { requireSessionUser } from "@backend/auth/session";
import {
  getDemoStore,
  RESERVATION_WINDOW_MS,
  setPlotPsid,
} from "@backend/demo/store";
import { getPlotById } from "@backend/inventory/queries";
import { getPaymentGateway } from "@backend/payments";
import { publicEnv } from "@shared/env.public";

const schema = z.object({
  reservationId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const { reservationId } = schema.parse(await request.json());
    const store = getDemoStore();
    const reservation = store.reservations.find((r) => r.id === reservationId);
    if (!reservation || reservation.customer_id !== user.id) {
      return fail("NOT_FOUND", "Reservation not found", 404);
    }
    if (reservation.status !== "pending_payment") {
      return fail("INVALID_STATE", "Reservation is not awaiting payment", 400);
    }

    const plot = await getPlotById(reservation.plot_id);
    if (!plot) return fail("NOT_FOUND", "Plot not found", 404);

    const tokenAmount = Number(plot.token_amount);
    const issuedAt = new Date();
    const psidExpiresAt = new Date(issuedAt.getTime() + RESERVATION_WINDOW_MS);

    // PSID / payment window starts at voucher generation (2 hours)
    reservation.expires_at = psidExpiresAt.toISOString();

    // Invalidate any previous initiated PSIDs for this reservation
    for (const tx of store.transactions) {
      if (
        tx.reservation_id === reservation.id &&
        tx.status === "initiated"
      ) {
        tx.status = "failed";
        tx.raw_payload = {
          ...(tx.raw_payload ?? {}),
          superseded: true,
          reason: "New voucher generated",
        };
      }
    }

    const gateway = getPaymentGateway();
    const idempotencyKey = `${reservation.id}-${Date.now()}`;
    const result = await gateway.initiatePayment({
      reservationId: reservation.id,
      amount: tokenAmount,
      currency: "PKR",
      customerId: user.id,
      description: `Token for ${plot.plot_number}`,
      returnUrl: `${publicEnv.NEXT_PUBLIC_APP_URL}/buy-property/${plot.id}?reservationId=${reservation.id}`,
      idempotencyKey,
    });

    if (result.psid) {
      setPlotPsid(reservation.plot_id, result.psid);
    }

    const deadlineLabel = psidExpiresAt.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const instructions = [
      ...(result.instructions ?? []),
      `Note: This PSID expires at ${deadlineLabel} (2 hours after generation). No payment will be accepted after this deadline.`,
    ];

    store.transactions.unshift({
      id: randomUUID(),
      reservation_id: reservation.id,
      gateway_ref: result.gatewayRef,
      amount: tokenAmount,
      currency: "PKR",
      status: "initiated",
      psid: result.psid ?? null,
      psid_expires_at: psidExpiresAt.toISOString(),
      raw_payload: {
        provider: result.provider,
        dueDate: psidExpiresAt.toISOString(),
        instructions,
        plot_number: plot.plot_number,
        token_amount: tokenAmount,
        issued_at: issuedAt.toISOString(),
      },
      created_at: issuedAt.toISOString(),
    });

    return ok({
      checkoutUrl: result.checkoutUrl || null,
      gatewayRef: result.gatewayRef,
      psid: result.psid ?? null,
      amount: tokenAmount,
      currency: result.currency,
      dueDate: psidExpiresAt.toISOString(),
      psidExpiresAt: psidExpiresAt.toISOString(),
      issuedAt: issuedAt.toISOString(),
      instructions,
      provider: result.provider,
      plot_number: plot.plot_number,
      is_available: false,
      payment_verified: false,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromError(error);
  }
}
