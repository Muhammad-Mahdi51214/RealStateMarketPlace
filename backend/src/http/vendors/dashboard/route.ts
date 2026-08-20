import { requireVendorRole } from "@backend/auth/session";
import { fromService, ok } from "@backend/vendors/http-helpers";
import { vendorDashboard } from "@backend/vendors/service";

export async function GET() {
  try {
    const user = await requireVendorRole();
    return ok(vendorDashboard(user));
  } catch (error) {
    return fromService(error);
  }
}
