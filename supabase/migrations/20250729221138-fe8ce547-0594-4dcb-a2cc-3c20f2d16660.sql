-- Drop the existing view
DROP VIEW IF EXISTS public.view_income_transactions;

-- Recreate the view without SECURITY DEFINER
-- The view will inherit RLS from the underlying transactions table
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
  category_override,
  institution_name,
  account_name,
  account_type,
  receipt_url,
  plaid_raw,
  created_at
FROM public.transactions
WHERE direction = 'credit';