import { fromError, ok } from "@backend/api/response";
import { requireSessionUser } from "@backend/auth/session";
import { getDemoStore } from "@backend/demo/store";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const notifications = getDemoStore().notifications.filter(
      (n) => n.user_id === user.id,
    );
    return ok({ notifications });
  } catch (error) {
    return fromError(error);
  }
}

export async function PATCH() {
  try {
    const user = await requireSessionUser();
    getDemoStore().notifications.forEach((n) => {
      if (n.user_id === user.id) n.read = true;
    });
    return ok({ updated: true });
  } catch (error) {
    return fromError(error);
  }
}
