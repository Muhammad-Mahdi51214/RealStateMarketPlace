import { randomUUID } from "crypto";
import { z } from "zod";
import { fail, fromError, ok } from "@backend/api/response";
import { requireAdmin } from "@backend/auth/session";
import {
  addAudit,
  addNotification,
  getDemoStore,
  setPlotStatus,
} from "@backend/demo/store";
import { seedPhases, seedPlots } from "@backend/data/seed";

const schema = z.object({
  listingId: z.string(),
  action: z.enum(["approve", "reject"]),
  review_notes: z.string().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    return ok({ listings: getDemoStore().listings });
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = schema.parse(await request.json());
    const store = getDemoStore();
    const listing = store.listings.find((l) => l.id === body.listingId);
    if (!listing) return fail("NOT_FOUND", "Listing not found", 404);

    listing.reviewed_by = admin.id;
    listing.review_notes = body.review_notes ?? null;

    if (body.action === "reject") {
      listing.status = "rejected";
      addNotification(
        listing.submitted_by,
        "Listing rejected",
        body.review_notes || "Your sell submission was rejected.",
      );
      addAudit(admin.id, "listing.rejected", "listing_submissions", listing.id, {
        notes: body.review_notes,
      });
      return ok({ listing });
    }

    listing.status = "approved";
    const phase =
      seedPhases.find((p) =>
        p.name.toLowerCase().includes(listing.phase_name.toLowerCase()),
      ) ?? seedPhases[0];
    const plotId = randomUUID();
    const newPlot = {
      ...seedPlots[0],
      id: plotId,
      phase_id: phase.id,
      plot_number: listing.plot_number,
      size: listing.size,
      type: listing.type,
      lump_sum_price: listing.asking_price,
      token_amount: Math.round(listing.asking_price * 0.05),
      status: "available" as const,
      rda_verified: false,
      admin_verified: true,
      latitude: 33.555 + Math.random() * 0.01,
      longitude: 72.87 + Math.random() * 0.01,
      phase: { id: phase.id, name: phase.name },
      payment_plans: [],
    };
    seedPlots.unshift(newPlot);
    setPlotStatus(plotId, "available");
    listing.plot_id = plotId;

    addNotification(
      listing.submitted_by,
      "Listing approved",
      `${listing.plot_number} is now live on public inventory.`,
    );
    addAudit(admin.id, "listing.approved", "listing_submissions", listing.id, {
      plotId,
    });
    return ok({ listing, plotId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromError(error);
  }
}
