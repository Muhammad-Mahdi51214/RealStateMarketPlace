import { z } from "zod";
import { requireAdmin } from "@backend/auth/session";
import { fail, fromService, ok } from "@backend/vendors/http-helpers";
import { listAllVendorsForAdmin, setVendorStatus } from "@backend/vendors/service";
import { listCatalog } from "@backend/vendors/service";

const patchSchema = z.object({
  vendor_id: z.string().min(1),
  status: z.enum(["approved", "suspended", "pending"]),
});

export async function GET() {
  try {
    await requireAdmin();
    return ok({
      vendors: listAllVendorsForAdmin(),
      catalog: listCatalog(false),
    });
  } catch (error) {
    return fromService(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = patchSchema.parse(await request.json());
    const vendor = setVendorStatus(body.vendor_id, body.status, admin.id);
    return ok({ vendor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromService(error);
  }
}
