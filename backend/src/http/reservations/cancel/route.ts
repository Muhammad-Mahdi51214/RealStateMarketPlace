import { z } from "zod";
import { fail, fromError, ok } from "@backend/api/response";
import { requireSessionUser } from "@backend/auth/session";
import {
  addNotification,
  expirePendingReservations,
  getDemoStore,
  setPlotStatus,
} from "@backend/demo/store";

const schema = z.object({
  reservationId: z.string().min(1),
});

/**
 * Customer cancel during unpaid hold (or while deciding on extension).
 * Does NOT apply the 24h reservation ban — that only applies after failing
 * the second unpaid window following an extension.
 */
export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    if (user.role !== "customer") {
      return fail("FORBIDDEN", "Only customers can cancel their reservations", 403);
    }

    const { reservationId } = schema.parse(await request.json());
    expirePendingReservations();

    const store = getDemoStore();
    const reservation = store.reservations.find((r) => r.id === reservationId);
    if (!reservation || reservation.customer_id !== user.id) {
      return fail("NOT_FOUND", "Reservation not found", 404);
    }

    const cancellable =
      reservation.status === "pending_payment" ||
      (reservation.status === "expired" && reservation.extension_eligible);

    if (!cancellable) {
      return fail(
        "INVALID_STATE",
        "Only unpaid reservations (or an open extension offer) can be cancelled. After payment, contact support.",
        400,
      );
    }

    reservation.status = "cancelled";
    reservation.extension_eligible = false;

    const stillHeld = store.reservations.some(
      (r) =>
        r.plot_id === reservation.plot_id &&
        r.id !== reservation.id &&
        ["pending_payment", "reserved", "under_verification"].includes(r.status),
    );
    if (!stillHeld) {
      setPlotStatus(reservation.plot_id, "available");
    }

    addNotification(
      user.id,
      "Reservation cancelled",
      "You cancelled the hold. The plot is available again. Your 24-hour restriction rules are unchanged.",
    );

    return ok({ reservation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromError(error);
  }
}
