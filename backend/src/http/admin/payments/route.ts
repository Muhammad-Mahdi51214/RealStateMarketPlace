import { fromError, ok } from "@backend/api/response";
import { requireAdmin } from "@backend/auth/session";
import { getDemoStore } from "@backend/demo/store";

export async function GET() {
  try {
    await requireAdmin();
    return ok({ transactions: getDemoStore().transactions });
  } catch (error) {
    return fromError(error);
  }
}
