import { z } from "zod";
import { fail, ok, fromError } from "@backend/api/response";
import { setSessionCookie, toClientUser } from "@backend/auth/session";
import { findUserByEmail, getDemoStore } from "@backend/demo/store";
import { randomUUID } from "crypto";
import { JWT_TTL_SECONDS } from "@shared/jwt";
import { registerSchema } from "@shared/validation/auth";

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    if (findUserByEmail(body.email)) {
      return fail("EMAIL_EXISTS", "Unable to register with these details", 400);
    }

    const user = {
      id: randomUUID(),
      email: body.email,
      password: body.password,
      full_name: body.full_name,
      phone: body.phone,
      cnic_number: null,
      role: "customer" as const,
      kyc_status: "pending" as const,
      suspended: false,
      reservation_banned_until: null,
      created_at: new Date().toISOString(),
    };
    getDemoStore().users.push(user);
    const token = await setSessionCookie(user);
    return ok(
      {
        user: toClientUser(user),
        tokenType: "Bearer",
        expiresIn: JWT_TTL_SECONDS,
        authenticated: Boolean(token),
      },
      201,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message =
        error.issues[0]?.message ?? "Invalid registration payload";
      return fail("VALIDATION_ERROR", message, 400, error.flatten());
    }
    return fromError(error);
  }
}
