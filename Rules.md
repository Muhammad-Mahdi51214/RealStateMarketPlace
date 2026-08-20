# Rules.md — Development Rules & Conventions

## 1. What to Use

- **Next.js App Router** exclusively — no Pages Router mixing.
- **TypeScript strict mode** everywhere; no implicit `any`.
- **Server Components by default**; use `"use client"` only where interactivity is required (map, forms, dashboards).
- **Zod** for all input validation — every API route validates its payload with a Zod schema before touching the DB.
- **React Hook Form** for all forms, paired with `zodResolver`.
- **Supabase client separation**:
  - `lib/supabase/client.ts` — anon key, browser-safe, used for public reads.
  - `lib/supabase/server.ts` — service role key, **server-only**, used for admin mutations/webhooks.
- **shadcn/ui + Tailwind** for all UI components — keep a consistent design token setup (see Design.md).
- **React Query** for all server-state fetching/caching (plots, reservations, dashboard data) with proper `queryKey` invalidation after mutations.
- **Marker clustering library** (Supercluster or Mapbox's built-in clustering) for map performance — never render hundreds of raw DOM markers unclustered.
- **Environment variables** via `.env.local`, typed access through a single `env.ts` validator (e.g. `t3-env` or a Zod-validated env module).
- **Conventional Commits** for git history (`feat:`, `fix:`, `chore:`, etc.).

## 2. What to Avoid

- ❌ Never expose the Supabase **service role key** to the client/browser bundle.
- ❌ Never trust client-submitted "payment successful" state — plot/reservation status changes **only** happen via verified server-side webhook handlers.
- ❌ Never allow two reservations to lock the same plot — always use a DB transaction / row lock (`SELECT ... FOR UPDATE`) or a unique partial index (`WHERE status = 'reserved'`) when creating a reservation.
- ❌ No inline styles or ad-hoc CSS — use Tailwind + the shared design tokens.
- ❌ No `any` types, no `@ts-ignore` without a linked explanation comment.
- ❌ No storing plaintext CNIC numbers or card data — encrypt/redact sensitive PII at rest where possible, and never log full CNIC/card data.
- ❌ No client-side-only role checks (e.g. hiding an admin button) as the sole security control — always re-enforce via RLS + server route checks.
- ❌ No unbounded map queries — always paginate/bound plot fetches by viewport or phase filter.
- ❌ Avoid deprecated Supabase v1 client patterns (`supabase-js` v1 methods) — use the current `@supabase/ssr` package for Next.js App Router auth/session handling.
- ❌ Don't mix payment gateway SDK calls directly in client components — route through server API endpoints only.

## 3. Error Handling Standards

- **API routes**: always return a consistent shape:
  ```ts
  { success: boolean; data?: T; error?: { code: string; message: string } }
  ```
- **Validation errors** (Zod) → `400` with field-level messages.
- **Auth errors** → `401`/`403` with generic messages (never leak whether an email exists).
- **Payment webhook failures** → log to `audit_logs`/error table, return `200` only after successful processing to avoid gateway retries masking real failures (follow the specific gateway's retry contract).
- **Concurrency conflicts** (e.g. plot already reserved) → `409 Conflict` with a clear "plot no longer available" message; frontend should refetch plot status.
- **Client-side**: use React Query's `onError` + toast notifications (shadcn `use-toast`) — never show raw stack traces to users.
- **Global error boundary** (`app/error.tsx`, `app/global-error.tsx`) for uncaught render errors.
- **Logging**: structured server-side logging (e.g. pino) for API routes and Edge Functions; never log secrets, tokens, or full document contents.

## 4. Library-Specific Notes

- **Mapbox/Leaflet**: guard against SSR issues — map components must be dynamically imported with `ssr: false`.
- **Supabase Auth**: use `@supabase/ssr` cookie-based session handling for App Router; refresh sessions in `middleware.ts`.
- **File uploads**: validate file type/size client- and server-side before upload to Supabase Storage; generate signed URLs with short expiry for viewing sensitive docs.
- **Payment gateway SDK**: keep all credentials server-side; use idempotency keys on payment initiation to avoid duplicate charges on retry.

## 5. Code Style

- Component files: PascalCase (`PlotDetailSidebar.tsx`).
- Hooks: camelCase prefixed `use` (`usePlotReservation.ts`).
- API route folders: kebab-case matching REST resource names.
- Co-locate Zod schemas with their form/route in a `schema.ts` file when feature-specific; shared schemas go in `lib/validation/`.
- Prefer composition over prop-drilling — use context only for cross-cutting concerns (auth session, filters state).

## 6. Git & Review Workflow

- Feature branches off `main`: `feat/buy-property-flow`, `fix/map-cluster-bug`.
- No direct commits to `main` — PR required, at minimum a self-review checklist covering: RLS policy present, input validated, no secrets committed, error states handled.
- Every PR touching payment/reservation logic must include a note on how double-booking/race conditions are prevented.
