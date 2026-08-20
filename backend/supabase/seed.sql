-- Demo seed for Capital Smart City Marketplace (placeholder geometry)
-- Apply after migrations. Safe to re-run (deletes demo IDs first).

delete from payment_plans where plot_id::text like 'a0000000-%';
delete from amenities where id::text like 'd0000000-%';
delete from plots where id::text like 'a0000000-%';
delete from phases where id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
);

insert into phases (id, name, boundary_geojson, town_plan_url) values
(
  '11111111-1111-1111-1111-111111111111',
  'Phase 1',
  '{"type":"Polygon","coordinates":[[[72.855,33.5595],[72.867,33.5595],[72.867,33.5715],[72.855,33.5715],[72.855,33.5595]]]}'::jsonb,
  '/images/town-plan-placeholder.svg'
),
(
  '22222222-2222-2222-2222-222222222222',
  'Phase 2',
  '{"type":"Polygon","coordinates":[[[72.8695,33.5465],[72.8805,33.5465],[72.8805,33.5575],[72.8695,33.5575],[72.8695,33.5465]]]}'::jsonb,
  '/images/town-plan-placeholder.svg'
),
(
  '33333333-3333-3333-3333-333333333333',
  'Phase 3',
  '{"type":"Polygon","coordinates":[[[72.8835,33.5335],[72.8965,33.5335],[72.8965,33.5465],[72.8835,33.5465],[72.8835,33.5335]]]}'::jsonb,
  '/images/town-plan-placeholder.svg'
),
(
  '44444444-4444-4444-4444-444444444444',
  'Phase RVS',
  '{"type":"Polygon","coordinates":[[[72.84,33.57],[72.85,33.57],[72.85,33.58],[72.84,33.58],[72.84,33.57]]]}'::jsonb,
  '/images/town-plan-placeholder.svg'
);

-- Representative plots (full demo set also available via app seed fallback)
insert into plots (
  id, phase_id, plot_number, size, street, zone, type,
  lump_sum_price, token_amount, status, rda_verified, admin_verified,
  latitude, longitude
) values
('a0000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','Plot 101','10 Marla','St. 1','1','residential',8500000,425000,'available',true,true,33.5662,72.8601),
('a0000000-0000-4000-8000-000000000002','11111111-1111-1111-1111-111111111111','Plot 102','1 Kanal','St. 2','1','residential',14500000,725000,'available',true,false,33.5671,72.8624),
('a0000000-0000-4000-8000-000000000003','11111111-1111-1111-1111-111111111111','Plot 103','5 Marla','St. 3','2','commercial',22000000,1100000,'available',true,true,33.5648,72.8638),
('a0000000-0000-4000-8000-000000000004','11111111-1111-1111-1111-111111111111','Plot 104','7 Marla','St. 4','2','residential',9800000,490000,'available',false,true,33.5639,72.8589),
('a0000000-0000-4000-8000-000000000005','22222222-2222-2222-2222-222222222222','Plot 201','10 Marla','St. 5','3','residential',11200000,560000,'available',true,true,33.5528,72.8742),
('a0000000-0000-4000-8000-000000000006','22222222-2222-2222-2222-222222222222','Plot 202','2 Kanal','St. 6','3','commercial',35000000,1750000,'available',true,true,33.5511,72.8768),
('a0000000-0000-4000-8000-000000000007','33333333-3333-3333-3333-333333333333','Plot 301','1 Kanal','St. 7','4','residential',16800000,840000,'available',true,false,33.5408,72.8912),
('a0000000-0000-4000-8000-000000000008','44444444-4444-4444-4444-444444444444','Plot 401','10 Marla','St. 8','5','residential',12500000,625000,'available',true,true,33.5758,72.8448);

insert into payment_plans (plot_id, plan_type, installment_schedule)
select id, 'Lump Sum', null from plots where id::text like 'a0000000-%';

insert into payment_plans (plot_id, plan_type, installment_schedule)
select id, '1 Year Plan',
  '[{"period":"Down payment","amount":0.3},{"period":"Quarterly x4","amount":0.175}]'::jsonb
from plots where id::text like 'a0000000-%';

insert into amenities (id, phase_id, type, latitude, longitude, label) values
('d0000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','mosque',33.5668,72.8615,'Central Mosque — Phase 1'),
('d0000000-0000-4000-8000-000000000002','11111111-1111-1111-1111-111111111111','park',33.5652,72.8598,'Community Park — Phase 1'),
('d0000000-0000-4000-8000-000000000003','22222222-2222-2222-2222-222222222222','hospital',33.5525,72.8755,'Medical Center — Phase 2'),
('d0000000-0000-4000-8000-000000000004','22222222-2222-2222-2222-222222222222','school',33.5518,72.8741,'School — Phase 2'),
('d0000000-0000-4000-8000-000000000005','33333333-3333-3333-3333-333333333333','park',33.5402,72.8898,'Green Belt — Phase 3'),
('d0000000-0000-4000-8000-000000000006','44444444-4444-4444-4444-444444444444','mosque',33.5752,72.8455,'Mosque — Phase RVS');
