import { fromError, ok } from "@backend/api/response";
import { requireSessionUser } from "@backend/auth/session";
import { getDemoStore } from "@backend/demo/store";
import { seedPlots } from "@backend/data/seed";

export async function GET() {
  try {
    const user = await requireSessionUser();
    const ownership = getDemoStore().ownership
      .filter((o) => o.owner_id === user.id)
      .map((o) => ({
        ...o,
        plot: seedPlots.find((p) => p.id === o.plot_id) ?? null,
        documents: getDemoStore().documents.filter(
          (d) => d.plot_id === o.plot_id && d.owner_id === user.id,
        ),
        transactions: getDemoStore().transactions.filter((t) => {
          const reservation = getDemoStore().reservations.find(
            (r) => r.id === o.reservation_id,
          );
          return reservation && t.reservation_id === reservation.id;
        }),
      }));
    return ok({ ownership });
  } catch (error) {
    return fromError(error);
  }
}
