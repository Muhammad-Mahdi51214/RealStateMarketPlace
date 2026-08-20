import { z } from "zod";
import { fail, fromError, ok } from "@backend/api/response";
import { requireSessionUser } from "@backend/auth/session";
import {
  addNotification,
  getDemoStore,
  REQUIRED_VERIFICATION_DOCS,
  setPlotStatus,
} from "@backend/demo/store";

const schema = z.object({
  reservationId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    if (user.role !== "customer") {
      return fail("FORBIDDEN", "Only customers can submit verification", 403);
    }

    const { reservationId } = schema.parse(await request.json());
    const store = getDemoStore();
    const reservation = store.reservations.find((r) => r.id === reservationId);
    if (!reservation || reservation.customer_id !== user.id) {
      return fail("NOT_FOUND", "Reservation not found", 404);
    }
    if (reservation.status !== "reserved") {
      return fail(
        "INVALID_STATE",
        "Submit verification only after payment and before admin review starts.",
        400,
      );
    }

    const docs = store.documents.filter(
      (d) => d.reservation_id === reservation.id,
    );
    const missing = REQUIRED_VERIFICATION_DOCS.filter(
      (type) => !docs.some((d) => d.type === type),
    );
    if (missing.length) {
      return fail(
        "INCOMPLETE",
        `Upload all required documents first: ${missing.join(", ")}`,
        400,
      );
    }

    reservation.status = "under_verification";
    reservation.verification_submitted_at = new Date().toISOString();
    setPlotStatus(reservation.plot_id, "under_verification");

    addNotification(
      user.id,
      "Submitted for verification",
      "Your documents were sent to CSC admins for review.",
    );

    return ok({ reservation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromError(error);
  }
}
