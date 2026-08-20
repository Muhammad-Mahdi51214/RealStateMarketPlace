# Capital Smart City Marketplace — Master Build Specification

> **Purpose of this file:** This is the single source of truth for building the Capital Smart City Marketplace platform. It covers product scope, architecture, database schema, workflows, design system, and coding rules. Build the project by following this document phase by phase (see Section 13). Do not invent scope beyond what's written here — where something is ambiguous, prefer the simplest implementation consistent with the rules in Section 12.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Target Users & Roles](#2-target-users--roles)
3. [Core Features by Module](#3-core-features-by-module)
4. [Tech Stack](#4-tech-stack)
5. [System Architecture & App Flow](#5-system-architecture--app-flow)
6. [Folder & File Structure](#6-folder--file-structure)
7. [Database Schema](#7-database-schema)
8. [Row Level Security (RLS) Policies](#8-row-level-security-rls-policies)
9. [API Routes](#9-api-routes)
10. [Key Workflows](#10-key-workflows)
11. [Design System](#11-design-system)
12. [Development Rules](#12-development-rules)
13. [Build Phases](#13-build-phases)
14. [Environment Variables](#14-environment-variables)
15. [Out of Scope (Future Work)](#15-out-of-scope-future-work)

---

## 1. Project Overview

**Capital Smart City Marketplace** is a real-estate marketplace web platform for Capital Smart City Islamabad, modeled on the DHA Marketplace pattern. It has two sides:

- **Public/Customer side** — anyone can browse the full live plot inventory on an interactive map (no login required). Registered customers can buy a plot (token reservation + online payment), sell a plot they own, manage a profile/dashboard, and track owned plots under "My Property."
- **Admin side** — the society's own staff verify documents, manage inventory, and give final legal confirmation on every sale. **The Admin Portal always has final authority on ownership confirmation** — the customer-facing flow only gets a plot to "reserved" and "under verification," never automatically to "sold."

The platform must feel institutional and trustworthy (it handles real legal property transactions), be mobile-responsive, and be safe against race conditions (two people can never buy the same plot).

---

## 2. Target Users & Roles

| Role | Access | Description |
|---|---|---|
| **Guest** | Public, no login | Browses inventory map/list, views plot details, reads Town Plan. |
| **Customer** | Authenticated | Buys/reserves plots, sells plots, manages profile, dashboard, "My Property." |
| **Verification Officer** (Admin) | Admin Portal | Reviews KYC & ownership documents, approves/rejects Sell submissions. |
| **Sales/Finance Admin** (Admin) | Admin Portal | Manages reservations, tokens, payment reconciliation. |
| **Super Admin** | Admin Portal | Full control — inventory, users, admins, final sale confirmation. |

Roles are stored on the `profiles` table (`role` column) and enforced both in the UI (route gating) and in the database (RLS policies) — never trust the client alone for authorization.

---

## 3. Core Features by Module

### 3.1 Public Inventory (No Auth Required)
- Landing page with branding and announcement banner.
- **Live plot inventory** — always public, reflects real-time plot status.
- **Interactive Map View** — satellite map, dashed phase-boundary polygons, clustered plot markers per phase with count bubbles (e.g., "Phase 1" cluster showing "236").
- **Town Plan view** — toggle between Map View and a static Town Plan document/image.
- **Filters sidebar** — price range (min/max + slider + apply), plot type (Residential/Commercial), phase, amenities layer toggle (mosque/park/hospital/school icons).
- **Plot Detail Sidebar** (on marker/list click) — Plot #, status pill (Residential/Commercial, Unsold/Reserved/Sold), Size, Phase/Sector, Street, Zone, Lump Sum Price, Token Amount, available Payment Plans, a disclaimer ("Prices are exclusive of Chargex & Govt Taxes"), and **"RDA Verified"** / **"Documents Verified by Admin"** trust badges.
- List View as an alternative to the map.

### 3.2 Auth
- Customer Register/Login — email or phone + password, OTP verification.
- Admin Login — separate route, role-gated, never reachable from the customer nav.
- Session handling via Supabase Auth cookies; protected routes redirect unauthenticated users to login.

### 3.3 Customer Dashboard & Profile
- Dashboard: active reservations, saved/favorited plots, notifications, recent activity summary.
- Profile: personal info, CNIC upload, phone/contact, KYC status indicator.
- Notifications: in-app list — reservation status changes, payment reminders, admin messages.

### 3.4 Sell Property
1. Customer submits a plot they own for resale (plot details + ownership documents + asking price).
2. Submission enters "Pending Admin Review."
3. Admin verifies ownership documents.
4. On approval, the plot is created/updated in the public `plots` inventory and becomes visible to all guests.
5. On rejection, the customer sees the reason and can resubmit.

### 3.5 Buy Property (Token Reservation → Payment → Legal Workflow)
1. Customer selects an available plot and clicks "Reserve."
2. System creates a `reservations` row (status `pending_payment`) and locks the plot against concurrent reservation (DB-level constraint, not just app logic).
3. Customer pays the **token amount only** (not the full price) via an integrated PKR payment gateway (JazzCash/EasyPaisa/QuickPay-style).
4. On a **server-verified webhook** (never a client-reported "success"), the reservation becomes `reserved` and the plot status becomes `reserved`.
5. Customer uploads legal/ownership-transfer documents.
6. Admin (Verification Officer) reviews documents → reservation moves to `under_verification`.
7. Admin (Super Admin / authorized role) gives **final sale confirmation** → plot status becomes `sold`, an `ownership_records` row is created, and the plot now appears under the customer's **"My Property"** tab.
8. If unpaid within the token's expiry window, the reservation auto-expires and the plot returns to `available`.

### 3.6 My Property
- Visible in the customer nav **only** once the customer has at least one confirmed `ownership_records` row.
- Shows: owned plots, ownership documents, payment history, and a status timeline (Reserved → Verification → Confirmed).

### 3.7 Admin Portal
- **Inventory Management** — CRUD phases, plots, pricing, payment plan templates; mark plots Available/On-Hold.
- **Listings Review** — approve/reject customer Sell submissions.
- **KYC/Document Verification** — review CNIC and ownership documents, toggle `rda_verified` / `admin_verified` badges.
- **Reservation & Token Management** — view incoming token payments, manually cancel/release expired reservations.
- **Sale Confirmation** — final authority to move a plot from `under_verification` → `sold`.
- **Payment Oversight** — reconcile gateway transactions, handle refunds.
- **User Management** — view/suspend customer accounts.
- **Audit Log** — immutable log of every admin action (who did what, when, to which record).
- **Reports/Analytics** — inventory breakdown, sales funnel, revenue.

---

## 4. Tech Stack

**Frontend**
- Next.js 14+ (App Router), React 18/19, TypeScript (strict mode).
- Tailwind CSS + shadcn/ui.
- React Query (TanStack Query) for server state; Zustand for local/UI state (filters, map state).
- React Hook Form + Zod for all forms and validation.
- Map: Mapbox GL JS (or Leaflet) with Supercluster for marker clustering; satellite tile layer; custom GeoJSON polygon overlays for phase boundaries.
- Framer Motion for UI transitions.
- Icons: `lucide-react`.

**Backend / Data**
- Supabase: Postgres, Auth, Storage, Row Level Security, Edge Functions.
- Next.js Route Handlers for server-only logic (payment initiation, webhooks, admin mutations).
- `@supabase/ssr` for cookie-based session handling in the App Router.

**Payments**
- A Pakistani payment gateway (JazzCash / EasyPaisa / a QuickPay-style aggregator) via hosted checkout + server-side webhook verification (HMAC/signature check) before any DB state changes.

**Hosting**
- Vercel (frontend + API routes), Supabase Cloud (DB/Auth/Storage).

---

## 5. System Architecture & App Flow

```
Guest ──► Browse Inventory (Map/List) ──► View Plot Details
   │
   ├──► Register/Login ──► Customer
   │        │
   │        ├──► Dashboard / Profile
   │        ├──► Sell Property ──► Admin Review ──► Public Listing
   │        ├──► Buy Property ──► Select Plot ──► Reservation + Token
   │        │        └──► Pay Token (Gateway, PKR) ──► Plot Reserved
   │        │              └──► Submit Legal Docs ──► Admin Verifies
   │        │                    └──► Admin Confirms Sale ──► "My Property"
   │        └──► My Property (nav item appears only after ≥1 confirmed plot)
   │
   └──► Admin Login ──► Admin Portal
            ├──► Inventory Management
            ├──► Listings Review (Sell submissions)
            ├──► KYC / Document Verification
            ├──► Reservation & Token Management
            ├──► Sale Confirmation (final authority)
            ├──► Payment Reconciliation
            ├──► User Management
            └──► Audit Log / Reports
```

### Plot Status State Machine (enforced server-side only)
```
available ──(token payment success, verified webhook)──► reserved
reserved  ──(token unpaid past expires_at)──► available
reserved  ──(docs submitted + admin approves)──► under_verification
under_verification ──(admin confirms sale)──► sold
under_verification ──(admin rejects)──► reserved   (customer can resubmit docs)
```
Never allow the client to set `plots.status` directly. All transitions happen via server-side route handlers or Postgres functions triggered by verified events (webhook, admin action).

---

## 6. Folder & File Structure

```
capital-smart-city-marketplace/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                       # Landing page
│   │   ├── inventory/
│   │   │   ├── page.tsx                   # Map + List inventory (public)
│   │   │   └── [plotId]/page.tsx          # Plot detail (public, read-only)
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
│   │   ├── buy-property/[plotId]/page.tsx # Token reservation + payment
│   │   ├── my-property/page.tsx           # Conditional nav item
│   │   └── notifications/page.tsx
│   ├── (admin)/admin/
│   │   ├── dashboard/page.tsx
│   │   ├── inventory/page.tsx
│   │   ├── listings-review/page.tsx
│   │   ├── kyc-verification/page.tsx
│   │   ├── reservations/page.tsx
│   │   ├── sales-confirmation/page.tsx
│   │   ├── payments/page.tsx
│   │   ├── users/page.tsx
│   │   └── audit-log/page.tsx
│   ├── api/
│   │   ├── payments/initiate/route.ts
│   │   ├── payments/webhook/route.ts
│   │   ├── plots/route.ts
│   │   ├── reservations/route.ts
│   │   └── admin/*/route.ts
│   └── layout.tsx
├── components/
│   ├── map/                # MapView, ClusterMarker, PhasePolygon, FiltersSidebar, PlotDetailSidebar
│   ├── forms/               # RegisterForm, KycUploadForm, SellPropertyForm
│   ├── dashboard/
│   ├── admin/
│   ├── ui/                 # shadcn/ui primitives
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # browser client (anon key)
│   │   ├── server.ts        # server client (service role, server-only)
│   │   └── middleware.ts
│   ├── payments/gateway.ts  # payment provider abstraction
│   ├── validation/          # zod schemas
│   └── utils/
├── types/database.types.ts  # generated from Supabase schema
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── middleware.ts             # route protection (auth/role gating)
├── .env.local.example
└── package.json
```

---

## 7. Database Schema

Run these as Supabase migrations, in order. All tables use `uuid` primary keys via `gen_random_uuid()`.

```sql
-- Enable extension
create extension if not exists "pgcrypto";

-- ========== 1. IDENTITY & ACCESS ==========
create type user_role as enum ('customer', 'verification_officer', 'sales_admin', 'super_admin');
create type kyc_status_enum as enum ('pending', 'verified', 'rejected');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  cnic_number text unique,
  phone text unique not null,
  role user_role not null default 'customer',
  kyc_status kyc_status_enum not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========== 2. INVENTORY ==========
create table phases (
  id uuid primary key default gen_random_uuid(),
  society_id uuid,
  name text not null,
  boundary_geojson jsonb not null,
  town_plan_url text,
  created_at timestamptz not null default now()
);

create type plot_type_enum as enum ('residential', 'commercial');
create type plot_status_enum as enum ('available', 'reserved', 'under_verification', 'sold');

create table plots (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references phases(id),
  plot_number text not null,
  size text not null,
  street text,
  zone text,
  type plot_type_enum not null,
  lump_sum_price numeric(14,2) not null,
  token_amount numeric(14,2) not null,
  status plot_status_enum not null default 'available',
  rda_verified boolean not null default false,
  admin_verified boolean not null default false,
  latitude numeric not null,
  longitude numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_plots_phase on plots(phase_id);
create index idx_plots_status on plots(status);

create table payment_plans (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null references plots(id) on delete cascade,
  plan_type text not null,
  installment_schedule jsonb,
  created_at timestamptz not null default now()
);

create type amenity_type_enum as enum ('mosque', 'park', 'hospital', 'school', 'other');

create table amenities (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid references phases(id),
  type amenity_type_enum not null,
  latitude numeric not null,
  longitude numeric not null,
  label text
);

-- ========== 3. CUSTOMER ENGAGEMENT ==========
create table favorites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  plot_id uuid not null references plots(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_id, plot_id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ========== 4. SELL PROPERTY ==========
create type listing_status_enum as enum ('pending', 'approved', 'rejected');

create table listing_submissions (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid references plots(id),
  submitted_by uuid not null references profiles(id),
  asking_price numeric(14,2) not null,
  status listing_status_enum not null default 'pending',
  reviewed_by uuid references profiles(id),
  review_notes text,
  created_at timestamptz not null default now()
);

-- ========== 5. BUY / RESERVATION & PAYMENTS ==========
create type reservation_status_enum as enum
  ('pending_payment', 'reserved', 'under_verification', 'confirmed', 'cancelled', 'expired');

create table reservations (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null references plots(id),
  customer_id uuid not null references profiles(id),
  token_amount_paid numeric(14,2),
  status reservation_status_enum not null default 'pending_payment',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Prevent double-booking: only one active reservation per plot at a time
create unique index uq_active_reservation_per_plot
  on reservations (plot_id)
  where status in ('reserved', 'under_verification');

create type transaction_status_enum as enum ('initiated', 'success', 'failed', 'refunded');

create table transactions (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations(id),
  gateway_ref text unique,
  amount numeric(14,2) not null,
  currency text not null default 'PKR',
  status transaction_status_enum not null default 'initiated',
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

-- ========== 6. TRUST & LEGAL ==========
create type document_type_enum as enum ('cnic', 'ownership_proof', 'transfer_deed', 'other');
create type document_status_enum as enum ('pending', 'verified', 'rejected');

create table documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id),
  plot_id uuid references plots(id),
  reservation_id uuid references reservations(id),
  type document_type_enum not null,
  file_url text not null,
  status document_status_enum not null default 'pending',
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table ownership_records (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null unique references plots(id),
  reservation_id uuid not null references reservations(id),
  owner_id uuid not null references profiles(id),
  confirmed_by uuid not null references profiles(id),
  confirmed_at timestamptz not null default now()
);

-- ========== 7. ADMIN OVERSIGHT ==========
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
```

### Relationship Summary

| From | Cardinality | To | Meaning |
|---|---|---|---|
| `plots` | N:1 | `phases` | Every plot belongs to exactly one phase |
| `payment_plans` | N:1 | `plots` | A plot may offer several payment plans |
| `listing_submissions` | N:1 | `plots` / `profiles` | A customer submits a plot for resale |
| `reservations` | N:1 | `plots` / `profiles` | A customer reserves one plot at a time |
| `transactions` | N:1 | `reservations` | Each payment attempt ties to one reservation |
| `documents` | N:1 | `profiles` / `plots` | KYC and ownership docs, owned by a user |
| `ownership_records` | 1:1 | `plots` | Exactly one confirmed owner per plot |
| `audit_logs` | N:1 | `profiles` | Every admin action is attributed to an actor |

---

## 8. Row Level Security (RLS) Policies

Enable RLS on every table (`alter table X enable row level security;`). General policy pattern:

- **Public/anon role**: `SELECT` only on `phases`, `plots`, `payment_plans`, `amenities` where the plot/phase is meant to be public. No write access anywhere.
- **Customer role**: full `SELECT`/`INSERT`/`UPDATE` on their **own** rows in `profiles`, `favorites`, `notifications`, `listing_submissions`, `reservations` (insert/select only, no direct status update), `documents`; read-only on `transactions` tied to their own reservations. Enforce via `auth.uid() = customer_id` / `auth.uid() = owner_id` style policies.
- **Admin roles**: elevated policies checked via a `profiles.role` lookup (e.g. `exists (select 1 from profiles where id = auth.uid() and role in ('verification_officer','sales_admin','super_admin'))`) granting write access to inventory, verification, reservation status, `ownership_records`. Prefer routing all admin mutations through **server-side API routes using the Supabase service role** rather than relying solely on RLS for admin writes — RLS is the safety net, server routes are the primary gate.
- **`audit_logs`**: insert-only for admin roles; no `UPDATE`/`DELETE` policy for any role (immutable).
- **`plots.status` transitions**: never allow direct client `UPDATE` of `status`; changes only happen inside server route handlers / Postgres functions using the service role, after verifying payment webhooks or admin actions.

---

## 9. API Routes

| Route | Method | Access | Purpose |
|---|---|---|---|
| `/api/plots` | GET | Public | List/filter plots for inventory map |
| `/api/plots/[id]` | GET | Public | Plot detail |
| `/api/reservations` | POST | Customer | Create a reservation (locks the plot) |
| `/api/payments/initiate` | POST | Customer | Create gateway checkout session for a reservation's token |
| `/api/payments/webhook` | POST | Gateway only (signature-verified) | Confirm payment, transition reservation/plot status |
| `/api/documents` | POST | Customer | Upload KYC/ownership documents |
| `/api/admin/listings-review` | GET/POST | Admin | Approve/reject Sell submissions |
| `/api/admin/kyc-verification` | GET/POST | Admin | Approve/reject documents |
| `/api/admin/reservations` | GET/PATCH | Admin | View/cancel reservations |
| `/api/admin/sales-confirmation` | POST | Super Admin | Final sale confirmation → creates `ownership_records` |
| `/api/admin/inventory` | GET/POST/PATCH | Admin | Manage phases/plots/payment plans |
| `/api/admin/audit-log` | GET | Admin | View audit trail |

All admin routes must check `profiles.role` server-side before executing, in addition to any RLS policy.

---

## 10. Key Workflows

### 10.1 Buy Property (Detailed)
1. `GET /api/plots/[id]` — public plot detail fetch.
2. Customer clicks "Reserve" (must be authenticated) → `POST /api/reservations` → server wraps plot lock + reservation insert in a transaction (or relies on the `uq_active_reservation_per_plot` unique index) to guarantee no double-booking.
3. `POST /api/payments/initiate` → creates a gateway checkout session, returns a redirect URL.
4. Gateway redirects the customer back and **asynchronously calls** `POST /api/payments/webhook`. The webhook handler verifies the gateway's signature/HMAC, then — and only then — updates `transactions.status = success`, `reservations.status = reserved`, `plots.status = reserved`, atomically.
5. Customer uploads legal/ownership documents → `documents` rows, `status = pending`.
6. Admin (Verification Officer) reviews in Admin Portal → approves → `reservations.status = under_verification`.
7. Admin (Super Admin) gives final sale confirmation → `plots.status = sold`, `ownership_records` row created → plot appears in customer's My Property.
8. A scheduled job (Supabase Edge Function / cron) expires reservations past `expires_at` still in `pending_payment`, releasing the plot back to `available`.

### 10.2 Sell Property
1. Customer fills the Sell form (plot details, ownership documents, asking price) → `listing_submissions` row, `status = pending`.
2. Admin reviews documents in Listings Review screen.
3. Approve → plot is created/updated in `plots` and becomes publicly visible; Reject → customer sees `review_notes` and can resubmit.

### 10.3 Admin Sale Confirmation
- Only reachable by `super_admin` (or an explicitly authorized role).
- Requires the reservation to be `under_verification` with all required `documents.status = verified`.
- On confirm: insert into `ownership_records`, set `plots.status = sold`, write an `audit_logs` entry.

---

## 11. Design System

### Color Tokens
| Token | Hex | Usage |
|---|---|---|
| `--primary-navy` | `#0B2A4A` | Headers, primary buttons, key CTAs |
| `--primary-teal` | `#0E7C86` | Filters panel, active states, links |
| `--accent-green` | `#0F7A3D` | Success states, "verified"/available badges |
| `--plot-residential` | `#F5A623` | Residential plot markers/legend |
| `--plot-commercial` | `#2F6FE0` | Commercial plot markers/legend |
| `--status-reserved` | `#E0A800` | Reserved badge |
| `--status-sold` | `#6B7280` | Sold/unavailable badge |
| `--status-verified` | `#0E7C86` | RDA/Admin verified badge |
| `--alert-warning-bg` / `--alert-warning-text` | `#FDECEA` / `#C0392B` | Disclaimer banners |
| `--bg-base` / `--bg-muted` | `#FFFFFF` / `#F5F7FA` | Page/card background, sidebar background |
| `--border` | `#E2E8F0` | Card/input borders |
| `--text-primary` / `--text-secondary` | `#111827` / `#6B7280` | Body text / meta text |

### Typography
- Font: `Inter` (or `Manrope`) — one family, differentiate by weight/size.
- Scale: Display 32–40px/700, H1 28px/700, H2 22px/600, H3 18px/600, Body 15–16px/400, Label 13px/500, Caption 12px/400.
- Use tabular figures for prices and plot sizes.

### Component Guidance
- Buttons: solid navy primary, rounded 8px; teal for secondary/active toggle states.
- Cards (Plot Detail Sidebar): white bg, subtle shadow, status pills top-right.
- Filters Panel: teal-to-navy gradient header, sticky Apply/Reset buttons.
- Badges: pill-shaped, colored per status token above.
- Map controls: floating white rounded-square buttons, consistent 8px spacing.
- Disclaimer banners: always visible inline, never hidden behind tooltips.
- Icon set: `lucide-react` throughout, including amenity icons on the map.

---

## 12. Development Rules

### Use
- Next.js App Router only, TypeScript strict mode, Server Components by default (`"use client"` only where needed).
- Zod validation on every API route input.
- React Hook Form + `zodResolver` for all forms.
- Two Supabase clients: `lib/supabase/client.ts` (anon key, browser) and `lib/supabase/server.ts` (service role, **server-only**).
- React Query for server-state; proper `queryKey` invalidation after mutations.
- Marker clustering (Supercluster) — never render hundreds of raw unclustered DOM markers.
- Conventional Commits.

### Avoid
- Never expose the Supabase service role key to the client.
- Never trust a client-reported "payment successful" — only a verified server-side webhook may change `reservations`/`plots` status.
- Never allow two reservations to lock the same plot — rely on the `uq_active_reservation_per_plot` unique index plus transactional inserts.
- No inline styles — use Tailwind + the design tokens above.
- No `any` types / unexplained `@ts-ignore`.
- No storing plaintext CNIC or card data; never log full CNIC/card data.
- No client-side-only role checks as the sole security control — always back with RLS + server route checks.
- No unbounded map queries — bound plot fetches by viewport/phase filter.
- Don't mix payment gateway SDK calls into client components — route through server API endpoints only.

### Error Handling
- API routes return `{ success, data?, error?: { code, message } }`.
- Validation errors → `400` with field-level messages.
- Auth errors → `401`/`403`, generic messages (never leak whether an email exists).
- Plot-already-reserved conflicts → `409` with a "plot no longer available" message; frontend refetches.
- Client-side: React Query `onError` + toast notifications, never raw stack traces.
- Global error boundaries (`app/error.tsx`, `app/global-error.tsx`).
- Structured server-side logging; never log secrets, tokens, or full document contents.

---

## 13. Build Phases

1. **Phase 0 — Foundation**: Next.js + Supabase setup, run all migrations from Section 7, design tokens wired into Tailwind.
2. **Phase 1 — Public Inventory**: Landing page, Map View with clustering, Town Plan toggle, Filters, Plot Detail Sidebar, List View — all public, no auth.
3. **Phase 2 — Authentication**: Customer + Admin login/register, `middleware.ts` route protection, roles.
4. **Phase 3 — Customer Dashboard & Profile**: Dashboard, Profile, Notifications.
5. **Phase 4 — Sell Property**: Submission form → admin review queue → public listing on approval.
6. **Phase 5 — Buy Property**: Reservation creation, payment gateway integration, verified webhook handling, reservation expiry job.
7. **Phase 6 — Legal Workflow & Verification**: Document upload, Admin KYC/Listings Review screens, audit logging.
8. **Phase 7 — Sale Confirmation & My Property**: Final admin confirmation action, `ownership_records`, My Property tab.
9. **Phase 8 — Admin Portal Completion**: Inventory CRUD, payment reconciliation, user management, analytics, full audit log viewer.
10. **Phase 9 — Hardening & Launch**: RLS audit, load testing on map/inventory, responsive QA, legal copy review, production deploy + monitoring.

Build strictly in this order — each phase depends on the data model and auth from the ones before it.

---

## 14. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-only, never expose to client
NEXT_PUBLIC_MAPBOX_TOKEN=           # or equivalent map provider key
PAYMENT_GATEWAY_MERCHANT_ID=
PAYMENT_GATEWAY_SECRET=             # server-only, used to verify webhooks
PAYMENT_GATEWAY_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
```

---

## 15. Out of Scope (Future Work)

- Vendor management for construction & bidding system (to be specified in a future addendum).
- Multi-society/multi-tenant white-labeling (schema has a placeholder `phases.society_id` for this).
- Native mobile apps (web-responsive only for MVP).
