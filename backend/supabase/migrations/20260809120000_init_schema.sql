-- Capital Smart City Marketplace — initial schema
create extension if not exists "pgcrypto";

-- ========== ENUMS ==========
create type user_role as enum (
  'customer',
  'verification_officer',
  'sales_admin',
  'super_admin'
);
create type kyc_status_enum as enum ('pending', 'verified', 'rejected');
create type plot_type_enum as enum ('residential', 'commercial');
create type plot_status_enum as enum (
  'available',
  'reserved',
  'under_verification',
  'sold'
);
create type amenity_type_enum as enum (
  'mosque',
  'park',
  'hospital',
  'school',
  'other'
);
create type listing_status_enum as enum ('pending', 'approved', 'rejected');
create type reservation_status_enum as enum (
  'pending_payment',
  'reserved',
  'under_verification',
  'confirmed',
  'cancelled',
  'expired'
);
create type transaction_status_enum as enum (
  'initiated',
  'success',
  'failed',
  'refunded'
);
create type document_type_enum as enum (
  'cnic',
  'ownership_proof',
  'transfer_deed',
  'other'
);
create type document_status_enum as enum ('pending', 'verified', 'rejected');

-- ========== IDENTITY ==========
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  cnic_number text unique,
  phone text unique not null,
  role user_role not null default 'customer',
  kyc_status kyc_status_enum not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========== INVENTORY ==========
create table phases (
  id uuid primary key default gen_random_uuid(),
  society_id uuid,
  name text not null,
  boundary_geojson jsonb not null,
  town_plan_url text,
  created_at timestamptz not null default now()
);

create table plots (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references phases (id),
  plot_number text not null,
  size text not null,
  street text,
  zone text,
  type plot_type_enum not null,
  lump_sum_price numeric(14, 2) not null,
  token_amount numeric(14, 2) not null,
  status plot_status_enum not null default 'available',
  rda_verified boolean not null default false,
  admin_verified boolean not null default false,
  latitude numeric not null,
  longitude numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_plots_phase on plots (phase_id);
create index idx_plots_status on plots (status);
create index idx_plots_type on plots (type);
create index idx_plots_price on plots (lump_sum_price);

create table payment_plans (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null references plots (id) on delete cascade,
  plan_type text not null,
  installment_schedule jsonb,
  created_at timestamptz not null default now()
);

create table amenities (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid references phases (id),
  type amenity_type_enum not null,
  latitude numeric not null,
  longitude numeric not null,
  label text
);

-- ========== CUSTOMER ENGAGEMENT ==========
create table favorites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles (id) on delete cascade,
  plot_id uuid not null references plots (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_id, plot_id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  title text,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ========== SELL ==========
create table listing_submissions (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid references plots (id),
  submitted_by uuid not null references profiles (id),
  asking_price numeric(14, 2) not null,
  status listing_status_enum not null default 'pending',
  reviewed_by uuid references profiles (id),
  review_notes text,
  created_at timestamptz not null default now()
);

-- ========== BUY / PAY ==========
create table reservations (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null references plots (id),
  customer_id uuid not null references profiles (id),
  token_amount_paid numeric(14, 2),
  status reservation_status_enum not null default 'pending_payment',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Hard guarantee against double-booking
create unique index uq_active_reservation_per_plot
  on reservations (plot_id)
  where status in ('reserved', 'under_verification');

create table transactions (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations (id),
  gateway_ref text unique,
  amount numeric(14, 2) not null,
  currency text not null default 'PKR',
  status transaction_status_enum not null default 'initiated',
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

-- ========== TRUST & LEGAL ==========
create table documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id),
  plot_id uuid references plots (id),
  reservation_id uuid references reservations (id),
  type document_type_enum not null,
  file_url text not null,
  status document_status_enum not null default 'pending',
  verified_by uuid references profiles (id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table ownership_records (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null unique references plots (id),
  reservation_id uuid not null references reservations (id),
  owner_id uuid not null references profiles (id),
  confirmed_by uuid not null references profiles (id),
  confirmed_at timestamptz not null default now()
);

-- ========== ADMIN ==========
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references profiles (id),
  action text not null,
  entity text not null,
  entity_id uuid not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Profile bootstrap on auth signup (role always from this path / admin update — never user_metadata)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce(new.raw_user_meta_data->>'phone', new.id::text),
    'customer'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger plots_updated_at
  before update on plots
  for each row execute function public.set_updated_at();

create trigger profiles_updated_at
  before update on profiles
  for each row execute function public.set_updated_at();
