-- Test RLS policies for financial tables
-- Tests daily_rollups, ingestion_events, and view_income_transactions

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

-- Plan the number of tests
SELECT plan(18);

-- Test user UUIDs
\set u1 '11111111-1111-1111-1111-111111111111'
\set u2 '22222222-2222-2222-2222-222222222222'

-- Setup test data (idempotent)
INSERT INTO public.profiles (id, name) VALUES (:'u1', 'Test User 1')
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (id, name) VALUES (:'u2', 'Test User 2')
  ON CONFLICT (id) DO NOTHING;

-- Insert test transactions for view_income_transactions tests
INSERT INTO public.transactions (id, user_id, description, amount, date, direction, account_type)
VALUES 
  (gen_random_uuid(), :'u1', 'u1 income 1', 500, CURRENT_DATE, 'credit', 'checking'),
  (gen_random_uuid(), :'u1', 'u1 expense 1', -100, CURRENT_DATE, 'debit', 'checking')
ON CONFLICT DO NOTHING;

INSERT INTO public.transactions (id, user_id, description, amount, date, direction, account_type)
VALUES (gen_random_uuid(), :'u2', 'u2 income 1', 300, CURRENT_DATE, 'credit', 'savings')
ON CONFLICT DO NOTHING;

-- Insert test daily_rollups data
INSERT INTO public.daily_rollups (user_id, day, income_total, expense_total, net_cashflow)
VALUES 
  (:'u1', CURRENT_DATE, 1000, 500, 500),
  (:'u1', CURRENT_DATE - 1, 800, 400, 400)
ON CONFLICT DO NOTHING;

INSERT INTO public.daily_rollups (user_id, day, income_total, expense_total, net_cashflow)
VALUES (:'u2', CURRENT_DATE, 600, 200, 400)
ON CONFLICT DO NOTHING;

-- Insert test ingestion_events data
INSERT INTO public.ingestion_events (user_id, event_type, idempotency_key, payload_hash)
VALUES 
  (:'u1', 'transaction_import', 'test-key-u1-1', 'hash1'),
  (:'u1', 'transaction_import', 'test-key-u1-2', 'hash2')
ON CONFLICT DO NOTHING;

INSERT INTO public.ingestion_events (user_id, event_type, idempotency_key, payload_hash)
VALUES (:'u2', 'transaction_import', 'test-key-u2-1', 'hash3')
ON CONFLICT DO NOTHING;

-- Test 1-6: Anonymous user access denied
SELECT set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);

SELECT results_eq(
  $$ SELECT count(*) FROM public.daily_rollups $$,
  ARRAY[0::bigint],
  'anon blocked on daily_rollups'
);

SELECT results_eq(
  $$ SELECT count(*) FROM public.ingestion_events $$,
  ARRAY[0::bigint],
  'anon blocked on ingestion_events'
);

SELECT results_eq(
  $$ SELECT count(*) FROM public.view_income_transactions $$,
  ARRAY[0::bigint],
  'anon blocked on view_income_transactions'
);

-- Test insert attempts for anon (should fail)
SELECT throws_ok(
  $$ INSERT INTO public.daily_rollups (user_id, day, income_total, expense_total, net_cashflow) VALUES ('11111111-1111-1111-1111-111111111111', CURRENT_DATE, 100, 50, 50) $$,
  'anon insert blocked on daily_rollups'
);

SELECT throws_ok(
  $$ INSERT INTO public.ingestion_events (user_id, event_type, idempotency_key, payload_hash) VALUES ('11111111-1111-1111-1111-111111111111', 'test', 'test-key', 'test-hash') $$,
  'anon insert blocked on ingestion_events'
);

-- Test update attempts for anon (should fail)
SELECT throws_ok(
  $$ UPDATE public.daily_rollups SET income_total = 999 WHERE user_id = '11111111-1111-1111-1111-111111111111' $$,
  'anon update blocked on daily_rollups'
);

-- Test 7-12: User 1 authenticated access
SELECT set_config('request.jwt.claims', json_build_object('sub', :'u1', 'role', 'authenticated')::text, true);

-- User 1 can see their own daily_rollups
SELECT results_eq(
  $$ SELECT count(*) FROM public.daily_rollups $$,
  $$ SELECT count(*) FROM public.daily_rollups WHERE user_id = :'u1'::uuid $$,
  'u1 sees only their daily_rollups'
);

-- User 1 can see their own ingestion_events
SELECT results_eq(
  $$ SELECT count(*) FROM public.ingestion_events $$,
  $$ SELECT count(*) FROM public.ingestion_events WHERE user_id = :'u1'::uuid $$,
  'u1 sees only their ingestion_events'
);

-- User 1 can see their income transactions through the view
SELECT results_eq(
  $$ SELECT count(*) FROM public.view_income_transactions $$,
  $$ SELECT count(*) FROM public.transactions WHERE user_id = :'u1'::uuid AND direction = 'credit' $$,
  'u1 sees only their income transactions via view'
);

-- User 1 cannot see user 2's data
SELECT results_eq(
  $$ SELECT count(*) FROM public.daily_rollups WHERE user_id = :'u2'::uuid $$,
  ARRAY[0::bigint],
  'u1 cannot see u2 daily_rollups'
);

SELECT results_eq(
  $$ SELECT count(*) FROM public.ingestion_events WHERE user_id = :'u2'::uuid $$,
  ARRAY[0::bigint],
  'u1 cannot see u2 ingestion_events'
);

SELECT results_eq(
  $$ SELECT count(*) FROM public.view_income_transactions WHERE user_id = :'u2'::uuid $$,
  ARRAY[0::bigint],
  'u1 cannot see u2 income via view'
);

-- Test 13-18: User 2 authenticated access
SELECT set_config('request.jwt.claims', json_build_object('sub', :'u2', 'role', 'authenticated')::text, true);

-- User 2 can see their own daily_rollups
SELECT results_eq(
  $$ SELECT count(*) FROM public.daily_rollups $$,
  $$ SELECT count(*) FROM public.daily_rollups WHERE user_id = :'u2'::uuid $$,
  'u2 sees only their daily_rollups'
);

-- User 2 can see their own ingestion_events
SELECT results_eq(
  $$ SELECT count(*) FROM public.ingestion_events $$,
  $$ SELECT count(*) FROM public.ingestion_events WHERE user_id = :'u2'::uuid $$,
  'u2 sees only their ingestion_events'
);

-- User 2 can see their income transactions through the view
SELECT results_eq(
  $$ SELECT count(*) FROM public.view_income_transactions $$,
  $$ SELECT count(*) FROM public.transactions WHERE user_id = :'u2'::uuid AND direction = 'credit' $$,
  'u2 sees only their income transactions via view'
);

-- User 2 cannot see user 1's data
SELECT results_eq(
  $$ SELECT count(*) FROM public.daily_rollups WHERE user_id = :'u1'::uuid $$,
  ARRAY[0::bigint],
  'u2 cannot see u1 daily_rollups'
);

SELECT results_eq(
  $$ SELECT count(*) FROM public.ingestion_events WHERE user_id = :'u1'::uuid $$,
  ARRAY[0::bigint],
  'u2 cannot see u1 ingestion_events'
);

SELECT results_eq(
  $$ SELECT count(*) FROM public.view_income_transactions WHERE user_id = :'u1'::uuid $$,
  ARRAY[0::bigint],
  'u2 cannot see u1 income via view'
);

SELECT * FROM finish();

ROLLBACK;