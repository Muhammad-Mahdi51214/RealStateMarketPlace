import { randomUUID } from "crypto";
import { z } from "zod";
import { fail, fromError, ok } from "@backend/api/response";
import { requireSessionUser } from "@backend/auth/session";
import {
  addNotification,
  getDemoStore,
} from "@backend/demo/store";

const documentTypes = [
  "cnic",
  "cnic_front",
  "cnic_back",
  "ownership_proof",
  "allotment_letter",
  "ndc_clearance",
  "agreement_to_sell",
  "passport_photo",
  "power_of_attorney",
  "transfer_deed",
  "payment_receipt",
  "other",
] as const;

const schema = z.object({
  reservationId: z.string().min(1),
  type: z.enum(documentTypes),
  file_name: z.string().min(1),
});

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const url = new URL(request.url);
    const reservationId = url.searchParams.get("reservationId");
    let docs = getDemoStore().documents.filter(
      (d) => d.owner_id === user.id || user.role !== "customer",
    );
    if (reservationId) {
      docs = docs.filter((d) => d.reservation_id === reservationId);
    }
    return ok({ documents: docs });
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = schema.parse(await request.json());
    const store = getDemoStore();
    const reservation = store.reservations.find(
      (r) => r.id === body.reservationId,
    );
    if (!reservation || reservation.customer_id !== user.id) {
      return fail("NOT_FOUND", "Reservation not found", 404);
    }
    if (!["reserved", "under_verification"].includes(reservation.status)) {
      return fail(
        "INVALID_STATE",
        "Documents can only be uploaded after token payment",
        400,
      );
    }

    const existing = store.documents.find(
      (d) =>
        d.reservation_id === reservation.id &&
        d.type === body.type &&
        d.status !== "rejected",
    );
    if (existing) {
      existing.file_name = body.file_name;
      existing.file_url = `demo://${body.file_name}`;
      existing.status = "pending";
      existing.viewed_at = null;
      existing.viewed_by = null;
      existing.verified_at = null;
      existing.verified_by = null;
      addNotification(
        user.id,
        "Document replaced",
        `${body.file_name} replaced previous ${body.type} upload.`,
      );
      return ok({ document: existing });
    }

    const doc = {
      id: randomUUID(),
      owner_id: user.id,
      plot_id: reservation.plot_id,
      reservation_id: reservation.id,
      type: body.type,
      file_url: `demo://${body.file_name}`,
      file_name: body.file_name,
      status: "pending" as const,
      verified_by: null,
      verified_at: null,
      viewed_by: null,
      viewed_at: null,
      created_at: new Date().toISOString(),
    };
    store.documents.unshift(doc);
    addNotification(
      user.id,
      "Document uploaded",
      `${body.file_name} is ready for your verification submission.`,
    );
    return ok({ document: doc }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromError(error);
  }
}
