import "server-only";

import { randomUUID } from "crypto";
import type { DemoUser } from "@backend/demo/store";
import {
  addNotification,
  findUserByEmail,
  findUserById,
  getDemoStore,
} from "@backend/demo/store";
import {
  enrichMember,
  getMemberForUser,
  getVendorForUser,
  getVendorStore,
  notifyVendorOwners,
  publicVendor,
  recomputeVendorRating,
  registerVendorOrg,
  type DemoHireRequest,
  type DemoMaterialOrder,
  type DemoProjectMaterialLog,
  type DemoVendorProject,
  type DemoVendorTask,
} from "@backend/demo/vendor-store";

export function listApprovedVendors(sort: "rating" | "houses" = "rating") {
  const vendors = getVendorStore()
    .vendors.filter((v) => v.status === "approved")
    .map(publicVendor);
  if (sort === "houses") {
    return vendors.sort((a, b) => b.houses_completed - a.houses_completed);
  }
  return vendors.sort((a, b) => b.rating_avg - a.rating_avg);
}

export function listAllVendorsForAdmin() {
  return getVendorStore().vendors.map(publicVendor);
}

export function setVendorStatus(
  vendorId: string,
  status: "approved" | "suspended" | "pending",
  actorId: string,
) {
  const store = getVendorStore();
  const vendor = store.vendors.find((v) => v.id === vendorId);
  if (!vendor) throw new Error("Vendor not found");
  vendor.status = status;
  vendor.updated_at = new Date().toISOString();
  addNotification(
    vendor.owner_profile_id,
    status === "approved" ? "Vendor approved" : `Vendor ${status}`,
    status === "approved"
      ? "Your vendor account is live. You can accept hire requests."
      : `Your vendor status is now ${status}.`,
  );
  void actorId;
  return publicVendor(vendor);
}

export function createHireRequest(input: {
  customer: DemoUser;
  vendor_id: string;
  ownership_id?: string | null;
  plot_id?: string | null;
  message: string;
  budget_note?: string | null;
}) {
  const store = getVendorStore();
  const vendor = store.vendors.find(
    (v) => v.id === input.vendor_id && v.status === "approved",
  );
  if (!vendor) throw new Error("Vendor not available");

  const existing = store.hireRequests.find(
    (r) =>
      r.customer_id === input.customer.id &&
      r.vendor_id === input.vendor_id &&
      r.status === "pending",
  );
  if (existing) throw new Error("You already have a pending request with this vendor");

  const now = new Date().toISOString();
  const request: DemoHireRequest = {
    id: randomUUID(),
    customer_id: input.customer.id,
    vendor_id: input.vendor_id,
    ownership_id: input.ownership_id ?? null,
    plot_id: input.plot_id ?? null,
    message: input.message,
    budget_note: input.budget_note ?? null,
    status: "pending",
    created_at: now,
    updated_at: now,
  };
  store.hireRequests.unshift(request);
  notifyVendorOwners(
    vendor.id,
    "New hire request",
    `${input.customer.full_name} requested to hire ${vendor.name}.`,
  );
  addNotification(
    input.customer.id,
    "Hire request sent",
    `Your request to ${vendor.name} is pending.`,
  );
  return request;
}

export function listHireRequestsForUser(user: DemoUser) {
  const store = getVendorStore();
  if (user.role === "customer") {
    return store.hireRequests.filter((r) => r.customer_id === user.id);
  }
  const vendor = getVendorForUser(user);
  if (!vendor) return [];
  return store.hireRequests.filter((r) => r.vendor_id === vendor.id);
}

export function respondHireRequest(
  user: DemoUser,
  requestId: string,
  action: "accept" | "decline",
) {
  const store = getVendorStore();
  const vendor = getVendorForUser(user);
  if (!vendor || user.role === "vendor_employee") {
    throw new Error("Only vendor owners/managers can respond");
  }
  const member = getMemberForUser(user);
  if (member && member.role === "worker") {
    throw new Error("Workers cannot respond to hire requests");
  }

  const request = store.hireRequests.find(
    (r) => r.id === requestId && r.vendor_id === vendor.id,
  );
  if (!request || request.status !== "pending") {
    throw new Error("Request not found or already handled");
  }

  const now = new Date().toISOString();
  if (action === "decline") {
    request.status = "declined";
    request.updated_at = now;
    addNotification(
      request.customer_id,
      "Hire request declined",
      `${vendor.name} declined your hire request.`,
    );
    return { request, project: null };
  }

  request.status = "accepted";
  request.updated_at = now;
  const customer = findUserById(request.customer_id);
  const project: DemoVendorProject = {
    id: randomUUID(),
    hire_request_id: request.id,
    vendor_id: vendor.id,
    customer_id: request.customer_id,
    ownership_id: request.ownership_id,
    plot_id: request.plot_id,
    title: `Construction for ${customer?.full_name ?? "customer"}`,
    notes: request.message,
    status: "active",
    created_at: now,
    updated_at: now,
  };
  store.vendorProjects.unshift(project);
  addNotification(
    request.customer_id,
    "Vendor hired",
    `${vendor.name} accepted your request. Project is now active.`,
  );
  return { request, project };
}

export function listProjectsForUser(user: DemoUser) {
  const store = getVendorStore();
  if (user.role === "customer") {
    return store.vendorProjects.filter((p) => p.customer_id === user.id);
  }
  const vendor = getVendorForUser(user);
  if (!vendor) return [];
  return store.vendorProjects.filter((p) => p.vendor_id === vendor.id);
}

export function updateProjectStatus(
  user: DemoUser,
  projectId: string,
  status: "active" | "completed" | "cancelled",
) {
  const store = getVendorStore();
  const vendor = getVendorForUser(user);
  if (!vendor || user.role === "vendor_employee") {
    throw new Error("Only vendor owners can update project status");
  }
  const project = store.vendorProjects.find(
    (p) => p.id === projectId && p.vendor_id === vendor.id,
  );
  if (!project) throw new Error("Project not found");
  const prev = project.status;
  project.status = status;
  project.updated_at = new Date().toISOString();
  if (status === "completed" && prev !== "completed") {
    vendor.houses_completed += 1;
    vendor.updated_at = project.updated_at;
    addNotification(
      project.customer_id,
      "Project completed",
      "Your construction project is marked complete. You can leave a review.",
    );
  }
  return project;
}

export function listTeam(user: DemoUser) {
  const vendor = getVendorForUser(user);
  if (!vendor) return [];
  return getVendorStore()
    .vendorMembers.filter((m) => m.vendor_id === vendor.id)
    .map(enrichMember);
}

export function addTeamMember(
  user: DemoUser,
  input: {
    email: string;
    full_name: string;
    phone: string;
    password: string;
    role: "manager" | "worker";
  },
) {
  if (user.role !== "vendor") throw new Error("Only vendor owners can add staff");
  const vendor = getVendorForUser(user);
  if (!vendor || vendor.owner_profile_id !== user.id) {
    throw new Error("Vendor owner required");
  }
  if (findUserByEmail(input.email)) {
    throw new Error("Email already registered");
  }
  const now = new Date().toISOString();
  const employee: DemoUser = {
    id: randomUUID(),
    email: input.email,
    password: input.password,
    full_name: input.full_name,
    phone: input.phone,
    cnic_number: null,
    role: "vendor_employee",
    kyc_status: "verified",
    suspended: false,
    reservation_banned_until: null,
    created_at: now,
  };
  getDemoStore().users.push(employee);
  const member = {
    id: randomUUID(),
    vendor_id: vendor.id,
    profile_id: employee.id,
    role: input.role,
    active: true,
    created_at: now,
  };
  getVendorStore().vendorMembers.unshift(member);
  addNotification(
    employee.id,
    "Joined vendor team",
    `You were added to ${vendor.name} as ${input.role}.`,
  );
  return enrichMember(member);
}

export function listTasksForUser(user: DemoUser) {
  const store = getVendorStore();
  if (user.role === "customer") {
    const projectIds = new Set(
      store.vendorProjects
        .filter((p) => p.customer_id === user.id)
        .map((p) => p.id),
    );
    return store.vendorTasks.filter((t) => projectIds.has(t.project_id));
  }
  const vendor = getVendorForUser(user);
  if (!vendor) return [];
  const projectIds = new Set(
    store.vendorProjects.filter((p) => p.vendor_id === vendor.id).map((p) => p.id),
  );
  let tasks = store.vendorTasks.filter((t) => projectIds.has(t.project_id));
  if (user.role === "vendor_employee") {
    const member = getMemberForUser(user);
    if (member) {
      tasks = tasks.filter((t) => t.assignee_member_id === member.id);
    }
  }
  return tasks;
}

export function createTask(
  user: DemoUser,
  input: {
    project_id: string;
    title: string;
    assignee_member_id?: string | null;
    due_at?: string | null;
  },
) {
  if (user.role === "vendor_employee") {
    throw new Error("Employees cannot assign tasks");
  }
  const vendor = getVendorForUser(user);
  if (!vendor) throw new Error("Vendor required");
  const store = getVendorStore();
  const project = store.vendorProjects.find(
    (p) => p.id === input.project_id && p.vendor_id === vendor.id,
  );
  if (!project) throw new Error("Project not found");
  if (input.assignee_member_id) {
    const member = store.vendorMembers.find(
      (m) =>
        m.id === input.assignee_member_id &&
        m.vendor_id === vendor.id &&
        m.active,
    );
    if (!member) throw new Error("Assignee not on this team");
  }
  const now = new Date().toISOString();
  const task: DemoVendorTask = {
    id: randomUUID(),
    project_id: input.project_id,
    assignee_member_id: input.assignee_member_id ?? null,
    title: input.title,
    due_at: input.due_at ?? null,
    status: "todo",
    created_at: now,
    updated_at: now,
  };
  store.vendorTasks.unshift(task);
  if (task.assignee_member_id) {
    const member = store.vendorMembers.find(
      (m) => m.id === task.assignee_member_id,
    );
    if (member) {
      addNotification(member.profile_id, "New task assigned", task.title);
    }
  }
  return task;
}

export function updateTaskStatus(
  user: DemoUser,
  taskId: string,
  status: "todo" | "in_progress" | "done",
) {
  const store = getVendorStore();
  const task = store.vendorTasks.find((t) => t.id === taskId);
  if (!task) throw new Error("Task not found");
  const project = store.vendorProjects.find((p) => p.id === task.project_id);
  if (!project) throw new Error("Project not found");
  const vendor = getVendorForUser(user);
  if (!vendor || vendor.id !== project.vendor_id) {
    throw new Error("Forbidden");
  }
  if (user.role === "vendor_employee") {
    const member = getMemberForUser(user);
    if (!member || task.assignee_member_id !== member.id) {
      throw new Error("You can only update your assigned tasks");
    }
  }
  task.status = status;
  task.updated_at = new Date().toISOString();
  return task;
}

export function submitReview(
  user: DemoUser,
  input: { project_id: string; stars: number; remarks: string },
) {
  if (user.role !== "customer") throw new Error("Customers only");
  const store = getVendorStore();
  const project = store.vendorProjects.find(
    (p) =>
      p.id === input.project_id &&
      p.customer_id === user.id &&
      p.status === "completed",
  );
  if (!project) throw new Error("Completed project not found");
  if (store.vendorReviews.some((r) => r.project_id === project.id)) {
    throw new Error("Review already submitted");
  }
  const review = {
    id: randomUUID(),
    project_id: project.id,
    vendor_id: project.vendor_id,
    customer_id: user.id,
    stars: input.stars,
    remarks: input.remarks,
    created_at: new Date().toISOString(),
  };
  store.vendorReviews.unshift(review);
  recomputeVendorRating(project.vendor_id);
  notifyVendorOwners(
    project.vendor_id,
    "New customer review",
    `${user.full_name} rated you ${input.stars} stars.`,
  );
  return review;
}

export function listCatalog(activeOnly = true) {
  const items = getVendorStore().materialCatalog;
  return activeOnly ? items.filter((i) => i.active) : items;
}

export function placeMaterialOrder(
  user: DemoUser,
  items: { catalog_id: string; qty: number }[],
) {
  if (user.role !== "customer") throw new Error("Customers only");
  if (!items.length) throw new Error("Cart is empty");
  const store = getVendorStore();
  const lineItems = items.map((item) => {
    const catalog = store.materialCatalog.find(
      (c) => c.id === item.catalog_id && c.active,
    );
    if (!catalog) throw new Error("Material not found");
    if (catalog.stock < item.qty) {
      throw new Error(`Insufficient stock for ${catalog.name}`);
    }
    return {
      catalog,
      qty: item.qty,
      unit_price: catalog.unit_price,
      name: catalog.name,
      catalog_id: catalog.id,
    };
  });
  for (const line of lineItems) {
    line.catalog.stock -= line.qty;
  }
  const now = new Date().toISOString();
  const order: DemoMaterialOrder = {
    id: randomUUID(),
    customer_id: user.id,
    status: "placed",
    total_amount: lineItems.reduce((s, l) => s + l.unit_price * l.qty, 0),
    items: lineItems.map((l) => ({
      catalog_id: l.catalog_id,
      name: l.name,
      qty: l.qty,
      unit_price: l.unit_price,
    })),
    created_at: now,
    updated_at: now,
  };
  store.materialOrders.unshift(order);
  addNotification(
    user.id,
    "Materials order placed",
    `Order total PKR ${order.total_amount.toLocaleString()}. Status: placed.`,
  );
  return order;
}

export function listMaterialOrders(user: DemoUser) {
  const store = getVendorStore();
  if (user.role === "customer") {
    return store.materialOrders.filter((o) => o.customer_id === user.id);
  }
  if (["sales_admin", "super_admin"].includes(user.role)) {
    return store.materialOrders;
  }
  return [];
}

export function setMaterialActive(
  catalogId: string,
  active: boolean,
) {
  const item = getVendorStore().materialCatalog.find((c) => c.id === catalogId);
  if (!item) throw new Error("Catalog item not found");
  item.active = active;
  return item;
}

export function listProjectMaterials(user: DemoUser, projectId: string) {
  const store = getVendorStore();
  const project = store.vendorProjects.find((p) => p.id === projectId);
  if (!project) throw new Error("Project not found");
  const vendor = getVendorForUser(user);
  const allowed =
    project.customer_id === user.id ||
    (vendor && vendor.id === project.vendor_id) ||
    ["sales_admin", "super_admin"].includes(user.role);
  if (!allowed) throw new Error("Forbidden");
  return store.projectMaterialLogs.filter((l) => l.project_id === projectId);
}

export function addProjectMaterialLog(
  user: DemoUser,
  input: {
    project_id: string;
    catalog_id?: string | null;
    name: string;
    qty: number;
    unit: string;
    cost: number;
  },
) {
  if (user.role === "customer") throw new Error("Vendors only");
  const store = getVendorStore();
  const vendor = getVendorForUser(user);
  if (!vendor) throw new Error("Vendor required");
  const project = store.vendorProjects.find(
    (p) => p.id === input.project_id && p.vendor_id === vendor.id,
  );
  if (!project) throw new Error("Project not found");
  const member = getMemberForUser(user);
  let name = input.name;
  let unit = input.unit;
  if (input.catalog_id) {
    const catalog = store.materialCatalog.find((c) => c.id === input.catalog_id);
    if (catalog) {
      name = catalog.name;
      unit = catalog.unit;
    }
  }
  const log: DemoProjectMaterialLog = {
    id: randomUUID(),
    project_id: project.id,
    catalog_id: input.catalog_id ?? null,
    name,
    qty: input.qty,
    unit,
    cost: input.cost,
    noted_by_member_id: member?.id ?? null,
    created_at: new Date().toISOString(),
  };
  store.projectMaterialLogs.unshift(log);
  return log;
}

export function vendorDashboard(user: DemoUser) {
  const vendor = getVendorForUser(user);
  if (!vendor) {
    return {
      vendor: null,
      open_requests: 0,
      active_projects: 0,
      team_size: 0,
      rating_avg: 0,
      rating_count: 0,
      houses_completed: 0,
    };
  }
  const store = getVendorStore();
  return {
    vendor: publicVendor(vendor),
    open_requests: store.hireRequests.filter(
      (r) => r.vendor_id === vendor.id && r.status === "pending",
    ).length,
    active_projects: store.vendorProjects.filter(
      (p) => p.vendor_id === vendor.id && p.status === "active",
    ).length,
    team_size: store.vendorMembers.filter(
      (m) => m.vendor_id === vendor.id && m.active,
    ).length,
    rating_avg: vendor.rating_avg,
    rating_count: vendor.rating_count,
    houses_completed: vendor.houses_completed,
  };
}

export function getHiredPanelForCustomer(customerId: string) {
  const store = getVendorStore();
  return store.vendorProjects
    .filter((p) => p.customer_id === customerId)
    .map((project) => {
      const vendor = store.vendors.find((v) => v.id === project.vendor_id);
      const tasks = store.vendorTasks.filter((t) => t.project_id === project.id);
      const materials = store.projectMaterialLogs.filter(
        (l) => l.project_id === project.id,
      );
      const review = store.vendorReviews.find((r) => r.project_id === project.id);
      return {
        project,
        vendor: vendor ? publicVendor(vendor) : null,
        tasks_summary: {
          total: tasks.length,
          done: tasks.filter((t) => t.status === "done").length,
          in_progress: tasks.filter((t) => t.status === "in_progress").length,
        },
        materials,
        review: review ?? null,
      };
    });
}

export { registerVendorOrg, publicVendor, getVendorForUser };
