import { randomUUID } from "crypto";
import { z } from "zod";
import { fail, fromError, ok } from "@backend/api/response";
import { requireSuperAdmin } from "@backend/auth/session";
import {
  addAudit,
  addNotification,
  getDemoStore,
  setPlotStatus,
} from "@backend/demo/store";

const schema = z.object({
  reservationId: z.string(),
});

export async function GET() {
  try {
    await requireSuperAdmin();
    const store = getDemoStore();
    const queue = store.reservations.filter(
      (r) => r.status === "under_verification",
    );
    return ok({ reservations: queue });
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireSuperAdmin();
    const { reservationId } = schema.parse(await request.json());
    const store = getDemoStore();
    const reservation = store.reservations.find((r) => r.id === reservationId);
    if (!reservation) return fail("NOT_FOUND", "Reservation not found", 404);
    if (reservation.status !== "under_verification") {
      return fail("INVALID_STATE", "Reservation is not under verification", 400);
    }

    const docs = store.documents.filter(
      (d) => d.reservation_id === reservation.id,
    );
    if (!docs.length || docs.some((d) => d.status !== "verified")) {
      return fail(
        "DOCS_PENDING",
        "All required documents must be verified first",
        400,
      );
    }

    reservation.status = "confirmed";
    setPlotStatus(reservation.plot_id, "sold");
    const ownership = {
      id: randomUUID(),
      plot_id: reservation.plot_id,
      reservation_id: reservation.id,
      owner_id: reservation.customer_id,
      confirmed_by: admin.id,
      confirmed_at: new Date().toISOString(),
    };
    store.ownership.unshift(ownership);
    addNotification(
      reservation.customer_id,
      "Sale confirmed",
      "Ownership confirmed. Your plot is now in My Property.",
    );
    addAudit(admin.id, "sale.confirmed", "ownership_records", ownership.id, {
      plot_id: reservation.plot_id,
    });
    return ok({ ownership });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromError(error);
  }
}
