"use client";

import { Button } from "@/components/ui/button";
import { formatPkr } from "@/lib/utils";
import { downloadVoucherPdf } from "@/lib/payments/voucher-html";
import { useCountdown } from "@/lib/hooks/use-countdown";

export type OnPageVoucherProps = {
  psid: string;
  amount: number;
  plotNumber: string;
  phaseName?: string;
  size?: string;
  instructions: string[];
  issuedAt?: string | null;
  expiresAt: string;
  onCopy: () => void;
  onSimulatePaid?: () => void;
};

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BarcodeBars({ psid }: { psid: string }) {
  const digits = psid.replace(/\D/g, "") || "0";
  return (
    <div className="flex items-end justify-center gap-px" aria-hidden>
      {[...digits].map((d, i) => {
        const w = 1 + (Number(d) % 3);
        const h = 28 + (Number(d) % 2) * 8;
        return (
          <span
            key={`${i}-${d}`}
            className="inline-block bg-slate-900"
            style={{
              width: w,
              height: h,
              marginRight: i % 4 === 0 ? 2 : 0,
            }}
          />
        );
      })}
    </div>
  );
}

/** On-page ticket voucher matching the A4 download layout. */
export function KuickPayVoucherCard({
  psid,
  amount,
  plotNumber,
  phaseName,
  size,
  instructions,
  issuedAt,
  expiresAt,
  onCopy,
  onSimulatePaid,
}: OnPageVoucherProps) {
  const countdown = useCountdown(expiresAt);
  const expired = countdown.expired;
  const issuedLabel = issuedAt
    ? formatDeadline(issuedAt)
    : formatDeadline(new Date().toISOString());
  const expiresLabel = formatDeadline(expiresAt);
  const plotLine = [plotNumber, phaseName, size].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
      <div className="px-7 pb-5 pt-9 text-center">
        <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-teal to-primary-navy text-lg font-bold text-white">
          KP
        </div>
        <h2 className="text-[28px] font-bold tracking-tight text-slate-900">
          Payment voucher
        </h2>
        <p className="mt-2 text-sm leading-snug text-slate-500">
          Capital Smart City · Token payment via KuickPay
          <br />
          Pay with bank, JazzCash, or EasyPaisa
        </p>
      </div>

      <div className="relative mx-6 border-t-2 border-dashed border-slate-200">
        <span className="absolute -left-9 -top-[9px] h-[18px] w-[18px] rounded-full bg-[#f3f6fa]" />
        <span className="absolute -right-9 -top-[9px] h-[18px] w-[18px] rounded-full bg-[#f3f6fa]" />
      </div>

      <div className="space-y-4 px-7 py-5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
            PSID / Consumer number
          </p>
          <p className="mt-1 font-mono text-[22px] font-bold tracking-wide text-slate-900">
            {psid}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
              Amount
            </p>
            <p className="mt-1 text-base font-bold tabular-nums text-slate-900">
              {formatPkr(amount)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
              Issued
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">{issuedLabel}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
              Plot
            </p>
            <p className="mt-1 text-[15px] font-bold text-slate-900">{plotLine}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
              PSID deadline
            </p>
            <p
              className={`mt-1 font-mono text-base font-bold tabular-nums ${
                expired ? "text-red-600" : "text-[#D97706]"
              }`}
            >
              {expired ? "Expired" : `Pay by ${expiresLabel}`}
            </p>
            {!expired ? (
              <p className="mt-1 font-mono text-sm tabular-nums text-[#D97706]">
                Time left {countdown.label}
              </p>
            ) : null}
          </div>
        </div>

        <div
          className={`rounded-xl border px-4 py-3 ${
            expired
              ? "border-red-200 bg-red-50"
              : "border-[#d6e6ff] bg-[#eef6ff]"
          }`}
        >
          <p className="text-sm font-semibold text-slate-900">
            Society account · KuickPay
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {expired
              ? "This PSID has expired. No payment will be accepted. Cancel or wait for the extension offer after the hold ends."
              : `Use the PSID above. Amount must match exactly. This PSID expires at ${expiresLabel} (2 hours after generation). No payment will be accepted after this period.`}
          </p>
        </div>

        <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-slate-600">
          {instructions.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="relative mx-6 border-t-2 border-dashed border-slate-200">
        <span className="absolute -left-9 -top-[9px] h-[18px] w-[18px] rounded-full bg-[#f3f6fa]" />
        <span className="absolute -right-9 -top-[9px] h-[18px] w-[18px] rounded-full bg-[#f3f6fa]" />
      </div>

      <div className="space-y-3 px-7 pb-8 pt-5 text-center">
        <BarcodeBars psid={psid} />
        <p className="font-mono text-xs tracking-[0.12em] text-slate-600">
          {psid}
        </p>
        <p className="text-[11px] text-slate-400">
          RealStateMarketPlace · Keep this voucher until payment is confirmed
        </p>

        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Button size="sm" onClick={onCopy} disabled={expired}>
            Copy PSID
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              downloadVoucherPdf({
                psid,
                amount,
                plotNumber,
                phaseName,
                size,
                instructions,
                issuedAt: issuedAt ? new Date(issuedAt) : undefined,
                expiresAt: new Date(expiresAt),
              })
            }
          >
            Download A4 voucher
          </Button>
          {onSimulatePaid && !expired ? (
            <Button size="sm" variant="outline" onClick={onSimulatePaid}>
              Demo: mark paid
            </Button>
          ) : null}
        </div>
        {!expired ? (
          <p className="text-[11px] text-slate-500">
            Waiting for KuickPay confirmation… this page updates automatically.
          </p>
        ) : (
          <p className="text-[11px] font-medium text-red-600">
            PSID expired — payments on this number are rejected.
          </p>
        )}
      </div>

      {/* scalloped bottom */}
      <div
        className="h-3.5 bg-[radial-gradient(circle_at_10px_0,transparent_9px,#fff_10px)] bg-[length:20px_14px] bg-[position:-5px_0] bg-repeat-x"
        aria-hidden
      />
    </div>
  );
}
