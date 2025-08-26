-- Drop the existing view
DROP VIEW IF EXISTS public.view_income_transactions;

-- Recreate the view without SECURITY DEFINER
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
WHERE direction = 'inbound';

-- Enable RLS on the view
ALTER VIEW public.view_income_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to view their own income transactions
CREATE POLICY "Users can view their own income transactions"
ON public.view_income_transactions
FOR SELECT
USING (auth.uid() = user_id);