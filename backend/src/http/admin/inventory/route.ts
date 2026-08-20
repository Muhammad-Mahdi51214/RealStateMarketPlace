import { z } from "zod";
import { fail, fromError, ok } from "@backend/api/response";
import { requireAdmin } from "@backend/auth/session";
import { addAudit, getPlotPsid, getPlotStatus, isPaymentVerified, setPlotStatus } from "@backend/demo/store";
import { seedPlots } from "@backend/data/seed";
import { getPhases } from "@backend/inventory/queries";

const schema = z.object({
  plotId: z.string(),
  status: z.enum(["available", "reserved", "under_verification", "sold"]).optional(),
  lump_sum_price: z.number().positive().optional(),
  token_amount: z.number().positive().optional(),
  rda_verified: z.boolean().optional(),
  admin_verified: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const phases = await getPhases();
    const plots = seedPlots.map((p) => {
      const status = getPlotStatus(p.id);
      return {
        ...p,
        status,
        is_available: status === "available",
        payment_verified: isPaymentVerified(p.id),
        psid: getPlotPsid(p.id),
        payment_ref: getPlotPsid(p.id),
      };
    });
    return ok({ plots, phases });
  } catch (error) {
    return fromError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = schema.parse(await request.json());
    const plot = seedPlots.find((p) => p.id === body.plotId);
    if (!plot) return fail("NOT_FOUND", "Plot not found", 404);

    if (body.lump_sum_price !== undefined) plot.lump_sum_price = body.lump_sum_price;
    if (body.token_amount !== undefined) plot.token_amount = body.token_amount;
    if (body.rda_verified !== undefined) plot.rda_verified = body.rda_verified;
    if (body.admin_verified !== undefined) plot.admin_verified = body.admin_verified;
    if (body.status) setPlotStatus(plot.id, body.status);

    addAudit(admin.id, "inventory.updated", "plots", plot.id, body);
    return ok({
      plot: { ...plot, status: getPlotStatus(plot.id) },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromError(error);
  }
}
