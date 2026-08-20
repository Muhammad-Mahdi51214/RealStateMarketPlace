import { clearSessionCookie } from "@backend/auth/session";
import { ok } from "@backend/api/response";

export async function POST() {
  await clearSessionCookie();
  return ok({ loggedOut: true });
}
