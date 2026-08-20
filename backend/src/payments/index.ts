import { SandboxGateway } from "@backend/payments/sandbox";
import { KuickPayGateway } from "@backend/payments/kuickpay";
import type { PaymentGateway } from "@backend/payments/types";
import { env } from "@backend/env.server";

export type { PaymentGateway } from "@backend/payments/types";
export { SandboxGateway, signSandboxWebhook } from "@backend/payments/sandbox";
export {
  KuickPayGateway,
  signKuickPayWebhook,
} from "@backend/payments/kuickpay";

/**
 * Factory for the active payment provider.
 * Secrets for KuickPay live only in server env — never sent to the client.
 */
export function getPaymentGateway(): PaymentGateway {
  const provider = env.server.PAYMENT_GATEWAY_PROVIDER;

  switch (provider) {
    case "kuickpay":
      return new KuickPayGateway();
    case "sandbox":
      return new SandboxGateway();
    case "jazzcash":
    case "easypaisa":
    case "payfast":
      throw new Error(
        `Payment provider "${provider}" is not implemented yet. Use kuickpay or sandbox.`,
      );
    default:
      return new KuickPayGateway();
  }
}
