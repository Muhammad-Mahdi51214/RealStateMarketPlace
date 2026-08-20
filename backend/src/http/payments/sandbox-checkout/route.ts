import { NextRequest, NextResponse } from "next/server";
import { signSandboxWebhook } from "@backend/payments";
import { publicEnv } from "@shared/env.public";

/**
 * Demo hosted checkout for SandboxGateway (not a real merchant page).
 */
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref") ?? "";
  const amount = Number(request.nextUrl.searchParams.get("amount") ?? 0);
  const fail = request.nextUrl.searchParams.get("fail") === "1";
  const returnUrl =
    request.nextUrl.searchParams.get("returnUrl") ||
    publicEnv.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  const appUrl = publicEnv.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const payload = {
    gatewayRef: ref,
    amount,
    status: fail ? "failed" : "success",
  };
  const signature = signSandboxWebhook(payload);

  await fetch(`${appUrl}/api/payments/webhook`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-sandbox-signature": signature,
    },
    body: JSON.stringify(payload),
  });

  return NextResponse.redirect(returnUrl);
}
