import { getSessionUser, toClientUser } from "@backend/auth/session";
import { ok } from "@backend/api/response";

export async function GET() {
  // getSessionUser clears orphan/expired cookies when JWT no longer maps to a user
  const user = await getSessionUser();
  return ok({ user: user ? toClientUser(user) : null });
}
