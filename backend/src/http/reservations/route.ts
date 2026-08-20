import { randomUUID } from "crypto";
import { z } from "zod";
import { fail, fromError, ok } from "@backend/api/response";
import { requireSessionUser } from "@backend/auth/session";
import {
  addNotification,
  expirePendingReservations,
  getDemoStore,
  getPlotPsid,
  getPlotStatus,
  isPaymentVerified,
  isUserReservationBanned,
  RESERVATION_WINDOW_MS,
  setPlotStatus,
} from "@backend/demo/store";
import { getPlotById } from "@backend/inventory/queries";
import type { PlotWithRelations } from "@shared/types/database.types";

const createSchema = z.object({
  plotId: z.string().min(1),
});

async function enrichReservation(
  r: ReturnType<typeof getDemoStore>["reservations"][number],
) {
  const store = getDemoStore();
  const plot = await getPlotById(r.plot_id);
  const status = plot ? getPlotStatus(plot.id) : null;
  const tx =
    store.transactions.find(
      (t) => t.reservation_id === r.id && t.status === "initiated",
    ) ?? store.transactions.find((t) => t.reservation_id === r.id);
  return {
    ...r,
    payment_verified:
      Boolean(tx?.status === "success") ||
      (plot ? isPaymentVerified(plot.id) : false),
    psid: tx?.psid ?? (plot ? getPlotPsid(plot.id) : null),
    gateway_ref: tx?.gateway_ref ?? null,
    token_amount: tx?.amount ?? (plot ? Number(plot.token_amount) : null),
    payment_instructions:
      (tx?.raw_payload?.instructions as string[] | undefined) ?? null,
    psid_expires_at: tx?.psid_expires_at ?? null,
    voucher_issued_at:
      (tx?.raw_payload?.issued_at as string | undefined) ??
      tx?.created_at ??
      null,
    plot: plot
      ? ({
          ...plot,
          status: status ?? plot.status,
          is_available: status === "available",
          payment_verified:
            Boolean(tx?.status === "success") || isPaymentVerified(plot.id),
          psid: tx?.psid ?? getPlotPsid(plot.id),
        } as PlotWithRelations)
      : null,
  };
}

export async function GET() {
  try {
    const user = await requireSessionUser();
    expirePendingReservations();
    const store = getDemoStore();
    const list = store.reservations.filter((r) =>
      user.role === "customer" ? r.customer_id === user.id : true,
    );
    const reservations = await Promise.all(list.map(enrichReservation));
    return ok({
      reservations,
      reservation_banned_until: user.reservation_banned_until,
    });
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    if (user.role !== "customer") {
      return fail("FORBIDDEN", "Only customers can reserve plots", 403);
    }

    if (isUserReservationBanned(user)) {
      return fail(
        "BANNED",
        `You cannot reserve plots until ${new Date(user.reservation_banned_until!).toLocaleString()}.`,
        403,
      );
    }

    const { plotId } = createSchema.parse(await request.json());
    expirePendingReservations();

    const plot = await getPlotById(plotId);
    if (!plot) return fail("NOT_FOUND", "Plot not found", 404);

    const store = getDemoStore();
    const hasLive = store.plotStatuses.has(plotId);
    const currentStatus = hasLive ? getPlotStatus(plotId) : plot.status;
    if (currentStatus !== "available") {
      return fail("CONFLICT", "Plot no longer available", 409);
    }

    const userPending = store.reservations.find(
      (r) => r.customer_id === user.id && r.status === "pending_payment",
    );
    if (userPending) {
      return fail(
        "CONFLICT",
        "You already have an unpaid reservation. Complete or wait for it to expire before reserving another plot.",
        409,
      );
    }

    const active = store.reservations.find(
      (r) =>
        r.plot_id === plotId &&
        ["pending_payment", "reserved", "under_verification"].includes(
          r.status,
        ),
    );
    if (active) {
      return fail("CONFLICT", "Plot no longer available", 409);
    }

    const reservation = {
      id: randomUUID(),
      plot_id: plotId,
      customer_id: user.id,
      token_amount_paid: null,
      status: "pending_payment" as const,
      expires_at: new Date(Date.now() + RESERVATION_WINDOW_MS).toISOString(),
      created_at: new Date().toISOString(),
      extension_used: false,
      extension_eligible: false,
      verification_submitted_at: null,
    };
    store.reservations.unshift(reservation);
    setPlotStatus(plotId, "reserved");
    addNotification(
      user.id,
      "Reservation created",
      `Pay token ${plot.token_amount} PKR within 2 hours to hold ${plot.plot_number}.`,
    );

    return ok({ reservation: await enrichReservation(reservation) }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromError(error);
  }
}
