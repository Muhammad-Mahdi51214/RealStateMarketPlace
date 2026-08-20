import { z } from "zod";
import { fail, fromError, ok } from "@backend/api/response";
import { requireSessionUser } from "@backend/auth/session";
import {
  addNotification,
  expirePendingReservations,
  getDemoStore,
} from "@backend/demo/store";

const schema = z.object({
  reservationId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    if (user.role !== "customer") {
      return fail("FORBIDDEN", "Only customers can decline extensions", 403);
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
        "No extension decision is pending for this reservation.",
        400,
      );
    }

    reservation.extension_eligible = false;
    addNotification(
      user.id,
      "Reservation released",
      "You declined the extension. The plot is available for others.",
    );

    return ok({ reservation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromError(error);
  }
}
