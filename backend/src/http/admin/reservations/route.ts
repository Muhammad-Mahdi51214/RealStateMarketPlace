import { z } from "zod";
import { fail, fromError, ok } from "@backend/api/response";
import { requireAdmin } from "@backend/auth/session";
import {
  addAudit,
  addNotification,
  expirePendingReservations,
  getDemoStore,
  setPlotStatus,
} from "@backend/demo/store";
import { seedPlots } from "@backend/data/seed";

const schema = z.object({
  reservationId: z.string(),
  action: z.enum(["cancel", "release"]),
});

export async function GET() {
  try {
    await requireAdmin();
    expirePendingReservations();
    const reservations = getDemoStore().reservations.map((r) => ({
      ...r,
      plot: seedPlots.find((p) => p.id === r.plot_id) ?? null,
    }));
    return ok({ reservations });
  } catch (error) {
    return fromError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = schema.parse(await request.json());
    const reservation = getDemoStore().reservations.find(
      (r) => r.id === body.reservationId,
    );
    if (!reservation) return fail("NOT_FOUND", "Reservation not found", 404);

    reservation.status = "cancelled";
    setPlotStatus(reservation.plot_id, "available");
    addNotification(
      reservation.customer_id,
      "Reservation cancelled",
      "An admin cancelled your reservation.",
    );
    addAudit(admin.id, "reservation.cancelled", "reservations", reservation.id, null);
    return ok({ reservation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromError(error);
  }
}
