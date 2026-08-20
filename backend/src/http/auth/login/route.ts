import { z } from "zod";
import { fail, ok, fromError } from "@backend/api/response";
import { setSessionCookie, toClientUser } from "@backend/auth/session";
import { findUserByEmail } from "@backend/demo/store";
import { getVendorStore } from "@backend/demo/vendor-store";
import { JWT_TTL_SECONDS } from "@shared/jwt";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  adminOnly: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    getVendorStore();
    const body = schema.parse(await request.json());
    const user = findUserByEmail(body.email);
    if (!user || user.password !== body.password) {
      return fail("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }
    if (user.suspended) {
      return fail("SUSPENDED", "Account suspended", 403);
    }
    if (
      body.adminOnly &&
      !["verification_officer", "sales_admin", "super_admin"].includes(user.role)
    ) {
      return fail("FORBIDDEN", "Admin access required", 403);
    }

    const token = await setSessionCookie(user);
    return ok({
      user: toClientUser(user),
      tokenType: "Bearer",
      expiresIn: JWT_TTL_SECONDS,
      // Token is httpOnly-cookie based; raw JWT is not returned to JS for XSS safety.
      // Client relies on cookie + /api/auth/me.
      authenticated: Boolean(token),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(
        "VALIDATION_ERROR",
        "Invalid login payload",
        400,
        error.flatten(),
      );
    }
    return fromError(error);
  }
}
