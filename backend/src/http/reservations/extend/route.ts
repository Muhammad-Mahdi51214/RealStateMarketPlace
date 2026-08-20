import { z } from "zod";
import { fail, fromError, ok } from "@backend/api/response";
import { requireSessionUser } from "@backend/auth/session";
import {
  addNotification,
  expirePendingReservations,
  getDemoStore,
  getPlotStatus,
  isUserReservationBanned,
  RESERVATION_WINDOW_MS,
  setPlotStatus,
} from "@backend/demo/store";
import { getPlotById } from "@backend/inventory/queries";

const schema = z.object({
  reservationId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    if (user.role !== "customer") {
      return fail("FORBIDDEN", "Only customers can extend reservations", 403);
    }
    if (isUserReservationBanned(user)) {
      return fail(
        "BANNED",
        "You are restricted from reservations for 24 hours.",
        403,
      );
    }

    const { reservationId } = schema.parse(await request.json());
    expirePendingReservations();

    const store = getDemoStore();
    const reservation = store.reservations.find((r) => r.id === reservationId);
    if (!reservation || reservation.customer_id !== user.id) {
      return fail("NOT_FOUND", "Reservation not found", 404);
    }
    if (reservation.status !== "expired" || !reservation.extension_eligible) {
      return fail(
        "INVALID_STATE",
        "This reservation is not eligible for a same-day extension.",
        400,
      );
    }
    if (reservation.extension_used) {
      return fail(
        "INVALID_STATE",
        "You already used your extension for this reservation today.",
        400,
      );
    }

    const plotStatus = getPlotStatus(reservation.plot_id);
    if (plotStatus !== "available") {
      reservation.extension_eligible = false;
      return fail(
        "CONFLICT",
        "This plot was reserved by someone else. Extension is no longer possible.",
        409,
      );
    }

    const otherPending = store.reservations.find(
      (r) =>
        r.customer_id === user.id &&
        r.id !== reservation.id &&
        r.status === "pending_payment",
    );
    if (otherPending) {
      return fail(
        "CONFLICT",
        "You already have another unpaid reservation.",
        409,
      );
    }

    reservation.status = "pending_payment";
    reservation.expires_at = new Date(
      Date.now() + RESERVATION_WINDOW_MS,
    ).toISOString();
    reservation.extension_used = true;
    reservation.extension_eligible = false;
    setPlotStatus(reservation.plot_id, "reserved");

    const plot = await getPlotById(reservation.plot_id);
    addNotification(
      user.id,
      "Reservation extended",
      `Final 2-hour window started for ${plot?.plot_number ?? "your plot"}. Pay before it expires.`,
    );

    return ok({ reservation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromError(error);
  }
}
