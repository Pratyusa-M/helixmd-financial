-- Add income_source column to the view_income_transactions view
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
  receipt_url,
  created_at,
  direction,
  account_type,
  plaid_raw,
  category_override,
  income_source  -- Add this column that was missing
FROM public.transactions 
WHERE direction = 'credit' 
  AND amount > 0;