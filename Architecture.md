# Architecture.md — Capital Smart City Marketplace

## 1. Tech Stack

### Frontend
- **Next.js 14+ (App Router)** with **React 18/19** + **TypeScript** (strict mode).
- **Tailwind CSS** + **shadcn/ui** for accessible, consistent component primitives.
- **Zustand** or **React Query (TanStack Query)** for client/server state — React Query for server-state (plots, reservations), Zustand for UI/local state (filters, map view state).
- **React Hook Form + Zod** for all forms and schema validation (registration, plot submission, KYC).
- **Map library**: Mapbox GL JS or Leaflet + a satellite tile provider (or Google Maps JS SDK) with custom polygon overlays for phase boundaries and marker clustering (Supercluster).
- **Framer Motion** for subtle UI transitions (sidebar, modals).

### Backend / Data
- **Supabase** (Postgres + Auth + Storage + Row Level Security + Edge Functions).
  - **Supabase Auth**: email/password + OTP (phone) for customers; separate `admin` role claims for Admin Portal.
  - **Supabase Postgres**: relational schema for plots, phases, users, reservations, transactions, documents.
  - **Supabase Storage**: CNIC, ownership documents, plot images (private buckets, signed URLs).
  - **Row Level Security (RLS)**: enforced per-table so customers only see their own reservations/documents; admins get elevated policies via custom claims/role table.
  - **Supabase Edge Functions**: for payment webhook handling, token expiry jobs, notification triggers.
- **Next.js Route Handlers (API routes)**: server-side logic that must not run client-side (payment initiation, admin-only mutations, signed URL generation).

### Payments
- Integration with a **Pakistani payment gateway** (e.g. JazzCash, EasyPaisa, or a QuickPay-style aggregator/PayFast) via their hosted checkout / redirect + server-side webhook verification. All webhook calls verified server-side (signature/HMAC check) before updating reservation status — never trust client-side "payment success" alone.

### Hosting / Infra
- **Vercel** for Next.js frontend/API routes.
- **Supabase Cloud** for DB/Auth/Storage.
- Environment secrets managed via Vercel/Supabase env vars — never committed.

---

## 2. User Roles & App Flow

```
Guest ──► Browse Inventory (Map/List) ──► View Plot Details
   │
   ├──► Register/Login ──► Customer
   │        │
   │        ├──► Dashboard / Profile
   │        ├──► Sell Property ──► Admin Review ──► Public Listing
   │        ├──► Buy Property ──► Select Plot ──► Generate Token
   │        │        └──► Pay Token (Gateway) ──► Plot Reserved
   │        │              └──► Submit Legal Docs ──► Admin Verifies
   │        │                    └──► Admin Confirms Sale ──► "My Property"
   │        └──► My Property (visible only if owns ≥1 confirmed plot)
   │
   └──► Admin Login ──► Admin Portal
            ├──► Inventory Management
            ├──► Listing Verification (Sell submissions)
            ├──► Document/KYC Verification
            ├──► Reservation & Token Management
            ├──► Sale Confirmation (final authority)
            ├──► Payment Reconciliation
            ├──► User Management
            └──► Audit Log / Reports
```

### Plot Status State Machine
```
Available ──(token payment success)──► Reserved
Reserved ──(token expiry / admin cancel)──► Available
Reserved ──(docs submitted + admin approval)──► Under Verification
Under Verification ──(admin confirms)──► Sold / Owned
Under Verification ──(admin rejects)──► Reserved or Available
```
This state machine must be enforced **server-side** (DB constraint + RLS + a Postgres function or Edge Function), never trusted from the client.

---

## 3. Folder & File Structure

```
capital-smart-city-marketplace/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                     # Landing page
│   │   ├── inventory/
│   │   │   ├── page.tsx                 # Map + List inventory (public)
│   │   │   └── [plotId]/page.tsx        # Plot detail (public, read-only)
│   │   └── town-plan/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── admin-login/page.tsx
│   ├── (customer)/
│   │   ├── dashboard/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── sell-property/
│   │   │   ├── page.tsx
│   │   │   └── new/page.tsx
│   │   ├── buy-property/
│   │   │   └── [plotId]/page.tsx        # Token reservation + payment
│   │   ├── my-property/page.tsx         # Conditional nav item
│   │   └── notifications/page.tsx
│   ├── (admin)/
│   │   ├── admin/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── inventory/page.tsx
│   │   │   ├── listings-review/page.tsx
│   │   │   ├── kyc-verification/page.tsx
│   │   │   ├── reservations/page.tsx
│   │   │   ├── sales-confirmation/page.tsx
│   │   │   ├── payments/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   └── audit-log/page.tsx
│   ├── api/
│   │   ├── payments/
│   │   │   ├── initiate/route.ts
│   │   │   └── webhook/route.ts
│   │   ├── plots/route.ts
│   │   ├── reservations/route.ts
│   │   └── admin/*/route.ts
│   └── layout.tsx
├── components/
│   ├── map/                             # MapView, ClusterMarker, PhasePolygon, FiltersSidebar, PlotDetailSidebar
│   ├── forms/                           # RegisterForm, KycUploadForm, SellPropertyForm
│   ├── dashboard/
│   ├── admin/
│   ├── ui/                              # shadcn/ui primitives
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── client.ts                    # browser client
│   │   ├── server.ts                    # server client (service role, only in server contexts)
│   │   └── middleware.ts
│   ├── payments/
│   │   └── gateway.ts                   # payment provider abstraction
│   ├── validation/                      # zod schemas
│   └── utils/
├── types/
│   └── database.types.ts                # generated from Supabase schema
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── middleware.ts                        # route protection (auth/role gating)
├── .env.local.example
└── package.json
```

---

## 4. Database Schema (Core Tables)

- `profiles` — id (FK auth.users), full_name, cnic, phone, role (customer/admin/super_admin), kyc_status.
- `phases` — id, name, society_id, boundary_geojson.
- `plots` — id, phase_id, plot_number, size, street, zone, type (residential/commercial), lump_sum_price, token_amount, status (available/reserved/under_verification/sold), rda_verified (bool), admin_verified (bool), coordinates/geometry.
- `payment_plans` — id, plot_id, plan_type, installment_schedule (jsonb).
- `listings_submissions` — id, plot_id, submitted_by, status (pending/approved/rejected), documents[].
- `reservations` — id, plot_id, customer_id, token_amount_paid, status, created_at, expires_at.
- `transactions` — id, reservation_id, gateway_ref, amount, status, raw_payload (jsonb).
- `documents` — id, owner_id, plot_id (nullable), type (cnic/ownership/other), file_url, verified_by, verified_at.
- `audit_logs` — id, actor_id, action, entity, entity_id, metadata (jsonb), created_at.
- `notifications` — id, user_id, message, read, created_at.

All monetary/state-changing tables get **RLS policies** scoped by `auth.uid()` and a `role` check via a `profiles.role` lookup or custom JWT claim.

---

## 5. App Flow — Buy Property (Detailed)

1. Customer clicks plot → `GET /api/plots/[id]` (public read).
2. Customer clicks "Reserve" → must be authenticated → `POST /api/reservations` creates a `pending_payment` reservation row (DB transaction locks the plot row to prevent double-booking).
3. `POST /api/payments/initiate` → creates gateway checkout session, returns redirect URL.
4. Gateway redirects back + sends async webhook → `POST /api/payments/webhook` verifies signature, updates `transactions` + `reservations.status = reserved` + `plots.status = reserved` atomically.
5. Customer uploads legal/ownership transfer docs → `documents` table, status `pending`.
6. Admin reviews in Admin Portal → approves/rejects → on approval, `reservations.status = under_verification`.
7. Admin gives final sale confirmation → `plots.status = sold`, ownership record finalized → plot now appears under customer's **My Property**.

---

## 6. Security Architecture

- Supabase **RLS** on every table; never expose the `service_role` key to the client.
- Admin actions routed through **server-only** API routes using the service role, gated by a role check middleware.
- All payment webhook endpoints verify gateway signature/HMAC before mutating state.
- File uploads (CNIC, ownership docs) go to **private** Supabase Storage buckets; access via short-lived signed URLs only.
- CSRF protection on all mutating routes; rate limiting on auth & payment endpoints.
- Full audit trail (`audit_logs`) for every admin verification/confirmation action — required for legal traceability.
