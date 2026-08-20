import { z } from "zod";
import { fail, fromError, ok } from "@backend/api/response";
import { requireAdmin } from "@backend/auth/session";
import {
  addAudit,
  addNotification,
  getDemoStore,
  REQUIRED_VERIFICATION_DOCS,
  setPlotStatus,
} from "@backend/demo/store";

const actionSchema = z.object({
  documentId: z.string(),
  action: z.enum(["approve", "reject", "view"]),
});

export async function GET() {
  try {
    await requireAdmin();
    return ok({ documents: getDemoStore().documents });
  } catch (error) {
    return fromError(error);
  }
}

function maybeAdvanceReservation(reservationId: string) {
  const store = getDemoStore();
  const reservation = store.reservations.find((r) => r.id === reservationId);
  if (!reservation) return;
  if (
    reservation.status !== "reserved" &&
    reservation.status !== "under_verification"
  ) {
    return;
  }

  const docs = store.documents.filter((d) => d.reservation_id === reservationId);
  const allRequiredVerified = REQUIRED_VERIFICATION_DOCS.every((type) =>
    docs.some((d) => d.type === type && d.status === "verified"),
  );
  if (!allRequiredVerified) return;

  if (reservation.status === "reserved") {
    reservation.status = "under_verification";
    setPlotStatus(reservation.plot_id, "under_verification");
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = actionSchema.parse(await request.json());
    const store = getDemoStore();
    const doc = store.documents.find((d) => d.id === body.documentId);
    if (!doc) return fail("NOT_FOUND", "Document not found", 404);

    if (body.action === "view") {
      doc.viewed_by = admin.id;
      doc.viewed_at = new Date().toISOString();
      addAudit(admin.id, "document.viewed", "documents", doc.id, null);
      return ok({ document: doc });
    }

    if (!doc.viewed_at) {
      return fail(
        "VIEW_REQUIRED",
        "Open and view the document before verifying or rejecting it.",
        400,
      );
    }

    doc.status = body.action === "approve" ? "verified" : "rejected";
    doc.verified_by = admin.id;
    doc.verified_at = new Date().toISOString();

    if (body.action === "approve" && doc.reservation_id) {
      maybeAdvanceReservation(doc.reservation_id);
    }

    addNotification(
      doc.owner_id,
      body.action === "approve" ? "Document verified" : "Document rejected",
      `${doc.file_name} was ${doc.status}.`,
    );
    addAudit(admin.id, `document.${doc.status}`, "documents", doc.id, null);
    return ok({ document: doc });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromError(error);
  }
}
