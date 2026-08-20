import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { UserRole } from "./types/database.types";

/** Access token lifetime — must re-login after expiry */
export const JWT_TTL_SECONDS = 60 * 60 * 2; // 2 hours

export const AUTH_COOKIE = "csc_token";
export const ROLE_COOKIE = "csc_role";

export type AuthTokenPayload = JWTPayload & {
  sub: string;
  role: UserRole;
  email: string;
  full_name: string;
};

function getSecretKey(): Uint8Array {
  const secret =
    process.env.AUTH_JWT_SECRET ||
    process.env.JWT_SECRET ||
    "csc-dev-jwt-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(input: {
  userId: string;
  role: UserRole;
  email: string;
  full_name: string;
}): Promise<string> {
  return new SignJWT({
    role: input.role,
    email: input.email,
    full_name: input.full_name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime(`${JWT_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyAuthToken(
  token: string | undefined | null,
): Promise<AuthTokenPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (!payload.sub || typeof payload.role !== "string") return null;
    return payload as AuthTokenPayload;
  } catch {
    return null;
  }
}
