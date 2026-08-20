import "server-only";

import { cookies } from "next/headers";
import {
  findUserById,
  publicUser,
  type DemoUser,
} from "@backend/demo/store";
import {
  AUTH_COOKIE,
  JWT_TTL_SECONDS,
  ROLE_COOKIE,
  signAuthToken,
  verifyAuthToken,
} from "@shared/jwt";

export { AUTH_COOKIE as SESSION_COOKIE, ROLE_COOKIE, JWT_TTL_SECONDS };

export async function getSessionUser(): Promise<DemoUser | null> {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  const payload = await verifyAuthToken(token);
  if (!payload?.sub) {
    // Expired / invalid token still in browser — clear so Login is not blocked
    if (token) await clearSessionCookie();
    return null;
  }

  // Warm vendor demo accounts (stable ids) after server restart
  const { getVendorStore } = await import("@backend/demo/vendor-store");
  getVendorStore();

  const user = findUserById(payload.sub);
  if (!user || user.suspended) {
    // JWT is valid but user no longer exists in demo store (restart / wipe)
    await clearSessionCookie();
    return null;
  }
  return user;
}

export async function requireSessionUser(): Promise<DemoUser> {
  const user = await getSessionUser();
  if (!user || user.suspended) {
    throw new AuthError("Unauthorized", 401);
  }
  return user;
}

export async function requireAdmin(): Promise<DemoUser> {
  const user = await requireSessionUser();
  if (
    !["verification_officer", "sales_admin", "super_admin"].includes(user.role)
  ) {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export async function requireSuperAdmin(): Promise<DemoUser> {
  const user = await requireSessionUser();
  if (user.role !== "super_admin") {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export async function requireVendorRole(): Promise<DemoUser> {
  const user = await requireSessionUser();
  if (!["vendor", "vendor_employee"].includes(user.role)) {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export async function requireVendorOwner(): Promise<DemoUser> {
  const user = await requireSessionUser();
  if (user.role !== "vendor") {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export async function requireCustomer(): Promise<DemoUser> {
  const user = await requireSessionUser();
  if (user.role !== "customer") {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export async function setSessionCookie(user: DemoUser) {
  const token = await signAuthToken({
    userId: user.id,
    role: user.role,
    email: user.email,
    full_name: user.full_name,
  });
  const jar = await cookies();
  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: JWT_TTL_SECONDS,
  };
  jar.set(AUTH_COOKIE, token, cookieOpts);
  jar.set(ROLE_COOKIE, user.role, cookieOpts);
  return token;
}

export async function clearSessionCookie() {
  const jar = await cookies();
  const clear = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
  jar.set(AUTH_COOKIE, "", clear);
  jar.set(ROLE_COOKIE, "", clear);
  // Clear legacy demo session cookie if present
  jar.set("csc_session", "", clear);
}

export function toClientUser(user: DemoUser) {
  return publicUser(user);
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
