import "server-only";

import { randomUUID } from "crypto";
import { seedPlots } from "@backend/data/seed";
import type {
  DocumentStatus,
  DocumentType,
  ListingStatus,
  PlotStatus,
  ReservationStatus,
  TransactionStatus,
  UserRole,
} from "@shared/types/database.types";

export interface DemoUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  phone: string;
  cnic_number: string | null;
  role: UserRole;
  kyc_status: "pending" | "verified" | "rejected";
  suspended: boolean;
  /** ISO timestamp; customer cannot start new reservations until then */
  reservation_banned_until: string | null;
  created_at: string;
}

export interface DemoReservation {
  id: string;
  plot_id: string;
  customer_id: string;
  token_amount_paid: number | null;
  status: ReservationStatus;
  expires_at: string;
  created_at: string;
  /** True after customer used the same-day unpaid extension */
  extension_used: boolean;
  /** Set when first unpaid window ends; customer may extend once */
  extension_eligible: boolean;
  /** When customer submitted all required docs for admin review */
  verification_submitted_at: string | null;
}

export const RESERVATION_WINDOW_MS = 2 * 60 * 60 * 1000;
export const RESERVATION_BAN_MS = 24 * 60 * 60 * 1000;

export const REQUIRED_VERIFICATION_DOCS = [
  "payment_receipt",
  "cnic_front",
  "cnic_back",
  "passport_photo",
  "agreement_to_sell",
] as const;

export function karachiDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isUserReservationBanned(user: DemoUser): boolean {
  if (!user.reservation_banned_until) return false;
  return new Date(user.reservation_banned_until).getTime() > Date.now();
}

export interface DemoTransaction {
  id: string;
  reservation_id: string;
  gateway_ref: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  psid: string | null;
  /** ISO — PSID invalid for payment after this (2h from voucher generation) */
  psid_expires_at: string | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
}

export interface DemoListing {
  id: string;
  plot_id: string | null;
  submitted_by: string;
  asking_price: number;
  plot_number: string;
  size: string;
  phase_name: string;
  type: "residential" | "commercial";
  status: ListingStatus;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
}

export interface DemoDocument {
  id: string;
  owner_id: string;
  plot_id: string | null;
  reservation_id: string | null;
  type: DocumentType;
  file_url: string;
  file_name: string;
  status: DocumentStatus;
  verified_by: string | null;
  verified_at: string | null;
  viewed_by: string | null;
  viewed_at: string | null;
  created_at: string;
}

export interface DemoOwnership {
  id: string;
  plot_id: string;
  reservation_id: string;
  owner_id: string;
  confirmed_by: string;
  confirmed_at: string;
}

export interface DemoNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface DemoAuditLog {
  id: string;
  actor_id: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface DemoFavorite {
  id: string;
  customer_id: string;
  plot_id: string;
  created_at: string;
}

interface DemoStore {
  users: DemoUser[];
  sessions: Map<string, string>;
  plotStatuses: Map<string, PlotStatus>;
  /** Token payment completed for plot (active buy pipeline) */
  paymentVerified: Map<string, boolean>;
  /** Latest PSID per plot */
  plotPsids: Map<string, string>;
  reservations: DemoReservation[];
  transactions: DemoTransaction[];
  listings: DemoListing[];
  documents: DemoDocument[];
  ownership: DemoOwnership[];
  notifications: DemoNotification[];
  auditLogs: DemoAuditLog[];
  favorites: DemoFavorite[];
}

declare global {
  // eslint-disable-next-line no-var
  var __cscDemoStore: DemoStore | undefined;
}

function createStore(): DemoStore {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: "demo-customer-001",
        email: "customer@csc.demo",
        password: "demo1234",
        full_name: "Ahmed Khan",
        phone: "03001234567",
        cnic_number: null,
        role: "customer",
        kyc_status: "pending",
        suspended: false,
        reservation_banned_until: null,
        created_at: now,
      },
      {
        id: "demo-officer-001",
        email: "officer@csc.demo",
        password: "demo1234",
        full_name: "Sara Verification",
        phone: "03007654321",
        cnic_number: null,
        role: "verification_officer",
        kyc_status: "verified",
        suspended: false,
        reservation_banned_until: null,
        created_at: now,
      },
      {
        id: "demo-sales-001",
        email: "sales@csc.demo",
        password: "demo1234",
        full_name: "Bilal Finance",
        phone: "03009876543",
        cnic_number: null,
        role: "sales_admin",
        kyc_status: "verified",
        suspended: false,
        reservation_banned_until: null,
        created_at: now,
      },
      {
        id: "demo-super-001",
        email: "admin@csc.demo",
        password: "demo1234",
        full_name: "Super Admin",
        phone: "03001112233",
        cnic_number: null,
        role: "super_admin",
        kyc_status: "verified",
        suspended: false,
        reservation_banned_until: null,
        created_at: now,
      },
    ],
    sessions: new Map(),
    plotStatuses: new Map(
      seedPlots.map((p) => [p.id, p.status] as [string, PlotStatus]),
    ),
    paymentVerified: new Map(),
    plotPsids: new Map(),
    reservations: [],
    transactions: [],
    listings: [],
    documents: [],
    ownership: [],
    notifications: [],
    auditLogs: [],
    favorites: [],
  };
}

export function getDemoStore(): DemoStore {
  if (!globalThis.__cscDemoStore) {
    globalThis.__cscDemoStore = createStore();
  }
  return globalThis.__cscDemoStore;
}

export function getPlotStatus(plotId: string): PlotStatus {
  const store = getDemoStore();
  return store.plotStatuses.get(plotId) ?? "available";
}

export function setPlotStatus(plotId: string, status: PlotStatus) {
  getDemoStore().plotStatuses.set(plotId, status);
  if (status === "available") {
    getDemoStore().paymentVerified.set(plotId, false);
    getDemoStore().plotPsids.delete(plotId);
  }
}

export function isPaymentVerified(plotId: string): boolean {
  return getDemoStore().paymentVerified.get(plotId) === true;
}

export function setPaymentVerified(plotId: string, verified: boolean) {
  getDemoStore().paymentVerified.set(plotId, verified);
}

export function getPlotPsid(plotId: string): string | null {
  return getDemoStore().plotPsids.get(plotId) ?? null;
}

export function setPlotPsid(plotId: string, psid: string | null) {
  const store = getDemoStore();
  if (psid) store.plotPsids.set(plotId, psid);
  else store.plotPsids.delete(plotId);
}

export function findUserByEmail(email: string) {
  return getDemoStore().users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
}

export function findUserById(id: string) {
  return getDemoStore().users.find((u) => u.id === id);
}

export function banUserReservations(userId: string, ms = RESERVATION_BAN_MS) {
  const user = findUserById(userId);
  if (!user) return;
  user.reservation_banned_until = new Date(Date.now() + ms).toISOString();
}

export function createSession(userId: string): string {
  const token = randomUUID();
  getDemoStore().sessions.set(token, userId);
  return token;
}

export function destroySession(token: string) {
  getDemoStore().sessions.delete(token);
}

export function userFromSession(token: string | undefined) {
  if (!token) return null;
  const userId = getDemoStore().sessions.get(token);
  if (!userId) return null;
  return findUserById(userId) ?? null;
}

export function publicUser(user: DemoUser) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    phone: user.phone,
    cnic_number: user.cnic_number,
    role: user.role,
    kyc_status: user.kyc_status,
    suspended: user.suspended,
    reservation_banned_until: user.reservation_banned_until,
    created_at: user.created_at,
  };
}

export function addNotification(
  userId: string,
  title: string,
  message: string,
) {
  getDemoStore().notifications.unshift({
    id: randomUUID(),
    user_id: userId,
    title,
    message,
    read: false,
    created_at: new Date().toISOString(),
  });
}

export function addAudit(
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  metadata: Record<string, unknown> | null = null,
) {
  getDemoStore().auditLogs.unshift({
    id: randomUUID(),
    actor_id: actorId,
    action,
    entity,
    entity_id: entityId,
    metadata,
    created_at: new Date().toISOString(),
  });
}

function releasePlotIfIdle(plotId: string, exceptReservationId: string) {
  const store = getDemoStore();
  const active = store.reservations.some(
    (r) =>
      r.plot_id === plotId &&
      r.id !== exceptReservationId &&
      ["pending_payment", "reserved", "under_verification"].includes(r.status),
  );
  if (!active) {
    setPlotStatus(plotId, "available");
  }
}

export function expirePendingReservations() {
  const store = getDemoStore();
  const now = Date.now();
  for (const reservation of store.reservations) {
    if (
      reservation.status === "pending_payment" &&
      new Date(reservation.expires_at).getTime() < now
    ) {
      reservation.status = "expired";
      releasePlotIfIdle(reservation.plot_id, reservation.id);

      if (reservation.extension_used) {
        reservation.extension_eligible = false;
        banUserReservations(reservation.customer_id);
        addNotification(
          reservation.customer_id,
          "Reservation expired — 24h restriction",
          "Your extended payment window ended unpaid. You cannot reserve any plot for 24 hours.",
        );
      } else {
        reservation.extension_eligible = true;
        addNotification(
          reservation.customer_id,
          "Payment window expired",
          "Will you pay in the next 2 hours and keep this reservation? This is your last extension for today.",
        );
      }
    }
  }
}

export function getActivePendingExpiry(plotId: string): string | null {
  expirePendingReservations();
  const reservation = getDemoStore().reservations.find(
    (r) => r.plot_id === plotId && r.status === "pending_payment",
  );
  return reservation?.expires_at ?? null;
}
