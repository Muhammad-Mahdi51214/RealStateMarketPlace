import { NextResponse } from "next/server";
import { AuthError } from "@backend/auth/session";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
) {
  return NextResponse.json(
    { success: false, error: { code, message, details } },
    { status },
  );
}

export function fromError(error: unknown) {
  if (error instanceof AuthError) {
    return fail(
      error.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
      error.message,
      error.status,
    );
  }
  console.error(error);
  return fail("INTERNAL_ERROR", "Unexpected server error", 500);
}
