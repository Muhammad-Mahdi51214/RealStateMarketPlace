-- RLS: enable on every public table. Deny by default; grant explicit policies.

alter table profiles enable row level security;
alter table phases enable row level security;
alter table plots enable row level security;
alter table payment_plans enable row level security;
alter table amenities enable row level security;
alter table favorites enable row level security;
alter table notifications enable row level security;
alter table listing_submissions enable row level security;
alter table reservations enable row level security;
alter table transactions enable row level security;
alter table documents enable row level security;
alter table ownership_records enable row level security;
alter table audit_logs enable row level security;

-- Helper: check admin roles from profiles (never user_metadata)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('verification_officer', 'sales_admin', 'super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
  );
$$;

-- ===== PUBLIC READ: inventory =====
create policy "Public read phases"
  on phases for select
  to anon, authenticated
  using (true);

create policy "Public read plots"
  on plots for select
  to anon, authenticated
  using (true);

create policy "Public read payment_plans"
  on payment_plans for select
  to anon, authenticated
  using (true);

create policy "Public read amenities"
  on amenities for select
  to anon, authenticated
  using (true);

-- No anon/authenticated INSERT/UPDATE/DELETE on inventory (admin via service role / later policies)
create policy "Admins manage phases"
  on phases for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage plots"
  on plots for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage payment_plans"
  on payment_plans for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage amenities"
  on amenities for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ===== profiles =====
create policy "Users read own profile"
  on profiles for select
  to authenticated
  using (auth.uid() = id or public.is_admin());

create policy "Users update own non-role fields"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from profiles p where p.id = auth.uid())
  );

create policy "Admins update profiles"
  on profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ===== favorites / notifications =====
create policy "Own favorites select"
  on favorites for select to authenticated
  using (auth.uid() = customer_id);

create policy "Own favorites insert"
  on favorites for insert to authenticated
  with check (auth.uid() = customer_id);

create policy "Own favorites delete"
  on favorites for delete to authenticated
  using (auth.uid() = customer_id);

create policy "Own notifications select"
  on notifications for select to authenticated
  using (auth.uid() = user_id);

create policy "Own notifications update"
  on notifications for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ===== listing_submissions =====
create policy "Own listings select"
  on listing_submissions for select to authenticated
  using (auth.uid() = submitted_by or public.is_admin());

create policy "Own listings insert"
  on listing_submissions for insert to authenticated
  with check (auth.uid() = submitted_by);

create policy "Admins update listings"
  on listing_submissions for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ===== reservations =====
-- Customers may insert/select own rows; status transitions happen via service role later
create policy "Own reservations select"
  on reservations for select to authenticated
  using (auth.uid() = customer_id or public.is_admin());

create policy "Own reservations insert"
  on reservations for insert to authenticated
  with check (auth.uid() = customer_id);

create policy "Admins update reservations"
  on reservations for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ===== transactions (read-only for owners) =====
create policy "Own transactions select"
  on transactions for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from reservations r
      where r.id = transactions.reservation_id
        and r.customer_id = auth.uid()
    )
  );

-- ===== documents =====
create policy "Own documents select"
  on documents for select to authenticated
  using (auth.uid() = owner_id or public.is_admin());

create policy "Own documents insert"
  on documents for insert to authenticated
  with check (auth.uid() = owner_id);

create policy "Admins update documents"
  on documents for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ===== ownership_records =====
create policy "Owners and admins read ownership"
  on ownership_records for select to authenticated
  using (auth.uid() = owner_id or public.is_admin());

create policy "Super admin insert ownership"
  on ownership_records for insert to authenticated
  with check (public.is_super_admin());

-- ===== audit_logs (immutable) =====
create policy "Admins read audit logs"
  on audit_logs for select to authenticated
  using (public.is_admin());

create policy "Admins insert audit logs"
  on audit_logs for insert to authenticated
  with check (public.is_admin());

-- No UPDATE/DELETE policies on audit_logs (immutable trail)
