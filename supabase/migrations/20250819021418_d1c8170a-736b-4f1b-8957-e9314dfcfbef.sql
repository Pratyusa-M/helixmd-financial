-- Recreate view_income_transactions to include category_override and account metadata used by UI
DROP VIEW IF EXISTS public.view_income_transactions;

CREATE VIEW public.view_income_transactions AS
SELECT 
  t.id,
  t.user_id,
  t.date,
  t.description,
  t.amount,
  t.income_source,
  t.category_override,
  t.institution_name,
  t.account_name,
  t.account_type,
  t.created_at
FROM public.transactions AS t
WHERE t.user_id = auth.uid()
  AND t.amount > 0
  AND coalesce(t.plaid_pending, false) = false;