export type VoucherPrintInput = {
  psid: string;
  amount: number;
  plotNumber: string;
  phaseName?: string;
  size?: string;
  instructions?: string[];
  issuedAt?: Date;
  expiresAt?: Date;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatPkrPlain(amount: number): string {
  return `Rs ${Math.round(amount).toLocaleString("en-PK")}`;
}

function formatDeadline(d: Date): string {
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function barcodeBars(psid: string): string {
  const digits = psid.replace(/\D/g, "") || "0";
  return [...digits]
    .map((d, i) => {
      const w = 1 + (Number(d) % 3);
      const h = 36 + (Number(d) % 2) * 8;
      const gap = i % 4 === 0 ? 3 : 1;
      return `<span style="display:inline-block;width:${w}px;height:${h}px;background:#111;margin-right:${gap}px"></span>`;
    })
    .join("");
}

/** A4 print/PDF voucher inspired by ticket-style receipts. */
export function buildVoucherHtml(input: VoucherPrintInput): string {
  const issued = input.issuedAt ?? new Date();
  const expires =
    input.expiresAt ?? new Date(issued.getTime() + 2 * 60 * 60 * 1000);
  const dateLabel = formatDeadline(issued);
  const expiresLabel = formatDeadline(expires);
  const amount = formatPkrPlain(input.amount);
  const plotLine = [input.plotNumber, input.phaseName, input.size]
    .filter(Boolean)
    .join(" · ");
  const expiryNote = `Note: This PSID expires at ${expiresLabel} (2 hours after generation). No payment will be accepted after this period.`;
  const instructions =
    input.instructions?.length
      ? input.instructions
      : [
          "Pay via bank app, JazzCash, EasyPaisa, or OTC partner.",
          "Bill Payment → KuickPay → Capital Smart City.",
          `Enter PSID: ${input.psid}`,
          `Confirm amount ${amount} and pay.`,
          expiryNote,
        ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>KuickPay Voucher — ${escapeHtml(input.psid)}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      background: #eef1f5;
      color: #0f172a;
    }
    .sheet {
      width: 100%;
      max-width: 420px;
      background: #fff;
      border-radius: 20px 20px 0 0;
      box-shadow: 0 18px 50px rgba(15, 23, 42, 0.12);
      overflow: hidden;
      position: relative;
    }
    .sheet::after {
      content: "";
      display: block;
      height: 14px;
      background:
        radial-gradient(circle at 10px 0, transparent 9px, #fff 10px) repeat-x;
      background-size: 20px 14px;
      background-position: -5px 0;
      transform: translateY(1px);
    }
    .head {
      text-align: center;
      padding: 36px 28px 20px;
    }
    .badge {
      width: 56px;
      height: 56px;
      margin: 0 auto 14px;
      border-radius: 50%;
      background: linear-gradient(145deg, #0E7C86, #001A4D);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 700;
    }
    h1 {
      margin: 0;
      font-size: 28px;
      letter-spacing: -0.02em;
    }
    .sub {
      margin: 8px 0 0;
      color: #64748b;
      font-size: 14px;
      line-height: 1.45;
    }
    .dash {
      border: none;
      border-top: 2px dashed #dbe2ea;
      margin: 0 24px;
      position: relative;
    }
    .dash::before, .dash::after {
      content: "";
      position: absolute;
      top: -9px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #eef1f5;
    }
    .dash::before { left: -33px; }
    .dash::after { right: -33px; }
    .body { padding: 22px 28px 10px; }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px 12px;
    }
    .label {
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    .value {
      font-size: 16px;
      font-weight: 700;
      word-break: break-all;
    }
    .span2 { grid-column: 1 / -1; }
    .deadline { color: #b45309; }
    .paybox {
      margin-top: 18px;
      padding: 14px 16px;
      border-radius: 14px;
      background: #eef6ff;
      border: 1px solid #d6e6ff;
    }
    .paybox strong { display: block; font-size: 14px; margin-bottom: 4px; }
    .paybox span { font-size: 12px; color: #64748b; }
    ul {
      margin: 14px 0 0;
      padding-left: 18px;
      color: #475569;
      font-size: 12px;
      line-height: 1.5;
    }
    .foot {
      padding: 18px 28px 28px;
      text-align: center;
    }
    .bars {
      display: flex;
      align-items: flex-end;
      justify-content: center;
      min-height: 48px;
      margin-bottom: 8px;
    }
    .psid-line {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      letter-spacing: 0.12em;
      color: #334155;
    }
    .brand {
      margin-top: 14px;
      font-size: 11px;
      color: #94a3b8;
    }
    @media print {
      body { background: #fff; }
      .sheet { box-shadow: none; }
      .dash::before, .dash::after { background: #fff; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div class="badge">KP</div>
      <h1>Payment voucher</h1>
      <p class="sub">Capital Smart City · Token payment via KuickPay<br/>Pay with bank, JazzCash, or EasyPaisa</p>
    </div>
    <hr class="dash" />
    <div class="body">
      <div class="grid">
        <div class="span2">
          <div class="label">PSID / Consumer number</div>
          <div class="value" style="font-size:22px;letter-spacing:0.04em">${escapeHtml(input.psid)}</div>
        </div>
        <div>
          <div class="label">Amount</div>
          <div class="value">${escapeHtml(amount)}</div>
        </div>
        <div>
          <div class="label">Issued</div>
          <div class="value" style="font-size:14px">${escapeHtml(dateLabel)}</div>
        </div>
        <div class="span2">
          <div class="label">Plot</div>
          <div class="value" style="font-size:15px">${escapeHtml(plotLine)}</div>
        </div>
        <div class="span2">
          <div class="label">PSID deadline</div>
          <div class="value deadline">Pay by ${escapeHtml(expiresLabel)}</div>
        </div>
      </div>
      <div class="paybox">
        <strong>Society account · KuickPay</strong>
        <span>Use the PSID above. Amount must match exactly. This PSID expires at ${escapeHtml(expiresLabel)} (2 hours after generation). No payment will be accepted after this period.</span>
      </div>
      <ul>
        ${instructions.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
      </ul>
    </div>
    <hr class="dash" />
    <div class="foot">
      <div class="bars">${barcodeBars(input.psid)}</div>
      <div class="psid-line">${escapeHtml(input.psid)}</div>
      <div class="brand">RealStateMarketPlace · Keep this voucher until payment is confirmed</div>
    </div>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
</body>
</html>`;
}

export function downloadVoucherPdf(input: VoucherPrintInput) {
  const html = buildVoucherHtml(input);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (!w) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `kuickpay-voucher-${input.psid}.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
