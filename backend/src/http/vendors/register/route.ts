import { randomUUID } from "crypto";
import { z } from "zod";
import { fail, ok } from "@backend/api/response";
import { setSessionCookie, toClientUser } from "@backend/auth/session";
import { findUserByEmail, getDemoStore } from "@backend/demo/store";
import { registerVendorOrg } from "@backend/demo/vendor-store";
import { fromService } from "@backend/vendors/http-helpers";
import { JWT_TTL_SECONDS } from "@shared/jwt";
import { registerSchema } from "@shared/validation/auth";

const schema = registerSchema.extend({
  company_name: z.string().min(2),
  bio: z.string().min(10).max(800),
  service_areas: z.array(z.string().min(1)).min(1).max(12),
  years_experience: z.number().int().min(0).max(80),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
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
      role: "vendor" as const,
      kyc_status: "pending" as const,
      suspended: false,
      reservation_banned_until: null,
      created_at: new Date().toISOString(),
    };
    getDemoStore().users.push(user);
    const vendor = registerVendorOrg({
      owner: user,
      name: body.company_name,
      bio: body.bio,
      service_areas: body.service_areas,
      years_experience: body.years_experience,
    });
    const token = await setSessionCookie(user);
    return ok(
      {
        user: toClientUser(user),
        vendor,
        tokenType: "Bearer",
        expiresIn: JWT_TTL_SECONDS,
        authenticated: Boolean(token),
      },
      201,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(
        "VALIDATION_ERROR",
        error.issues[0]?.message ?? "Invalid payload",
        400,
        error.flatten(),
      );
    }
    return fromService(error);
  }
}
