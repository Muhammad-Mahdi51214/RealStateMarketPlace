import { fail, fromError, ok } from "@backend/api/response";
import { AuthError } from "@backend/auth/session";

export function fromService(error: unknown) {
  if (error instanceof AuthError) return fromError(error);
  if (error instanceof Error) {
    return fail("BAD_REQUEST", error.message, 400);
  }
  return fromError(error);
}

export { ok, fail, fromError };
