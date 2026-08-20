import { z } from "zod";
import { requireSessionUser } from "@backend/auth/session";
import { fail, fromService, ok } from "@backend/vendors/http-helpers";
import {
  createHireRequest,
  listHireRequestsForUser,
  respondHireRequest,
} from "@backend/vendors/service";
import { findUserById } from "@backend/demo/store";
import { getVendorStore, publicVendor } from "@backend/demo/vendor-store";

const createSchema = z.object({
  vendor_id: z.string().min(1),
  ownership_id: z.string().optional().nullable(),
  plot_id: z.string().optional().nullable(),
  message: z.string().min(5).max(1000),
  budget_note: z.string().max(500).optional().nullable(),
});

const respondSchema = z.object({
  request_id: z.string().min(1),
  action: z.enum(["accept", "decline"]),
});

export async function GET() {
  try {
    const user = await requireSessionUser();
    const requests = listHireRequestsForUser(user).map((r) => {
      const vendor = getVendorStore().vendors.find((v) => v.id === r.vendor_id);
      const customer = findUserById(r.customer_id);
      return {
        ...r,
        vendor: vendor ? publicVendor(vendor) : null,
        customer_name: customer?.full_name ?? null,
      };
    });
    return ok({ requests });
  } catch (error) {
    return fromService(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    if (user.role !== "customer") {
      return fail("FORBIDDEN", "Only customers can request hire", 403);
    }
    const body = createSchema.parse(await request.json());
    const hire = createHireRequest({
      customer: user,
      vendor_id: body.vendor_id,
      ownership_id: body.ownership_id,
      plot_id: body.plot_id,
      message: body.message,
      budget_note: body.budget_note,
    });
    return ok({ request: hire }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromService(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = respondSchema.parse(await request.json());
    const result = respondHireRequest(user, body.request_id, body.action);
    return ok(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromService(error);
  }
}
