import { createHmac, randomUUID } from "crypto";
import type {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentGateway,
  VerifyWebhookResult,
  GatewayPaymentStatus,
} from "@backend/payments/types";
import { env } from "@backend/env.server";

const SANDBOX_SECRET = "csc-sandbox-webhook-secret";

/**
 * Deterministic mock gateway for local/dev.
 * Checkout URL is an in-app placeholder; webhooks are HMAC-signed with a fixed secret.
 */
export class SandboxGateway implements PaymentGateway {
  readonly provider = "sandbox" as const;

  async initiatePayment(
    input: InitiatePaymentInput,
  ): Promise<InitiatePaymentResult> {
    const gatewayRef = `sbx_${input.idempotencyKey || randomUUID()}`;
    const appUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const forceFail = env.server.PAYMENT_SANDBOX_FORCE_FAIL === "true";
    const checkoutUrl = `${appUrl}/api/payments/sandbox-checkout?ref=${encodeURIComponent(gatewayRef)}&amount=${input.amount}&fail=${forceFail ? "1" : "0"}&returnUrl=${encodeURIComponent(input.returnUrl)}`;

    return {
      checkoutUrl,
      gatewayRef,
      amount: input.amount,
      currency: "PKR",
      provider: "sandbox",
      instructions: [
        "Sandbox checkout will open to simulate a successful or failed token payment.",
      ],
    };
  }

  async verifyWebhook(
    headers: Headers,
    rawBody: string,
  ): Promise<VerifyWebhookResult> {
    const signature = headers.get("x-sandbox-signature") ?? "";
    const expected = createHmac("sha256", SANDBOX_SECRET)
      .update(rawBody)
      .digest("hex");

    if (!signature || signature !== expected) {
      throw new Error("Invalid sandbox webhook signature");
    }

    const body = JSON.parse(rawBody) as {
      gatewayRef: string;
      amount: number;
      status: GatewayPaymentStatus;
    };

    return {
      gatewayRef: body.gatewayRef,
      amount: body.amount,
      currency: "PKR",
      status: body.status,
      payload: body as unknown as Record<string, unknown>,
    };
  }

  async getStatus(gatewayRef: string): Promise<GatewayPaymentStatus> {
    if (!gatewayRef.startsWith("sbx_")) {
      return "failed";
    }
    if (env.server.PAYMENT_SANDBOX_FORCE_FAIL === "true") {
      return "failed";
    }
    return "success";
  }
}

export function signSandboxWebhook(payload: object): string {
  const raw = JSON.stringify(payload);
  return createHmac("sha256", SANDBOX_SECRET).update(raw).digest("hex");
}
