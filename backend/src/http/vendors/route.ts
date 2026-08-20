import { requireSessionUser } from "@backend/auth/session";
import { fromService, ok, fail } from "@backend/vendors/http-helpers";
import { listApprovedVendors } from "@backend/vendors/service";
import { getVendorStore, publicVendor } from "@backend/demo/vendor-store";

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") === "houses" ? "houses" : "rating";
    const id = searchParams.get("id");
    if (id) {
      const vendor = getVendorStore().vendors.find((v) => v.id === id);
      if (!vendor || vendor.status !== "approved") {
        return fail("NOT_FOUND", "Vendor not found", 404);
      }
      return ok({ vendor: publicVendor(vendor) });
    }
    return ok({ vendors: listApprovedVendors(sort) });
  } catch (error) {
    return fromService(error);
  }
}
