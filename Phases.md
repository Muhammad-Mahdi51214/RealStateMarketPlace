# Phases.md — Project Build Phases

## Phase 0 — Foundation & Setup
- Initialize Next.js (App Router, TypeScript, Tailwind, shadcn/ui).
- Set up Supabase project: Auth, Postgres, Storage buckets, RLS baseline.
- Define database schema & run initial migrations (`profiles`, `phases`, `plots`, `reservations`, `transactions`, `documents`, `audit_logs`).
- Set up environment config, CI basics, folder structure per Architecture.md.
- Design tokens/theme wired into Tailwind config (per Design.md).

**Deliverable:** Empty but running app, connected to Supabase, deployed to a staging URL.

---

## Phase 1 — Public Inventory (No Auth)
- Landing page with branding/banner.
- Map View: satellite base map, phase boundary polygons, clustered plot markers.
- Town Plan toggle view.
- Filters sidebar: price range, plot type, phase, amenities layer.
- Plot Detail Sidebar (read-only): plot info, price, payment plan display, RDA/Admin-verified badges.
- List View alternative to map.

**Deliverable:** Fully browsable public inventory identical in spirit to the DHA Marketplace reference, no login required.

---

## Phase 2 — Authentication
- Customer Register/Login (email/phone + OTP).
- Admin Login (separate route, role-gated).
- Session handling via `@supabase/ssr` + `middleware.ts` route protection.
- Role table/claims (customer, admin, super_admin, verification_officer, sales_admin).

**Deliverable:** Working auth for both customer and admin sides, protected routes redirect correctly.

---

## Phase 3 — Customer Dashboard & Profile
- Customer Dashboard: reservations summary, notifications, saved plots.
- Profile page: personal info, CNIC upload, KYC status display.
- Notifications system (basic in-app list; email optional).

**Deliverable:** Logged-in customers have a functional home base.

---

## Phase 4 — Sell Property Flow
- "Sell Property" submission form (plot details + ownership document upload).
- Submission enters admin review queue with status tracking visible to the customer.
- Customer-facing status: Pending Review → Approved (Listed) / Rejected (with reason).

**Deliverable:** Customers can submit a plot for resale; nothing goes public without admin approval.

---

## Phase 5 — Buy Property: Token Reservation + Payment Gateway
- "Reserve Plot" action from plot detail (auth required).
- Token amount calculation & display, reservation record creation with row-locking to prevent double booking.
- Payment gateway integration (PKR, QuickPay-style/JazzCash/EasyPaisa) — checkout initiation + secure server-side webhook confirmation.
- On confirmed payment: plot status → Reserved, reservation dashboard updated in real time.
- Reservation expiry handling (auto-release if unpaid within a time window).

**Deliverable:** End-to-end token reservation and payment works reliably and safely (no race conditions, verified server-side).

---

## Phase 6 — Legal Workflow & Admin Verification
- Post-reservation legal document submission by customer (ownership transfer forms, ID proofs).
- Admin Portal: Document/KYC Verification screen, Listings Review screen.
- Admin Portal: Reservation management (view, approve docs, request resubmission).
- Audit log entries for every verification action.

**Deliverable:** Admins can review and progress reservations through the verification pipeline.

---

## Phase 7 — Sale Confirmation & My Property
- Admin Portal: final Sale Confirmation action (Super Admin authority) — moves plot to Sold/Owned.
- Customer side: "My Property" tab appears once a plot is confirmed owned; shows documents, payment history, timeline.
- Ownership record finalized and locked (immutable audit trail).

**Deliverable:** Full reservation-to-ownership lifecycle closed, matching the "final call by respective admin portal" requirement.

---

## Phase 8 — Admin Portal Completion & Oversight
- Inventory Management (CRUD plots/phases/pricing/payment plans).
- Payment reconciliation & transaction reports.
- User management (view/suspend accounts).
- Analytics dashboard (sales funnel, inventory status breakdown).
- Full Audit Log viewer.

**Deliverable:** Admins have complete operational control of the marketplace.

---

## Phase 9 — Hardening, Testing & Launch
- Security review: RLS policy audit, penetration-style checks on payment/auth flows.
- Load testing on map/inventory endpoints.
- Cross-device responsive QA.
- Legal/compliance copy review (disclaimers, tax exclusions, verification language).
- Production deployment (Vercel + Supabase production project), monitoring/error tracking wired in.

**Deliverable:** Production-ready launch.

---

## Future Phase (Not in Current Scope)
- **Vendor Management Module** — construction vendor onboarding, project bidding system, contract tracking. *(Specification to be provided later — will get its own PRD addendum.)*
