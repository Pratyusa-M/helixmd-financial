-- Security Fix: Remove SECURITY DEFINER from view_income_transactions
-- Replace with regular view that relies on RLS policies

DROP VIEW IF EXISTS public.view_income_transactions;

-- Create regular view without SECURITY DEFINER
-- This view will respect RLS policies on the transactions table
CREATE VIEW public.view_income_transactions AS
SELECT 
  id,
  user_id,
  date,
  amount,
  description,
  direction,
  expense_type,
  expense_category,
  expense_subcategory,
  income_source,
  institution_name,
  account_name,
  account_type,
  receipt_url,
  plaid_raw,
  category_override,
  created_at
FROM public.transactions 
WHERE direction = 'credit';