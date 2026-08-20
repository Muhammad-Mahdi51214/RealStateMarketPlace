import { z } from "zod";
import { fail, fromError, ok } from "@backend/api/response";
import { requireAdmin, toClientUser } from "@backend/auth/session";
import { addAudit, getDemoStore } from "@backend/demo/store";

const schema = z.object({
  userId: z.string(),
  suspended: z.boolean(),
});

export async function GET() {
  try {
    await requireAdmin();
    return ok({
      users: getDemoStore().users.map((u) => toClientUser(u)),
    });
  } catch (error) {
    return fromError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = schema.parse(await request.json());
    const user = getDemoStore().users.find((u) => u.id === body.userId);
    if (!user) return fail("NOT_FOUND", "User not found", 404);
    user.suspended = body.suspended;
    addAudit(admin.id, body.suspended ? "user.suspended" : "user.unsuspended", "profiles", user.id, null);
    return ok({ user: toClientUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromError(error);
  }
}
