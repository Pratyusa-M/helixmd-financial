-- Drop the view first
DROP VIEW IF EXISTS public.view_income_transactions;

-- Drop existing check constraints on direction and category_override
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_direction_check;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_category_override_check;

-- Create new enum types (drop first if they exist)
DROP TYPE IF EXISTS public.transaction_direction;
DROP TYPE IF EXISTS public.transaction_category;

CREATE TYPE public.transaction_direction AS ENUM ('credit', 'debit');
CREATE TYPE public.transaction_category AS ENUM ('business_income', 'other_income');

-- Update the column types
ALTER TABLE public.transactions 
ALTER COLUMN direction TYPE public.transaction_direction USING direction::public.transaction_direction;

ALTER TABLE public.transactions 
ALTER COLUMN category_override TYPE public.transaction_category USING category_override::public.transaction_category;

-- Recreate the view
CREATE VIEW public.view_income_transactions AS
SELECT *
FROM public.transactions
WHERE 
  direction = 'credit'
  AND account_type IN ('chequing', 'savings')
  AND amount > 0;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_transactions_direction ON public.transactions(direction);
CREATE INDEX IF NOT EXISTS idx_transactions_account_type ON public.transactions(account_type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_direction ON public.transactions(user_id, direction);