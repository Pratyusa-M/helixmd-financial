-- Migration: Harden RLS and Remove Security Definer
-- Purpose: Recreate view as invoker (no SECURITY DEFINER), enable and harden RLS on financial tables

-- 1) Recreate view_income_transactions WITHOUT SECURITY DEFINER (Postgres views run with invoker by default)
DROP VIEW IF EXISTS public.view_income_transactions;

CREATE VIEW public.view_income_transactions AS
SELECT 
  id,
  user_id,
  date,
  institution_name,
  account_name,
  description,
  amount,
  expense_type,
  expense_category,
  expense_subcategory,
  income_source,
  created_at,
  direction,
  account_type,
  plaid_raw,
  category_override,
  receipt_path
FROM public.transactions
WHERE direction = 'credit';

-- 2) Enable RLS on daily_rollups and ingestion_events
ALTER TABLE public.daily_rollups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_events ENABLE ROW LEVEL SECURITY;

-- 3) Clean up any pre-existing policies to avoid duplicates
DROP POLICY IF EXISTS "anon deny all on daily_rollups" ON public.daily_rollups;
DROP POLICY IF EXISTS "authenticated select own daily_rollups" ON public.daily_rollups;
DROP POLICY IF EXISTS "authenticated insert own daily_rollups" ON public.daily_rollups;
DROP POLICY IF EXISTS "authenticated update own daily_rollups" ON public.daily_rollups;
DROP POLICY IF EXISTS "authenticated delete own daily_rollups" ON public.daily_rollups;

DROP POLICY IF EXISTS "anon deny all on ingestion_events" ON public.ingestion_events;
DROP POLICY IF EXISTS "authenticated select own ingestion_events" ON public.ingestion_events;
DROP POLICY IF EXISTS "authenticated insert own ingestion_events" ON public.ingestion_events;
DROP POLICY IF EXISTS "authenticated update own ingestion_events" ON public.ingestion_events;
DROP POLICY IF EXISTS "authenticated delete own ingestion_events" ON public.ingestion_events;

-- 4) Add RESTRICTIVE deny-all policies for anon
CREATE POLICY "anon deny all on daily_rollups"
ON public.daily_rollups
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "anon deny all on ingestion_events"
ON public.ingestion_events
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 5) Add authenticated CRUD policies scoped by user_id = auth.uid()
-- daily_rollups
CREATE POLICY "authenticated select own daily_rollups"
ON public.daily_rollups
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "authenticated insert own daily_rollups"
ON public.daily_rollups
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated update own daily_rollups"
ON public.daily_rollups
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated delete own daily_rollups"
ON public.daily_rollups
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ingestion_events
CREATE POLICY "authenticated select own ingestion_events"
ON public.ingestion_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "authenticated insert own ingestion_events"
ON public.ingestion_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated update own ingestion_events"
ON public.ingestion_events
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated delete own ingestion_events"
ON public.ingestion_events
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);