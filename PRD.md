# PRD.md — Capital Smart City Marketplace

## 1. Project Overview

A comprehensive real-estate marketplace web platform for **Capital Smart City Islamabad**, modeled on the DHA Marketplace pattern. The platform lets the society showcase its full plot inventory on an interactive map, lets customers browse, reserve (token), and buy plots online with a legalized digital reservation-to-ownership workflow, and gives the society's own staff an Admin Portal to verify documents, confirm sales, and manage inventory.

The platform is a **two-sided marketplace**:
- **Public / Customer side** — browse inventory, register, manage profile, sell property, buy property, track "My Property."
- **Admin side** — verify listings/documents, manage inventory, confirm/reject reservations, finalize ownership transfer.

---

## 2. What to Build

### 2.1 Public (No Login Required)
- Landing page with company branding, banners/announcements (e.g. independence day banner style).
- **Live Plot Inventory** — always public, real-time list of plots marked for sale.
- **Interactive Map View** — satellite map with phase boundaries (dashed polygons), clustered plot markers per phase (e.g. "Phase 1", "Phase RVS"), cluster counts shown as bubble numbers.
- **Town Plan view** — toggle between Map View and static Town Plan document/image.
- **Filters sidebar** — Select Event/Category, Price Range (min/max slider + apply), Plot Type (Residential/Commercial checkboxes), DHA/Society Phase, Amenities toggle layer (mosque, park, hospital, school icons).
- **Plot detail sidebar** — on marker click: Plot #, status (Residential/Unsold/Sold/Reserved), Size, Phase/Sector, Street, Zone, Lump Sum Price, Token Amount, Payment Plan options (Lump Sum, 1 Year Plan, etc.), disclaimer text (e.g. "Prices are exclusive of Chargex & Govt Taxes"), and an **"RDA Verified"** badge + "Documents Verified by Admin" badge where applicable.
- Login / Register entry points (modal or dedicated pages).

### 2.2 Customer (Authenticated)
- **Register/Login** — email/phone + password, OTP verification, optional CNIC verification for KYC.
- **Customer Dashboard** — overview: active reservations, saved/favorited plots, notifications, recent activity.
- **Profile** — personal info, CNIC upload, contact details, address, KYC status.
- **Buy Property flow**:
  1. Select an available plot from inventory/map.
  2. System generates a **reservation token** (not full payment) with token amount shown per plot.
  3. Customer pays token amount via integrated payment gateway (e.g. JazzCash/EasyPaisa/QuickPay-style rails, PKR).
  4. On successful payment, plot status becomes **"Reserved"** (locked from other buyers), reservation record created.
  5. Legal ownership workflow proceeds within the platform (document submission, transfer request) — final confirmation is always performed by the **Society's Admin Portal**, not automatically.
  6. Customer can track reservation status: Pending Payment → Reserved → Under Verification → Confirmed/Rejected → Owned.
- **Sell Property flow**:
  1. Customer submits a plot they own for resale (plot details, ownership docs, asking price).
  2. Submission enters "Pending Admin Review" queue.
  3. Admin verifies documents/ownership before listing goes live on public inventory.
- **My Property tab** — visible only once a user has purchased/owns a plot. Shows owned plots, ownership documents, payment history, transfer/legal status timeline.
- **Payment history & invoices** — token payments, installment plan status if applicable.
- **Notifications** — reservation status changes, payment reminders, admin messages.

### 2.3 Admin (Society / Marketplace Admin Portal)
- **Admin Login** (separate, role-based access — Super Admin, Verification Officer, Sales/Finance Admin).
- **Inventory Management** — add/edit/remove plots, phases, pricing, payment plan templates, mark plots Available/Reserved/Sold/On-Hold.
- **Listing Verification** — review customer-submitted "Sell Property" listings, verify ownership documents, approve/reject before they go public.
- **Document Verification (KYC & Ownership)** — review uploaded CNIC/ownership docs, mark RDA-verification status, attach "Verified" badges.
- **Reservation/Token Management** — view incoming token payments, confirm reservations, release/cancel expired/unpaid tokens.
- **Sale Confirmation** — final authority to confirm a plot sale and move it from Reserved → Sold/Owned; triggers ownership transfer workflow.
- **Payment & Transaction Oversight** — reconciliation of gateway payments, refunds, installment tracking.
- **User Management** — view/manage customer accounts, suspend/flag accounts.
- **Audit Log** — track all admin actions for accountability/legal traceability.
- **Reports/Analytics** — inventory status breakdown, sales funnel, revenue.

---

## 3. Target Users

| User Type | Description |
|---|---|
| **Guest / Visitor** | Browses inventory & map without logging in. |
| **Customer (Buyer)** | Registered user who reserves/buys a plot via token + payment gateway. |
| **Customer (Seller)** | Registered plot owner who lists their existing plot for resale. |
| **Verification Officer (Admin)** | Reviews and verifies documents, KYC, and ownership records. |
| **Sales/Finance Admin** | Manages payments, tokens, reservation confirmations. |
| **Super Admin** | Full platform control — inventory, users, admins, final sale confirmation, legal sign-off. |

---

## 4. Key Features Summary

1. Public live plot inventory (map + list view), no login required.
2. Interactive map with phase clustering, plot markers, amenities layer, filters.
3. Plot detail sidebar with full pricing/payment-plan breakdown and verification badges.
4. Customer & Admin authentication (separate portals/roles).
5. Customer Dashboard, Profile, My Property (conditional visibility).
6. Buy Property → token reservation → gateway payment (PKR) → admin-confirmed legal ownership workflow.
7. Sell Property submission → admin document verification → public listing.
8. Admin Portal for inventory, verification, reservation, and sale confirmation.
9. RDA verification & Admin-document-verified trust badges on listings.
10. Secure, auditable, legally-traceable transaction trail end-to-end within the website, with final legal sign-off resting with the society's admin.

---

## 5. Non-Functional Requirements

- **Security**: Role-based access control (RBAC), encrypted storage of CNIC/ownership documents, secure payment handling (no card data stored on our servers — use gateway tokenization), HTTPS everywhere, audit logging.
- **Performance**: Map with hundreds of plots must load/cluster efficiently (marker clustering, lazy loading).
- **Scalability**: Multi-phase, multi-society-ready data model (so architecture can extend beyond Capital Smart City later).
- **Reliability**: Payment/reservation flow must be transactional — no double-reservation of the same plot (concurrency-safe).
- **Compliance**: Legal disclaimers, tax/chargex exclusions clearly stated, KYC/AML-style document checks before finalizing ownership.
- **Accessibility & Responsiveness**: Fully responsive (desktop, tablet, mobile).

---

## 6. Out of Scope (For Now — Future Phases)

- Vendor management for construction & their bidding system (to be specified later).
- Multi-society/multi-tenant white-labeling.
- Mobile native apps (web-responsive only for MVP).

---

## 7. Success Metrics

- % of plots with completed RDA/document verification.
- Time from token reservation → admin sale confirmation.
- Conversion rate: inventory view → token reservation.
- Number of successfully completed legal-ownership workflows end-to-end.
- Admin verification turnaround time.
