import { fail, fromError, ok } from "@backend/api/response";
import { requireAdmin } from "@backend/auth/session";
import {
  addAudit,
  getDemoStore,
  isPaymentVerified,
} from "@backend/demo/store";
import { seedPlots } from "@backend/data/seed";
import { z } from "zod";
import { signKuickPayWebhook } from "@backend/payments/kuickpay";
import { env } from "@backend/env.server";

/**
 * Payment-verified queue: plots/reservations with successful token payment.
 */
export async function GET() {
  try {
    await requireAdmin();
    const store = getDemoStore();

    const items = store.reservations
      .filter((r) =>
        ["reserved", "under_verification", "confirmed"].includes(r.status),
      )
      .map((reservation) => {
        const plot = seedPlots.find((p) => p.id === reservation.plot_id);
        const tx = store.transactions.find(
          (t) =>
            t.reservation_id === reservation.id && t.status === "success",
        );
        const docs = store.documents.filter(
          (d) => d.reservation_id === reservation.id,
        );
        const pendingDocs = docs.filter((d) => d.status === "pending").length;
        const verifiedDocs = docs.filter((d) => d.status === "verified").length;
        const customer = store.users.find((u) => u.id === reservation.customer_id);

        return {
          reservation,
          plot: plot
            ? {
                ...plot,
                is_available: false,
                payment_verified: isPaymentVerified(plot.id) || Boolean(tx),
                psid: tx?.psid ?? null,
                payment_ref: tx?.gateway_ref ?? null,
              }
            : null,
          transaction: tx ?? null,
          customer: customer
            ? {
                id: customer.id,
                full_name: customer.full_name,
                email: customer.email,
                phone: customer.phone,
              }
            : null,
          docs: {
            total: docs.length,
            pending: pendingDocs,
            verified: verifiedDocs,
          },
          pipeline:
            reservation.status === "confirmed"
              ? "sold"
              : reservation.status === "under_verification"
                ? "under_verification"
                : pendingDocs > 0
                  ? "docs_pending"
                  : docs.length === 0
                    ? "awaiting_docs"
                    : "docs_submitted",
        };
      })
      .filter((row) => row.transaction || row.plot?.payment_verified);

    return ok({ items });
  } catch (error) {
    return fromError(error);
  }
}

const markSchema = z.object({
  gatewayRef: z.string().min(1),
  action: z.literal("mark_paid"),
});

/** Demo / ops: mark an initiated KuickPay PSID as paid (fires signed webhook). */
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = markSchema.parse(await request.json());
    const store = getDemoStore();
    const tx = store.transactions.find((t) => t.gateway_ref === body.gatewayRef);
    if (!tx) return fail("NOT_FOUND", "Transaction not found", 404);
    if (tx.status === "success") {
      return ok({ alreadyPaid: true });
    }

    const payload = {
      gatewayRef: tx.gateway_ref,
      amount: tx.amount,
      status: "success" as const,
      psid: tx.psid ?? undefined,
    };
    const raw = JSON.stringify(payload);
    const signature = signKuickPayWebhook(payload);
    const base = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/payments/webhook`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-kuickpay-signature": signature,
      },
      body: raw,
    });
    const json = (await res.json()) as { success?: boolean };

    addAudit(admin.id, "mark_psid_paid", "transaction", tx.id, {
      gatewayRef: tx.gateway_ref,
      psid: tx.psid,
    });

    return ok({ marked: Boolean(json.success), gatewayRef: tx.gateway_ref });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromError(error);
  }
}
