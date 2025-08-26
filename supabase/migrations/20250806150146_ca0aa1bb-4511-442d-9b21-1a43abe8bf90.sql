-- First, update the view to remove receipt_url reference
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

-- Now drop the receipt_url column from transactions table
ALTER TABLE public.transactions DROP COLUMN IF EXISTS receipt_url;