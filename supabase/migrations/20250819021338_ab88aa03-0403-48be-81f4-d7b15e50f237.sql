-- Fix the view_income_transactions to include all necessary columns
DROP VIEW IF EXISTS public.view_income_transactions;

CREATE VIEW public.view_income_transactions AS
SELECT 
    id,
    user_id,
    date,
    description,
    amount,
    income_source,
    category_override,
    institution_name,
    account_name,
    account_type,
    plaid_account_id,
    plaid_transaction_id,
    plaid_pending,
    created_at,
    updated_at
FROM public.transactions t
WHERE user_id = auth.uid() 
AND amount > 0;