-- Vendor ecosystem + dual materials inventory

create type vendor_status_enum as enum ('pending', 'approved', 'suspended');
create type vendor_member_role_enum as enum ('owner', 'manager', 'worker');
create type hire_request_status_enum as enum (
  'pending',
  'accepted',
  'declined',
  'cancelled'
);
create type vendor_project_status_enum as enum ('active', 'completed', 'cancelled');
create type vendor_task_status_enum as enum ('todo', 'in_progress', 'done');
create type material_category_enum as enum ('cement', 'bricks', 'steel', 'other');
create type material_seller_type_enum as enum ('platform', 'vendor');
create type material_order_status_enum as enum (
  'placed',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled'
);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  bio text not null default '',
  service_areas text[] not null default '{}',
  years_experience int not null default 0,
  status vendor_status_enum not null default 'pending',
  owner_profile_id uuid not null references profiles (id) on delete restrict,
  houses_completed int not null default 0,
  rating_avg numeric(3, 2) not null default 0,
  rating_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table vendor_members (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  role vendor_member_role_enum not null default 'worker',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (vendor_id, profile_id)
);

create table vendor_hire_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles (id) on delete cascade,
  vendor_id uuid not null references vendors (id) on delete cascade,
  ownership_id uuid references ownership_records (id) on delete set null,
  plot_id uuid references plots (id) on delete set null,
  message text not null default '',
  budget_note text,
  status hire_request_status_enum not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table vendor_projects (
  id uuid primary key default gen_random_uuid(),
  hire_request_id uuid references vendor_hire_requests (id) on delete set null,
  vendor_id uuid not null references vendors (id) on delete cascade,
  customer_id uuid not null references profiles (id) on delete cascade,
  ownership_id uuid references ownership_records (id) on delete set null,
  plot_id uuid references plots (id) on delete set null,
  title text not null,
  notes text not null default '',
  status vendor_project_status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table vendor_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references vendor_projects (id) on delete cascade,
  vendor_id uuid not null references vendors (id) on delete cascade,
  customer_id uuid not null references profiles (id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  remarks text not null default '',
  created_at timestamptz not null default now(),
  unique (project_id)
);

create table vendor_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references vendor_projects (id) on delete cascade,
  assignee_member_id uuid references vendor_members (id) on delete set null,
  title text not null,
  due_at timestamptz,
  status vendor_task_status_enum not null default 'todo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table material_catalog (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category material_category_enum not null default 'other',
  unit text not null default 'bag',
  unit_price numeric(14, 2) not null,
  stock int not null default 0,
  seller_type material_seller_type_enum not null default 'platform',
  vendor_id uuid references vendors (id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table material_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles (id) on delete cascade,
  status material_order_status_enum not null default 'placed',
  total_amount numeric(14, 2) not null default 0,
  items jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table project_material_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references vendor_projects (id) on delete cascade,
  catalog_id uuid references material_catalog (id) on delete set null,
  name text not null,
  qty numeric(14, 2) not null,
  unit text not null default 'unit',
  cost numeric(14, 2) not null default 0,
  noted_by_member_id uuid references vendor_members (id) on delete set null,
  created_at timestamptz not null default now()
);

create index vendors_status_idx on vendors (status);
create index vendor_hire_requests_vendor_idx on vendor_hire_requests (vendor_id, status);
create index vendor_projects_vendor_idx on vendor_projects (vendor_id, status);
create index vendor_projects_customer_idx on vendor_projects (customer_id);
create index material_catalog_active_idx on material_catalog (active, category);

alter table vendors enable row level security;
alter table vendor_members enable row level security;
alter table vendor_hire_requests enable row level security;
alter table vendor_projects enable row level security;
alter table vendor_reviews enable row level security;
alter table vendor_tasks enable row level security;
alter table material_catalog enable row level security;
alter table material_orders enable row level security;
alter table project_material_logs enable row level security;

create policy vendors_public_read on vendors
  for select using (status = 'approved');

create policy material_catalog_public_read on material_catalog
  for select using (active = true);

create policy vendor_reviews_public_read on vendor_reviews
  for select using (true);
