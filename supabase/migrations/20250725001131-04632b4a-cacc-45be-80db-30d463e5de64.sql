-- Fix Security Definer View Issue
-- Drop the existing view and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.view_income_transactions;

-- Recreate the view without SECURITY DEFINER to respect RLS policies
CREATE VIEW public.view_income_transactions AS
SELECT 
  id,
  user_id,
  date,
  amount,
  direction,
  expense_type,
  expense_category,
  expense_subcategory,
  category_override,
  income_source,
  created_at,
  account_name,
  account_type,
  description,
  receipt_url,
  institution_name,
  plaid_raw
FROM public.transactions
WHERE direction = 'incoming';

-- Enable RLS on the view
ALTER VIEW public.view_income_transactions OWNER TO postgres;

-- Create RLS policy for the view to ensure users can only see their own income transactions
CREATE POLICY "Users can view their own income transactions via view" 
ON public.view_income_transactions 
FOR SELECT 
USING (auth.uid() = user_id);