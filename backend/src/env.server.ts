import "server-only";

import { z } from "zod";
import { publicEnv } from "@shared/env.public";

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal("")),
  PAYMENT_GATEWAY_PROVIDER: z
    .enum(["sandbox", "kuickpay", "jazzcash", "easypaisa", "payfast"])
    .default("kuickpay"),
  PAYMENT_GATEWAY_MERCHANT_ID: z.string().optional().or(z.literal("")),
  PAYMENT_GATEWAY_SECRET: z.string().optional().or(z.literal("")),
  PAYMENT_GATEWAY_WEBHOOK_SECRET: z.string().optional().or(z.literal("")),
  PAYMENT_SANDBOX_FORCE_FAIL: z
    .enum(["true", "false"])
    .optional()
    .default("false"),
  KUICKPAY_USERNAME: z.string().optional().or(z.literal("")),
  KUICKPAY_PASSWORD: z.string().optional().or(z.literal("")),
  KUICKPAY_INSTITUTION_ID: z.string().optional().or(z.literal("")),
  KUICKPAY_PREFIX: z.string().optional().or(z.literal("")),
  AUTH_JWT_SECRET: z.string().optional().or(z.literal("")),
});

export const serverEnv = serverSchema.parse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  PAYMENT_GATEWAY_PROVIDER:
    process.env.PAYMENT_GATEWAY_PROVIDER ?? "kuickpay",
  PAYMENT_GATEWAY_MERCHANT_ID: process.env.PAYMENT_GATEWAY_MERCHANT_ID ?? "",
  PAYMENT_GATEWAY_SECRET: process.env.PAYMENT_GATEWAY_SECRET ?? "",
  PAYMENT_GATEWAY_WEBHOOK_SECRET:
    process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET ?? "",
  PAYMENT_SANDBOX_FORCE_FAIL: process.env.PAYMENT_SANDBOX_FORCE_FAIL ?? "false",
  KUICKPAY_USERNAME: process.env.KUICKPAY_USERNAME ?? "",
  KUICKPAY_PASSWORD: process.env.KUICKPAY_PASSWORD ?? "",
  KUICKPAY_INSTITUTION_ID: process.env.KUICKPAY_INSTITUTION_ID ?? "",
  KUICKPAY_PREFIX: process.env.KUICKPAY_PREFIX ?? "71090",
  AUTH_JWT_SECRET: process.env.AUTH_JWT_SECRET ?? "",
});

/** Convenience re-export for server modules. Never import this from client components. */
export const env = {
  ...publicEnv,
  server: serverEnv,
};
