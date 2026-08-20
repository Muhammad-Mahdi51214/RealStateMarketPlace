import { z } from "zod";
import { requireSessionUser } from "@backend/auth/session";
import { fail, fromService, ok } from "@backend/vendors/http-helpers";
import {
  getHiredPanelForCustomer,
  listProjectsForUser,
  updateProjectStatus,
} from "@backend/vendors/service";
import { getVendorStore, publicVendor } from "@backend/demo/vendor-store";

const patchSchema = z.object({
  project_id: z.string().min(1),
  status: z.enum(["active", "completed", "cancelled"]),
});

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    if (searchParams.get("panel") === "hired" && user.role === "customer") {
      return ok({ hired: getHiredPanelForCustomer(user.id) });
    }
    const projects = listProjectsForUser(user).map((p) => {
      const vendor = getVendorStore().vendors.find((v) => v.id === p.vendor_id);
      return { ...p, vendor: vendor ? publicVendor(vendor) : null };
    });
    return ok({ projects });
  } catch (error) {
    return fromService(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = patchSchema.parse(await request.json());
    const project = updateProjectStatus(user, body.project_id, body.status);
    return ok({ project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromService(error);
  }
}
