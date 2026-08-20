import { randomUUID } from "crypto";
import { z } from "zod";
import { fail, fromError, ok } from "@backend/api/response";
import { requireSessionUser } from "@backend/auth/session";
import { addNotification, getDemoStore } from "@backend/demo/store";

const schema = z.object({
  plot_number: z.string().min(1),
  size: z.string().min(1),
  phase_name: z.string().min(1),
  type: z.enum(["residential", "commercial"]),
  asking_price: z.number().positive(),
  document_name: z.string().min(1).default("ownership-proof.pdf"),
});

export async function GET() {
  try {
    const user = await requireSessionUser();
    const listings = getDemoStore().listings.filter(
      (l) => l.submitted_by === user.id || user.role !== "customer",
    );
    return ok({ listings });
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    if (user.role !== "customer") {
      return fail("FORBIDDEN", "Only customers can submit listings", 403);
    }
    const body = schema.parse(await request.json());
    const store = getDemoStore();
    const listing = {
      id: randomUUID(),
      plot_id: null,
      submitted_by: user.id,
      asking_price: body.asking_price,
      plot_number: body.plot_number,
      size: body.size,
      phase_name: body.phase_name,
      type: body.type,
      status: "pending" as const,
      reviewed_by: null,
      review_notes: null,
      created_at: new Date().toISOString(),
    };
    store.listings.unshift(listing);
    store.documents.unshift({
      id: randomUUID(),
      owner_id: user.id,
      plot_id: null,
      reservation_id: null,
      type: "ownership_proof",
      file_url: `demo://${body.document_name}`,
      file_name: body.document_name,
      status: "pending",
      verified_by: null,
      verified_at: null,
      viewed_by: null,
      viewed_at: null,
      created_at: new Date().toISOString(),
    });
    addNotification(
      user.id,
      "Listing submitted",
      "Your sell request is pending admin review.",
    );
    return ok({ listing }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromError(error);
  }
}
