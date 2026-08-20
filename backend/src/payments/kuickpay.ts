import { createHmac, randomUUID } from "crypto";
import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentGateway,
  VerifyWebhookResult,
  GatewayPaymentStatus,
} from "@backend/payments/types";
import { env } from "@backend/env.server";

/**
 * KuickPay-style PSID (Consumer Number) payments.
 *
 * Live credentials (server-only):
 *   KUICKPAY_USERNAME, KUICKPAY_PASSWORD, KUICKPAY_INSTITUTION_ID, KUICKPAY_PREFIX
 *
 * Without live keys, generates a realistic PSID and accepts signed demo webhooks /
 * inquiry so local development works.
 */
export class KuickPayGateway implements PaymentGateway {
  readonly provider = "kuickpay" as const;

  private get prefix(): string {
    return env.server.KUICKPAY_PREFIX || "71090";
  }

  private get webhookSecret(): string {
    return (
      env.server.PAYMENT_GATEWAY_WEBHOOK_SECRET ||
      env.server.KUICKPAY_PASSWORD ||
      "csc-kuickpay-demo-webhook"
    );
  }

  private get hasLiveCredentials(): boolean {
    return Boolean(
      env.server.KUICKPAY_USERNAME &&
        env.server.KUICKPAY_PASSWORD &&
        env.server.KUICKPAY_INSTITUTION_ID,
    );
  }

  /** Build 13–18 digit consumer number: prefix + numeric reference */
  generatePsid(seed: string): string {
    const digits = seed.replace(/\D/g, "").padStart(12, "0").slice(-12);
    return `${this.prefix}${digits}`.slice(0, 18);
  }

  async initiatePayment(
    input: InitiatePaymentInput,
  ): Promise<InitiatePaymentResult> {
    const gatewayRef = `kp_${input.idempotencyKey || randomUUID()}`;
    const numeric = gatewayRef.replace(/\D/g, "").slice(-10) || Date.now().toString().slice(-10);
    const psid = this.generatePsid(numeric);
    const due = new Date();
    due.setDate(due.getDate() + 3);

    // Live KuickPay bill registration would be called here with server credentials.
    // Demo mode still returns a pay-by-PSID payload without exposing secrets.
    void this.hasLiveCredentials;

    return {
      checkoutUrl: "",
      gatewayRef,
      psid,
      amount: input.amount,
      currency: "PKR",
      dueDate: due.toISOString(),
      provider: "kuickpay",
      instructions: [
        "Open your bank mobile app, JazzCash, EasyPaisa, or visit an OTC partner.",
        "Select Bill Payment → KuickPay (or search Capital Smart City / CSC Marketplace).",
        `Enter PSID / Consumer Number: ${psid}`,
        `Confirm amount ${input.amount.toLocaleString("en-PK")} PKR and pay.`,
        "This page updates automatically after KuickPay confirms payment.",
      ],
    };
  }

  async verifyWebhook(
    headers: Headers,
    rawBody: string,
  ): Promise<VerifyWebhookResult> {
    const signature =
      headers.get("x-kuickpay-signature") ??
      headers.get("x-sandbox-signature") ??
      "";
    const expected = createHmac("sha256", this.webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (!signature || signature !== expected) {
      throw new Error("Invalid KuickPay webhook signature");
    }

    const body = JSON.parse(rawBody) as {
      gatewayRef: string;
      amount: number;
      status: GatewayPaymentStatus;
      psid?: string;
    };

    return {
      gatewayRef: body.gatewayRef,
      amount: body.amount,
      currency: "PKR",
      status: body.status,
      psid: body.psid,
      payload: body as unknown as Record<string, unknown>,
    };
  }

  async getStatus(gatewayRef: string): Promise<GatewayPaymentStatus> {
    if (!gatewayRef.startsWith("kp_")) {
      return "failed";
    }
    // Live: BillPayment inquiry SOAP/REST using KUICKPAY_* credentials.
    // Demo: status comes from webhook / mark-paid admin action stored on the tx.
    return "initiated";
  }
}

export function signKuickPayWebhook(payload: object, secret?: string): string {
  const key =
    secret ||
    env.server.PAYMENT_GATEWAY_WEBHOOK_SECRET ||
    env.server.KUICKPAY_PASSWORD ||
    "csc-kuickpay-demo-webhook";
  return createHmac("sha256", key).update(JSON.stringify(payload)).digest("hex");
}
