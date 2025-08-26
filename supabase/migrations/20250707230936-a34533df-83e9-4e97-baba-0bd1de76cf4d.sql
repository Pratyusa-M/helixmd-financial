-- Drop the view temporarily so we can alter the column types
DROP VIEW IF EXISTS public.view_income_transactions;

-- Create new enum types for better type safety
CREATE TYPE public.transaction_direction AS ENUM ('credit', 'debit');
CREATE TYPE public.transaction_category AS ENUM ('business_income', 'other_income');

-- Update the transactions table to use the new enum types
ALTER TABLE public.transactions
ALTER COLUMN direction TYPE public.transaction_direction USING direction::public.transaction_direction,
ALTER COLUMN category_override TYPE public.transaction_category USING category_override::public.transaction_category;

-- Recreate the income transactions view
CREATE OR REPLACE VIEW public.view_income_transactions AS
SELECT *
FROM public.transactions
WHERE 
  direction = 'credit'
  AND account_type IN ('chequing', 'savings')
  AND amount > 0;

-- Add indexes for better query performance
CREATE INDEX idx_transactions_direction ON public.transactions(direction);
CREATE INDEX idx_transactions_account_type ON public.transactions(account_type);
CREATE INDEX idx_transactions_user_id_direction ON public.transactions(user_id, direction);

-- Add a compound index for the income view filtering
CREATE INDEX idx_transactions_income_filter ON public.transactions(direction, account_type, amount) WHERE direction = 'credit' AND account_type IN ('chequing', 'savings');