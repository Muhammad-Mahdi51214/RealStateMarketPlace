import "server-only";

import { randomUUID } from "crypto";
import type {
  HireRequestStatus,
  MaterialCategory,
  MaterialOrderStatus,
  MaterialSellerType,
  VendorMemberRole,
  VendorProjectStatus,
  VendorStatus,
  VendorTaskStatus,
} from "@shared/types/database.types";
import {
  addNotification,
  findUserByEmail,
  findUserById,
  getDemoStore,
  type DemoUser,
} from "@backend/demo/store";

export interface DemoVendor {
  id: string;
  name: string;
  logo_url: string | null;
  bio: string;
  service_areas: string[];
  years_experience: number;
  status: VendorStatus;
  owner_profile_id: string;
  houses_completed: number;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface DemoVendorMember {
  id: string;
  vendor_id: string;
  profile_id: string;
  role: VendorMemberRole;
  active: boolean;
  created_at: string;
}

export interface DemoHireRequest {
  id: string;
  customer_id: string;
  vendor_id: string;
  ownership_id: string | null;
  plot_id: string | null;
  message: string;
  budget_note: string | null;
  status: HireRequestStatus;
  created_at: string;
  updated_at: string;
}

export interface DemoVendorProject {
  id: string;
  hire_request_id: string | null;
  vendor_id: string;
  customer_id: string;
  ownership_id: string | null;
  plot_id: string | null;
  title: string;
  notes: string;
  status: VendorProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface DemoVendorReview {
  id: string;
  project_id: string;
  vendor_id: string;
  customer_id: string;
  stars: number;
  remarks: string;
  created_at: string;
}

export interface DemoVendorTask {
  id: string;
  project_id: string;
  assignee_member_id: string | null;
  title: string;
  due_at: string | null;
  status: VendorTaskStatus;
  created_at: string;
  updated_at: string;
}

export interface DemoMaterialCatalogItem {
  id: string;
  sku: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  unit_price: number;
  stock: number;
  seller_type: MaterialSellerType;
  vendor_id: string | null;
  active: boolean;
  created_at: string;
}

export interface DemoMaterialOrderItem {
  catalog_id: string;
  name: string;
  qty: number;
  unit_price: number;
}

export interface DemoMaterialOrder {
  id: string;
  customer_id: string;
  status: MaterialOrderStatus;
  total_amount: number;
  items: DemoMaterialOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface DemoProjectMaterialLog {
  id: string;
  project_id: string;
  catalog_id: string | null;
  name: string;
  qty: number;
  unit: string;
  cost: number;
  noted_by_member_id: string | null;
  created_at: string;
}

export interface VendorDemoSlice {
  vendors: DemoVendor[];
  vendorMembers: DemoVendorMember[];
  hireRequests: DemoHireRequest[];
  vendorProjects: DemoVendorProject[];
  vendorReviews: DemoVendorReview[];
  vendorTasks: DemoVendorTask[];
  materialCatalog: DemoMaterialCatalogItem[];
  materialOrders: DemoMaterialOrder[];
  projectMaterialLogs: DemoProjectMaterialLog[];
  vendorSeeded: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __cscVendorStore: VendorDemoSlice | undefined;
}

function createVendorSlice(): VendorDemoSlice {
  return {
    vendors: [],
    vendorMembers: [],
    hireRequests: [],
    vendorProjects: [],
    vendorReviews: [],
    vendorTasks: [],
    materialCatalog: [],
    materialOrders: [],
    projectMaterialLogs: [],
    vendorSeeded: false,
  };
}

export function getVendorStore(): VendorDemoSlice {
  if (!globalThis.__cscVendorStore) {
    globalThis.__cscVendorStore = createVendorSlice();
  }
  ensureVendorSeed();
  return globalThis.__cscVendorStore;
}

function ensureVendorSeed() {
  const slice = globalThis.__cscVendorStore!;
  if (slice.vendorSeeded) return;

  const now = new Date().toISOString();
  const users = getDemoStore().users;

  let owner = findUserByEmail("vendor@csc.demo");
  if (!owner) {
    owner = {
      id: "demo-vendor-owner-001",
      email: "vendor@csc.demo",
      password: "demo1234",
      full_name: "BuildRight Constructions",
      phone: "03005551234",
      cnic_number: null,
      role: "vendor",
      kyc_status: "verified",
      suspended: false,
      reservation_banned_until: null,
      created_at: now,
    };
    users.push(owner);
  }

  let employee = findUserByEmail("worker@csc.demo");
  if (!employee) {
    employee = {
      id: "demo-vendor-worker-001",
      email: "worker@csc.demo",
      password: "demo1234",
      full_name: "Imran Worker",
      phone: "03005555678",
      cnic_number: null,
      role: "vendor_employee",
      kyc_status: "verified",
      suspended: false,
      reservation_banned_until: null,
      created_at: now,
    };
    users.push(employee);
  }

  const vendorId = "demo-vendor-001";
  if (!slice.vendors.some((v) => v.id === vendorId)) {
    slice.vendors.push({
      id: vendorId,
      name: "BuildRight Constructions",
      logo_url: null,
      bio: "Full-service home builders for Capital Smart City plots. Foundations to finishing.",
      service_areas: ["Executive Block", "Overseas Block", "Residential Enclave"],
      years_experience: 12,
      status: "approved",
      owner_profile_id: owner.id,
      houses_completed: 28,
      rating_avg: 4.6,
      rating_count: 19,
      created_at: now,
      updated_at: now,
    });
  }

  if (!slice.vendors.some((v) => v.id === "demo-vendor-002")) {
    slice.vendors.push({
      id: "demo-vendor-002",
      name: "Skyline Homes PK",
      logo_url: null,
      bio: "Modern villas and grey-structure specialists with transparent material tracking.",
      service_areas: ["General Block", "Commercial Avenue"],
      years_experience: 8,
      status: "approved",
      owner_profile_id: owner.id,
      houses_completed: 14,
      rating_avg: 4.2,
      rating_count: 9,
      created_at: now,
      updated_at: now,
    });
  }

  const ownerMemberId = "demo-vendor-member-owner";
  if (!slice.vendorMembers.some((m) => m.id === ownerMemberId)) {
    slice.vendorMembers.push({
      id: ownerMemberId,
      vendor_id: vendorId,
      profile_id: owner.id,
      role: "owner",
      active: true,
      created_at: now,
    });
  }

  const workerMemberId = "demo-vendor-member-worker";
  if (!slice.vendorMembers.some((m) => m.id === workerMemberId)) {
    slice.vendorMembers.push({
      id: workerMemberId,
      vendor_id: vendorId,
      profile_id: employee.id,
      role: "worker",
      active: true,
      created_at: now,
    });
  }

  if (slice.materialCatalog.length === 0) {
    slice.materialCatalog.push(
      {
        id: "mat-cement-001",
        sku: "CEM-DG-50",
        name: "DG Cement 50kg",
        category: "cement",
        unit: "bag",
        unit_price: 1450,
        stock: 500,
        seller_type: "platform",
        vendor_id: null,
        active: true,
        created_at: now,
      },
      {
        id: "mat-brick-001",
        sku: "BRK-A-GRADE",
        name: "A-Grade Bricks",
        category: "bricks",
        unit: "1000 pcs",
        unit_price: 18500,
        stock: 80,
        seller_type: "platform",
        vendor_id: null,
        active: true,
        created_at: now,
      },
      {
        id: "mat-steel-001",
        sku: "STL-12MM",
        name: "Steel Rebar 12mm",
        category: "steel",
        unit: "ton",
        unit_price: 265000,
        stock: 40,
        seller_type: "platform",
        vendor_id: null,
        active: true,
        created_at: now,
      },
      {
        id: "mat-sand-001",
        sku: "SND-RIVER",
        name: "River Sand",
        category: "other",
        unit: "trolley",
        unit_price: 12000,
        stock: 60,
        seller_type: "vendor",
        vendor_id: vendorId,
        active: true,
        created_at: now,
      },
    );
  }

  slice.vendorSeeded = true;
}

export function getVendorForUser(user: DemoUser): DemoVendor | null {
  const store = getVendorStore();
  const member = store.vendorMembers.find(
    (m) => m.profile_id === user.id && m.active,
  );
  if (!member) {
    return (
      store.vendors.find(
        (v) => v.owner_profile_id === user.id && v.status !== "suspended",
      ) ?? null
    );
  }
  return store.vendors.find((v) => v.id === member.vendor_id) ?? null;
}

export function getMemberForUser(user: DemoUser): DemoVendorMember | null {
  const store = getVendorStore();
  return (
    store.vendorMembers.find((m) => m.profile_id === user.id && m.active) ??
    null
  );
}

export function recomputeVendorRating(vendorId: string) {
  const store = getVendorStore();
  const vendor = store.vendors.find((v) => v.id === vendorId);
  if (!vendor) return;
  const reviews = store.vendorReviews.filter((r) => r.vendor_id === vendorId);
  vendor.rating_count = reviews.length;
  vendor.rating_avg =
    reviews.length === 0
      ? 0
      : Math.round(
          (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length) * 100,
        ) / 100;
  vendor.updated_at = new Date().toISOString();
}

export function registerVendorOrg(input: {
  owner: DemoUser;
  name: string;
  bio: string;
  service_areas: string[];
  years_experience: number;
}): DemoVendor {
  const store = getVendorStore();
  const now = new Date().toISOString();
  const vendor: DemoVendor = {
    id: randomUUID(),
    name: input.name,
    logo_url: null,
    bio: input.bio,
    service_areas: input.service_areas,
    years_experience: input.years_experience,
    status: "pending",
    owner_profile_id: input.owner.id,
    houses_completed: 0,
    rating_avg: 0,
    rating_count: 0,
    created_at: now,
    updated_at: now,
  };
  store.vendors.unshift(vendor);
  store.vendorMembers.unshift({
    id: randomUUID(),
    vendor_id: vendor.id,
    profile_id: input.owner.id,
    role: "owner",
    active: true,
    created_at: now,
  });
  input.owner.role = "vendor";
  addNotification(
    input.owner.id,
    "Vendor application submitted",
    "Your vendor profile is pending admin approval.",
  );
  return vendor;
}

export function notifyVendorOwners(
  vendorId: string,
  title: string,
  message: string,
) {
  const store = getVendorStore();
  const members = store.vendorMembers.filter(
    (m) => m.vendor_id === vendorId && m.active && m.role !== "worker",
  );
  for (const m of members) {
    addNotification(m.profile_id, title, message);
  }
  const vendor = store.vendors.find((v) => v.id === vendorId);
  if (vendor && !members.some((m) => m.profile_id === vendor.owner_profile_id)) {
    addNotification(vendor.owner_profile_id, title, message);
  }
}

export function publicVendor(v: DemoVendor) {
  return {
    id: v.id,
    name: v.name,
    logo_url: v.logo_url,
    bio: v.bio,
    service_areas: v.service_areas,
    years_experience: v.years_experience,
    status: v.status,
    houses_completed: v.houses_completed,
    rating_avg: v.rating_avg,
    rating_count: v.rating_count,
    created_at: v.created_at,
  };
}

export function enrichMember(m: DemoVendorMember) {
  const user = findUserById(m.profile_id);
  return {
    ...m,
    full_name: user?.full_name ?? "Unknown",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  };
}
