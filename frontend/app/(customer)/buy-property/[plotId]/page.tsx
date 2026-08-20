"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCountdown } from "@/lib/hooks/use-countdown";
import { KuickPayVoucherCard } from "@/components/payments/kuickpay-voucher-card";
import { formatPkr } from "@/lib/utils";

const PAYMENT_RECEIPT_DOC = {
  value: "payment_receipt" as const,
  label: "Payment receipt",
  hint: "Bank / JazzCash / EasyPaisa payment screenshot or PDF",
};

const LEGAL_DOCS = [
  {
    value: "cnic_front" as const,
    label: "CNIC (front)",
    hint: "Clear scan of CNIC front side",
  },
  {
    value: "cnic_back" as const,
    label: "CNIC (back)",
    hint: "Clear scan of CNIC back side",
  },
  {
    value: "passport_photo" as const,
    label: "Passport photograph",
    hint: "Recent passport-size photo",
  },
  {
    value: "agreement_to_sell" as const,
    label: "Agreement to Sell / Affidavit",
    hint: "Signed undertaking for society file (required)",
  },
];

const REQUIRED_DOCS = [PAYMENT_RECEIPT_DOC, ...LEGAL_DOCS];

type Reservation = {
  id: string;
  plot_id: string;
  status: string;
  expires_at: string;
  extension_eligible?: boolean;
  extension_used?: boolean;
  verification_submitted_at?: string | null;
  payment_verified?: boolean;
  psid?: string | null;
  gateway_ref?: string | null;
  token_amount?: number | null;
  payment_instructions?: string[] | null;
  psid_expires_at?: string | null;
  voucher_issued_at?: string | null;
};

type DocRow = {
  id: string;
  type: string;
  file_name: string;
  file_url: string;
  status: string;
  reservation_id: string | null;
};

type PsidInfo = {
  psid: string;
  gatewayRef: string;
  amount: number;
  instructions: string[];
  provider: string;
  plotNumber?: string;
  phaseName?: string;
  size?: string;
  expiresAt: string;
  issuedAt?: string;
};

export default function BuyPropertyPage() {
  const { plotId } = useParams<{ plotId: string }>();
  const search = useSearchParams();
  const qc = useQueryClient();
  const [reservationId, setReservationId] = useState(
    search.get("reservationId") ?? "",
  );
  const [message, setMessage] = useState("");
  const [psidInfo, setPsidInfo] = useState<PsidInfo | null>(null);
  const [showVerification, setShowVerification] = useState(
    search.get("step") === "verification",
  );
  const [previewDoc, setPreviewDoc] = useState<DocRow | null>(null);
  const [docNames, setDocNames] = useState<Record<string, string>>({
    payment_receipt: "payment-receipt.jpg",
    cnic_front: "cnic-front.pdf",
    cnic_back: "cnic-back.pdf",
    passport_photo: "passport-photo.jpg",
    agreement_to_sell: "agreement-to-sell-affidavit.pdf",
  });
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const plotQuery = useQuery({
    queryKey: ["plot", plotId],
    queryFn: async () => {
      const res = await fetch(`/api/plots?limit=300&statuses=available,reserved,under_verification,sold`);
      const json = await res.json();
      return (json.data?.plots ?? []).find(
        (p: { id: string }) => p.id === plotId,
      );
    },
  });

  const reservations = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const res = await fetch("/api/reservations");
      const json = await res.json();
      return {
        reservations: (json.data?.reservations ?? []) as Reservation[],
        bannedUntil: json.data?.reservation_banned_until as string | null,
      };
    },
    refetchInterval: 5000,
  });

  const reservation =
    (reservations.data?.reservations ?? []).find((r) => r.id === reservationId) ??
    (reservations.data?.reservations ?? []).find((r) => r.plot_id === plotId);

  const docsQuery = useQuery({
    queryKey: ["documents", reservation?.id],
    enabled: Boolean(reservation?.id),
    queryFn: async () => {
      const res = await fetch(
        `/api/documents?reservationId=${encodeURIComponent(reservation!.id)}`,
      );
      const json = await res.json();
      return (json.data?.documents ?? []) as DocRow[];
    },
  });

  const countdown = useCountdown(
    reservation?.status === "pending_payment" ? reservation.expires_at : null,
  );

  const showExtensionModal = Boolean(
    reservation &&
      reservation.status === "expired" &&
      reservation.extension_eligible &&
      reservation.plot_id === plotId,
  );

  const bannedUntil = reservations.data?.bannedUntil;
  const isBanned =
    bannedUntil != null && new Date(bannedUntil).getTime() > Date.now();

  const docsByType = useMemo(() => {
    const map = new Map<string, DocRow>();
    for (const d of docsQuery.data ?? []) {
      if (!map.has(d.type) || d.status !== "rejected") {
        map.set(d.type, d);
      }
    }
    return map;
  }, [docsQuery.data]);

  const allRequiredUploaded = REQUIRED_DOCS.every((d) => {
    const row = docsByType.get(d.value);
    return row && row.status !== "rejected";
  });

  useEffect(() => {
    if (!psidInfo?.gatewayRef || reservation?.status !== "pending_payment") {
      return;
    }
    const id = setInterval(async () => {
      const res = await fetch(
        `/api/payments/status?ref=${encodeURIComponent(psidInfo.gatewayRef)}`,
      );
      const json = await res.json();
      if (json.data?.payment_verified) {
        setMessage("Payment verified. Continue to document verification.");
        setPsidInfo(null);
        await qc.invalidateQueries({ queryKey: ["reservations"] });
        await qc.invalidateQueries({ queryKey: ["plot", plotId] });
      }
    }, 4000);
    return () => clearInterval(id);
  }, [psidInfo, reservation?.status, qc, plotId]);

  // Restore PSID voucher after refresh / remount
  useEffect(() => {
    if (psidInfo) return;
    if (reservation?.status !== "pending_payment") return;
    if (!reservation.psid || !reservation.gateway_ref) return;
    const expiresAt =
      reservation.psid_expires_at ?? reservation.expires_at;
    setPsidInfo({
      psid: reservation.psid,
      gatewayRef: reservation.gateway_ref,
      amount: reservation.token_amount ?? Number(plotQuery.data?.token_amount ?? 0),
      instructions:
        reservation.payment_instructions ?? [
          "Open your bank mobile app, JazzCash, EasyPaisa, or visit an OTC partner.",
          "Select Bill Payment → KuickPay (or search Capital Smart City).",
          `Enter PSID / Consumer Number: ${reservation.psid}`,
          "Confirm the amount and pay. This page updates after confirmation.",
          "Note: This PSID expires 2 hours after generation. No payment will be accepted after the deadline.",
        ],
      provider: "kuickpay",
      plotNumber: plotQuery.data?.plot_number,
      phaseName: plotQuery.data?.phase?.name,
      size: plotQuery.data?.size,
      expiresAt,
      issuedAt: reservation.voucher_issued_at ?? undefined,
    });
  }, [reservation, psidInfo, plotQuery.data]);

  async function createReservation() {
    setMessage("");
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plotId }),
    });
    const json = await res.json();
    if (!json.success) {
      setMessage(json.error?.message ?? "Could not reserve");
      return;
    }
    setReservationId(json.data.reservation.id);
    await qc.invalidateQueries({ queryKey: ["reservations"] });
    await qc.invalidateQueries({ queryKey: ["plot", plotId] });
    setMessage("Plot held for 2 hours. Generating your KuickPay voucher…");
    await payToken(json.data.reservation.id);
  }

  async function payToken(id?: string) {
    const rid = id ?? reservation?.id;
    if (!rid) return;
    const res = await fetch("/api/payments/initiate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reservationId: rid }),
    });
    const json = await res.json();
    if (!json.success) {
      setMessage(json.error?.message ?? "Payment init failed");
      return;
    }

    const data = json.data as {
      checkoutUrl?: string | null;
      psid?: string | null;
      gatewayRef: string;
      amount: number;
      instructions?: string[];
      provider: string;
      plot_number?: string;
      psidExpiresAt?: string;
      dueDate?: string;
      issuedAt?: string;
    };

    if (data.psid) {
      setPsidInfo({
        psid: data.psid,
        gatewayRef: data.gatewayRef,
        amount: data.amount,
        instructions: data.instructions ?? [],
        provider: data.provider,
        plotNumber: data.plot_number ?? plotQuery.data?.plot_number,
        phaseName: plotQuery.data?.phase?.name,
        size: plotQuery.data?.size,
        expiresAt:
          data.psidExpiresAt ??
          data.dueDate ??
          new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        issuedAt: data.issuedAt,
      });
      setMessage(
        "Voucher ready. Pay within 2 hours — this PSID stops working after the deadline.",
      );
      await qc.invalidateQueries({ queryKey: ["reservations"] });
      return;
    }

    // Sandbox fallback: keep user on page with a clear CTA (do not auto-jump)
    if (data.checkoutUrl) {
      setMessage(
        "No KuickPay PSID was returned (sandbox mode). Switch PAYMENT_GATEWAY_PROVIDER=kuickpay in .env.local, or open sandbox checkout.",
      );
      setPsidInfo({
        psid: "SANDBOX-NO-PSID",
        gatewayRef: data.gatewayRef,
        amount: data.amount,
        instructions: [
          ...(data.instructions ?? []),
          `Sandbox checkout: ${data.checkoutUrl}`,
        ],
        provider: data.provider,
        plotNumber: plotQuery.data?.plot_number,
        phaseName: plotQuery.data?.phase?.name,
        size: plotQuery.data?.size,
        expiresAt:
          data.psidExpiresAt ??
          new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        issuedAt: data.issuedAt,
      });
      return;
    }

    setMessage("Payment initiated, but no voucher details were returned.");
  }

  async function simulatePaid() {
    if (!psidInfo?.gatewayRef) return;
    const res = await fetch(
      `/api/payments/status?ref=${encodeURIComponent(psidInfo.gatewayRef)}&simulate=paid`,
    );
    const json = await res.json();
    if (json.data?.payment_verified) {
      setMessage("Payment confirmed. Start verification when ready.");
      setPsidInfo(null);
      await qc.invalidateQueries({ queryKey: ["reservations"] });
      await qc.invalidateQueries({ queryKey: ["plot", plotId] });
    } else {
      setMessage(json.error?.message ?? "Could not simulate payment");
    }
  }

  async function copyPsid() {
    if (!psidInfo?.psid) return;
    await navigator.clipboard.writeText(psidInfo.psid);
    setMessage("PSID copied to clipboard.");
  }

  async function extendReservation() {
    if (!reservation?.id) return;
    const res = await fetch("/api/reservations/extend", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reservationId: reservation.id }),
    });
    const json = await res.json();
    if (!json.success) {
      setMessage(json.error?.message ?? "Could not extend");
      return;
    }
    setMessage("Final 2-hour window started. Generate or reuse your PSID voucher.");
    await qc.invalidateQueries({ queryKey: ["reservations"] });
    await qc.invalidateQueries({ queryKey: ["plot", plotId] });
  }

  async function declineExtension() {
    if (!reservation?.id) return;
    const res = await fetch("/api/reservations/decline-extension", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reservationId: reservation.id }),
    });
    const json = await res.json();
    if (!json.success) {
      setMessage(json.error?.message ?? "Could not decline");
      return;
    }
    setMessage("Extension declined. Plot released.");
    await qc.invalidateQueries({ queryKey: ["reservations"] });
    await qc.invalidateQueries({ queryKey: ["plot", plotId] });
  }

  async function cancelReservation() {
    if (!reservation?.id) return;
    const okConfirm = window.confirm(
      "Cancel this reservation? The plot will be released. This does not start a 24-hour ban.",
    );
    if (!okConfirm) return;
    setMessage("");
    const res = await fetch("/api/reservations/cancel", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reservationId: reservation.id }),
    });
    const json = await res.json();
    if (!json.success) {
      setMessage(json.error?.message ?? "Could not cancel");
      return;
    }
    setPsidInfo(null);
    setReservationId("");
    setMessage("Reservation cancelled. You can reserve another available plot.");
    await qc.invalidateQueries({ queryKey: ["reservations"] });
    await qc.invalidateQueries({ queryKey: ["plot", plotId] });
  }

  async function uploadDoc(type: string) {
    if (!reservation?.id) return;
    setUploadingType(type);
    const file_name = docNames[type] || `${type}.pdf`;
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reservationId: reservation.id,
        type,
        file_name,
      }),
    });
    const json = await res.json();
    setUploadingType(null);
    if (!json.success) {
      setMessage(json.error?.message ?? "Upload failed");
      return;
    }
    setMessage(`${file_name} uploaded.`);
    await qc.invalidateQueries({ queryKey: ["documents", reservation.id] });
  }

  async function submitVerification() {
    if (!reservation?.id) return;
    const res = await fetch("/api/reservations/submit-verification", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reservationId: reservation.id }),
    });
    const json = await res.json();
    if (!json.success) {
      setMessage(json.error?.message ?? "Submit failed");
      return;
    }
    setMessage("Documents submitted for admin verification.");
    await qc.invalidateQueries({ queryKey: ["reservations"] });
    await qc.invalidateQueries({ queryKey: ["plot", plotId] });
  }

  const plot = plotQuery.data;
  const paid =
    reservation?.status === "reserved" ||
    reservation?.status === "under_verification" ||
    reservation?.status === "confirmed";

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <div>
        <h1 className="text-[28px] font-bold text-primary-navy">
          Buy / reserve plot
        </h1>
        <p className="text-sm text-text-secondary">
          Reserve → pay KuickPay voucher → verify documents → admin confirmation
        </p>
      </div>

      {isBanned ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Reservation restricted until{" "}
          <strong>{new Date(bannedUntil!).toLocaleString()}</strong>. You
          cannot reserve any plot during this period.
        </div>
      ) : null}

      {message ? (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-primary-teal">
          {message}
        </p>
      ) : null}

      {/* 1. Plot summary */}
      {plot ? (
        <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Plot summary
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge
              variant={
                plot.type === "residential" ? "residential" : "commercial"
              }
            >
              {plot.type}
            </Badge>
            <Badge variant={plot.is_available ? "available" : "muted"}>
              {plot.is_available
                ? "Available"
                : plot.status === "reserved"
                  ? "Reserved"
                  : plot.status?.replaceAll("_", " ")}
            </Badge>
          </div>
          <h2 className="mt-3 text-xl font-semibold">{plot.plot_number}</h2>
          <p className="text-sm text-text-secondary">
            {plot.phase?.name} · {plot.size}
          </p>
          <p className="mt-3 text-lg font-semibold tabular-nums text-primary-navy">
            {formatPkr(plot.lump_sum_price)}
          </p>
          <p className="text-sm tabular-nums text-primary-teal">
            Token {formatPkr(plot.token_amount)}
          </p>
        </section>
      ) : null}

      {/* 2. Reservation */}
      <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Reservation
        </p>
        <p className="mt-2 capitalize text-text-secondary">
          {reservation?.status?.replaceAll("_", " ") ?? "Not started"}
        </p>

        {reservation?.status === "pending_payment" ? (
          <p className="mt-3 font-mono text-lg font-bold tabular-nums text-[#D97706]">
            {countdown.reservedLabel || "Reserved for 00:00:00"}
          </p>
        ) : null}

        {reservation?.status === "pending_payment" ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => void cancelReservation()}
            >
              Cancel reservation
            </Button>
            <p className="w-full text-[11px] text-text-secondary">
              Cancelling releases the plot and does not apply the 24-hour ban
              (that only applies if you use the same-day extension and miss
              payment again).
            </p>
          </div>
        ) : null}

        {!reservation ||
        (reservation.status === "expired" && !reservation.extension_eligible) ||
        reservation.status === "cancelled" ? (
          <Button
            className="mt-4"
            onClick={() => void createReservation()}
            disabled={isBanned || (plot && !plot.is_available)}
          >
            Reserve plot
          </Button>
        ) : null}
      </section>

      {/* 3. Payment voucher — ticket layout on page */}
      {reservation?.status === "pending_payment" ? (
        <section className="rounded-xl border border-border bg-[#f3f6fa] p-5 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            KuickPay voucher
          </p>

          {!psidInfo ? (
            <Button variant="secondary" onClick={() => void payToken()}>
              Generate KuickPay voucher
            </Button>
          ) : (
            <KuickPayVoucherCard
              psid={psidInfo.psid}
              amount={psidInfo.amount}
              plotNumber={
                psidInfo.plotNumber ?? plot?.plot_number ?? "Plot"
              }
              phaseName={psidInfo.phaseName ?? plot?.phase?.name}
              size={psidInfo.size ?? plot?.size}
              instructions={psidInfo.instructions}
              issuedAt={psidInfo.issuedAt}
              expiresAt={psidInfo.expiresAt}
              onCopy={() => void copyPsid()}
              onSimulatePaid={() => void simulatePaid()}
            />
          )}
        </section>
      ) : null}

      {/* 4. Verification entry + docs */}
      {paid ? (
        <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Document verification
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Payment received. Upload required legal documents for CSC admin review.
          </p>

          {!showVerification && reservation?.status === "reserved" ? (
            <Button className="mt-4" onClick={() => setShowVerification(true)}>
              Do Verification
            </Button>
          ) : null}

          {(showVerification ||
            reservation?.status === "under_verification" ||
            reservation?.verification_submitted_at) && (
            <div className="mt-5 space-y-4">
              {(() => {
                const receipt = docsByType.get(PAYMENT_RECEIPT_DOC.value);
                return (
                  <div className="rounded-xl border border-[#B7D4FF] bg-[#F7FBFF] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary-navy">
                          Payment receipt
                        </p>
                        <p className="mt-1 font-semibold text-primary-navy">
                          {PAYMENT_RECEIPT_DOC.label}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {PAYMENT_RECEIPT_DOC.hint}
                        </p>
                      </div>
                      <Badge
                        variant={
                          receipt?.status === "verified"
                            ? "available"
                            : receipt
                              ? "residential"
                              : "muted"
                        }
                      >
                        {receipt?.status ?? "required"}
                      </Badge>
                    </div>
                    {receipt ? (
                      <button
                        type="button"
                        className="mt-3 text-left text-sm font-medium text-primary-teal underline-offset-2 hover:underline"
                        onClick={() => setPreviewDoc(receipt)}
                      >
                        Preview: {receipt.file_name}
                      </button>
                    ) : null}
                    {reservation?.status === "reserved" &&
                    !reservation.verification_submitted_at ? (
                      <div className="mt-3 flex flex-wrap items-end gap-2">
                        <div className="min-w-[200px] flex-1 space-y-1.5">
                          <Label
                            htmlFor="file-payment_receipt"
                            className="text-xs"
                          >
                            File name (demo)
                          </Label>
                          <Input
                            id="file-payment_receipt"
                            value={docNames.payment_receipt ?? ""}
                            onChange={(e) =>
                              setDocNames((prev) => ({
                                ...prev,
                                payment_receipt: e.target.value,
                              }))
                            }
                            className="h-9"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={uploadingType === "payment_receipt"}
                          onClick={() => void uploadDoc("payment_receipt")}
                        >
                          {uploadingType === "payment_receipt"
                            ? "Uploading…"
                            : receipt
                              ? "Replace receipt"
                              : "Upload receipt"}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })()}

              <p className="text-sm font-semibold text-primary-navy">
                Legal documents
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {LEGAL_DOCS.map((doc) => {
                  const uploaded = docsByType.get(doc.value);
                  return (
                    <div
                      key={doc.value}
                      className="flex flex-col rounded-xl border border-border bg-slate-50/80 p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-primary-navy">
                            {doc.label}
                          </p>
                          <p className="text-xs text-text-secondary">{doc.hint}</p>
                        </div>
                        <Badge
                          variant={
                            uploaded?.status === "verified"
                              ? "available"
                              : uploaded?.status === "rejected"
                                ? "muted"
                                : uploaded
                                  ? "residential"
                                  : "muted"
                          }
                        >
                          {uploaded?.status ?? "required"}
                        </Badge>
                      </div>
                      {uploaded ? (
                        <button
                          type="button"
                          className="mt-3 text-left text-sm font-medium text-primary-teal underline-offset-2 hover:underline"
                          onClick={() => setPreviewDoc(uploaded)}
                        >
                          Preview: {uploaded.file_name}
                        </button>
                      ) : null}
                      {reservation?.status === "reserved" &&
                      !reservation.verification_submitted_at ? (
                        <div className="mt-3 space-y-2">
                          <Label htmlFor={`file-${doc.value}`} className="text-xs">
                            File name (demo)
                          </Label>
                          <Input
                            id={`file-${doc.value}`}
                            value={docNames[doc.value] ?? ""}
                            onChange={(e) =>
                              setDocNames((prev) => ({
                                ...prev,
                                [doc.value]: e.target.value,
                              }))
                            }
                            className="h-9"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={uploadingType === doc.value}
                            onClick={() => void uploadDoc(doc.value)}
                          >
                            {uploadingType === doc.value
                              ? "Uploading…"
                              : uploaded
                                ? "Replace file"
                                : "Upload"}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {reservation?.status === "reserved" &&
              !reservation.verification_submitted_at ? (
                <Button
                  className="w-full sm:w-auto"
                  disabled={!allRequiredUploaded}
                  onClick={() => void submitVerification()}
                >
                  Submit for verification
                </Button>
              ) : null}

              {reservation?.status === "under_verification" ? (
                <p className="text-sm text-primary-teal">
                  Submitted — admins will view each document, then verify. Final
                  plot confirmation is by super admin after all docs pass.
                </p>
              ) : null}

              {(docsQuery.data?.length ?? 0) > 0 ? (
                <div className="rounded-xl border border-border p-4">
                  <p className="text-sm font-semibold text-primary-navy">
                    Submitted documents
                  </p>
                  <ul className="mt-2 space-y-2">
                    {(docsQuery.data ?? []).map((d) => (
                      <li
                        key={d.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-sm"
                      >
                        <span>
                          {d.type.replaceAll("_", " ")} · {d.file_name} ·{" "}
                          <span className="capitalize text-text-secondary">
                            {d.status}
                          </span>
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewDoc(d)}
                        >
                          Preview
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      {/* Extension modal */}
      {showExtensionModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-primary-navy">
              Payment window ended
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Will you complete payment in the next 2 hours and keep this
              reservation? This is your last extension for today on this plot.
              If you extend and still miss payment, you will be blocked from
              reserving any plot for 24 hours.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => void extendReservation()}>
                Yes, reserve for 2 more hours
              </Button>
              <Button variant="outline" onClick={() => void declineExtension()}>
                No, release plot
              </Button>
              <Button variant="outline" onClick={() => void cancelReservation()}>
                Cancel reservation
              </Button>
            </div>
            <p className="mt-3 text-[11px] text-text-secondary">
              Declining or cancelling does not ban you. The 24-hour ban only
              applies if you take the extension and miss payment again.
            </p>
          </div>
        </div>
      ) : null}

      {/* Doc preview modal */}
      {previewDoc ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-primary-navy">
              Document preview
            </h2>
            <p className="mt-2 text-sm capitalize text-text-secondary">
              {previewDoc.type.replaceAll("_", " ")} · {previewDoc.status}
            </p>
            <div className="mt-4 rounded-xl border border-dashed border-border bg-slate-50 p-8 text-center">
              <p className="font-semibold text-primary-navy">
                {previewDoc.file_name}
              </p>
              <p className="mt-2 text-xs text-text-secondary">
                Demo storage: {previewDoc.file_url}
              </p>
            </div>
            <Button className="mt-4" onClick={() => setPreviewDoc(null)}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
