import { z } from "zod";
import { fail, fromError, ok } from "@backend/api/response";
import { requireSessionUser, toClientUser } from "@backend/auth/session";
import { getDemoStore } from "@backend/demo/store";

const schema = z.object({
  full_name: z.string().min(2).max(120).optional(),
  phone: z.string().min(10).max(20).optional(),
  cnic_number: z.string().min(5).max(20).nullable().optional(),
});

export async function GET() {
  try {
    const user = await requireSessionUser();
    return ok({ user: toClientUser(user) });
  } catch (error) {
    return fromError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = schema.parse(await request.json());
    const storeUser = getDemoStore().users.find((u) => u.id === user.id)!;
    if (body.full_name) storeUser.full_name = body.full_name;
    if (body.phone) storeUser.phone = body.phone;
    if (body.cnic_number !== undefined) storeUser.cnic_number = body.cnic_number;
    if (body.cnic_number) storeUser.kyc_status = "pending";
    return ok({ user: toClientUser(storeUser) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromError(error);
  }
}
