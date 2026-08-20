/**
 * Pluggable payment gateway contract (Pakistan rails).
 * Secrets stay server-side only — never expose to the browser.
 */

export type GatewayPaymentStatus =
  | "initiated"
  | "success"
  | "failed"
  | "refunded";

export type PaymentProvider =
  | "sandbox"
  | "kuickpay"
  | "jazzcash"
  | "easypaisa"
  | "payfast";

export interface InitiatePaymentInput {
  reservationId: string;
  amount: number;
  currency: "PKR";
  customerId: string;
  description: string;
  returnUrl: string;
  idempotencyKey: string;
}

export interface InitiatePaymentResult {
  /** Hosted checkout URL when applicable (sandbox). Empty for PSID-only flows. */
  checkoutUrl: string;
  gatewayRef: string;
  /** KuickPay PSID / Consumer Number for bank / wallet bill pay */
  psid?: string;
  amount: number;
  currency: "PKR";
  dueDate?: string;
  instructions?: string[];
  provider: PaymentProvider;
}

export interface VerifyWebhookResult {
  gatewayRef: string;
  amount: number;
  currency: "PKR";
  status: GatewayPaymentStatus;
  payload: Record<string, unknown>;
  psid?: string;
}

export interface PaymentGateway {
  readonly provider: PaymentProvider;
  initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  verifyWebhook(
    headers: Headers,
    rawBody: string,
  ): Promise<VerifyWebhookResult>;
  getStatus(gatewayRef: string): Promise<GatewayPaymentStatus>;
}
