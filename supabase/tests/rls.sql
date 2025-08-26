BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

-- Variables
SELECT plan(12);

-- Test users
\set u1 '11111111-1111-1111-1111-111111111111'
\set u2 '22222222-2222-2222-2222-222222222222'

-- Seed data (idempotent)
INSERT INTO public.profiles (id, name) VALUES (:'u1', 'Test User 1')
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, name) VALUES (:'u2', 'Test User 2')
  ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (id, user_id, description, amount, date, direction, account_type)
VALUES
  (gen_random_uuid(), :'u1', 'u1 t1', 100, CURRENT_DATE, 'outgoing', 'checking'),
  (gen_random_uuid(), :'u1', 'u1 t2', 50,  CURRENT_DATE, 'incoming', 'savings')
ON CONFLICT DO NOTHING;

INSERT INTO public.transactions (id, user_id, description, amount, date, direction, account_type)
VALUES (gen_random_uuid(), :'u2', 'u2 t1', 200, CURRENT_DATE, 'outgoing', 'checking')
ON CONFLICT DO NOTHING;

INSERT INTO public.vehicle_logs (id, user_id, date, distance_km, from_location, to_location, purpose)
VALUES (gen_random_uuid(), :'u1', CURRENT_DATE, 10, 'A', 'B', 'work')
ON CONFLICT DO NOTHING;

INSERT INTO public.vehicle_logs (id, user_id, date, distance_km, from_location, to_location, purpose)
VALUES (gen_random_uuid(), :'u2', CURRENT_DATE, 5, 'C', 'D', 'personal')
ON CONFLICT DO NOTHING;

-- Helper to set auth context for this session (what Supabase uses for auth.uid())
-- anon
SELECT set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);

-- 1-4) anon cannot read protected tables
SELECT results_eq(
  $$ SELECT count(*) FROM public.transactions $$,
  ARRAY[0::bigint],
  'anon blocked on transactions'
);

SELECT results_eq(
  $$ SELECT count(*) FROM public.vehicle_logs $$,
  ARRAY[0::bigint],
  'anon blocked on vehicle_logs'
);

SELECT results_eq(
  $$ SELECT count(*) FROM public.profiles $$,
  ARRAY[0::bigint],
  'anon blocked on profiles'
);

SELECT results_eq(
  $$ SELECT count(*) FROM storage.objects WHERE bucket_id='receipts' $$,
  ARRAY[0::bigint],
  'anon blocked on storage.objects (receipts)'
);

-- Set u1 as authenticated
SELECT set_config('request.jwt.claims', json_build_object('sub', :'u1', 'role', 'authenticated')::text, true);

-- 5) u1 sees only u1 transactions (compare RLS view vs base truth)
SELECT results_eq(
  $$ SELECT count(*) FROM public.transactions $$,
  $$ SELECT count(*) FROM public.transactions WHERE user_id = :'u1'::uuid $$,
  'u1 sees only their transactions'
);

-- 6) u1 sees only u1 vehicle_logs
SELECT results_eq(
  $$ SELECT count(*) FROM public.vehicle_logs $$,
  $$ SELECT count(*) FROM public.vehicle_logs WHERE user_id = :'u1'::uuid $$,
  'u1 sees only their vehicle_logs'
);

-- 7) u1 sees their profile only
SELECT results_eq(
  $$ SELECT count(*) FROM public.profiles $$,
  $$ SELECT count(*) FROM public.profiles WHERE id = :'u1'::uuid $$,
  'u1 sees only their profile'
);

-- 8) u1 cannot see u2 transactions
SELECT results_eq(
  $$ SELECT count(*) FROM public.transactions WHERE user_id = :'u2'::uuid $$,
  ARRAY[0::bigint],
  'u1 cannot see u2 transactions'
);

-- Set u2 as authenticated
SELECT set_config('request.jwt.claims', json_build_object('sub', :'u2', 'role', 'authenticated')::text, true);

-- 9) u2 sees only u2 transactions
SELECT results_eq(
  $$ SELECT count(*) FROM public.transactions $$,
  $$ SELECT count(*) FROM public.transactions WHERE user_id = :'u2'::uuid $$,
  'u2 sees only their transactions'
);

-- 10) u2 cannot see u1 vehicle_logs
SELECT results_eq(
  $$ SELECT count(*) FROM public.vehicle_logs WHERE user_id = :'u1'::uuid $$,
  ARRAY[0::bigint],
  'u2 cannot see u1 vehicle_logs'
);

-- 11) receipts bucket exists and is private
SELECT ok(
  EXISTS(SELECT 1 FROM storage.buckets WHERE id='receipts' AND public=false),
  'receipts bucket exists and is private'
);

-- 12) RLS enabled on critical tables
SELECT ok(
  (SELECT bool_and(row_security)
   FROM information_schema.tables
   WHERE table_schema='public' AND table_name IN ('transactions', 'vehicle_logs', 'profiles')),
  'RLS enabled on critical tables'
);

SELECT * FROM finish();

ROLLBACK;