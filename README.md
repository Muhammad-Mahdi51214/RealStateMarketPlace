# Capital Smart City Marketplace

Real-estate marketplace for Capital Smart City Islamabad (DHA MarketPlace–inspired).

## Monorepo layout

```
frontend/   Next.js UI + App Router API route handlers (BFF)
backend/    Server modules (auth, demo store, payments, queries, supabase server)
shared/     Shared types + public env schema
```

Path aliases: `@/*` → frontend, `@backend/*` → backend/src, `@shared/*` → shared.

## Stack

- Next.js App Router + TypeScript + Tailwind
- Leaflet + **Esri/ArcGIS World Imagery** (no Mapbox token)
- Supabase-ready schema/RLS + in-memory **demo store** when Supabase is unset
- Sandbox payment gateway adapter (JazzCash / EasyPaisa / PayFast later — not QuickPay)

## Quick start

```bash
npm install
cp .env.local.example frontend/.env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts (password `demo1234`)

| Email | Role |
|---|---|
| `customer@csc.demo` | Customer |
| `officer@csc.demo` | Verification officer |
| `sales@csc.demo` | Sales/finance admin |
| `admin@csc.demo` | Super admin |

### End-to-end demo flow

1. Browse **CSC Owned Inventory** at `/inventory` (map + town plan).
2. Browse **Buy property** at `/buy-property` (listing cards).
3. Login as customer → Reserve plot → **Generate KuickPay PSID** → pay via bank/wallet (or Demo: mark PSID paid).
4. Upload Pakistan legal docs (CNIC front/back, etc.) on `/buy-property/[plotId]`.
5. Login as `officer@csc.demo` → KYC verify (+ advance).
6. Login as `admin@csc.demo` → Sale confirmation.
7. Staff: **Payment verified** queue at `/admin/payment-verified`.
8. Customer → **My Property**.

### Payments

Default provider is **KuickPay** (`PAYMENT_GATEWAY_PROVIDER=kuickpay`). Server generates a PSID; credentials stay in server env only (`KUICKPAY_*`). Without live keys, demo PSID + “mark paid” still works.

### Optional Supabase

Set `NEXT_PUBLIC_SUPABASE_*` in `frontend/.env.local` and apply `backend/supabase/migrations/*` + `backend/supabase/seed.sql`. Until then, the demo store powers auth/reservations/admin.
