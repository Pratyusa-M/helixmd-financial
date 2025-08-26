
-- Add new columns to the transactions table
ALTER TABLE public.transactions 
ADD COLUMN direction TEXT CHECK (direction IN ('credit', 'debit')),
ADD COLUMN account_type TEXT,
ADD COLUMN plaid_raw JSONB,
ADD COLUMN category_override TEXT CHECK (category_override IN ('business_income', 'other_income'));

-- Update existing mock data to include direction and account_type
UPDATE public.transactions 
SET 
  direction = CASE 
    WHEN amount > 0 THEN 'credit' 
    ELSE 'debit' 
  END,
  account_type = CASE 
    WHEN account_name ILIKE '%chequing%' OR account_name ILIKE '%checking%' THEN 'chequing'
    WHEN account_name ILIKE '%savings%' THEN 'savings'
    WHEN account_name ILIKE '%credit%' THEN 'credit_card'
    ELSE 'chequing'
  END;

-- Make direction and account_type NOT NULL after updating existing data
ALTER TABLE public.transactions 
ALTER COLUMN direction SET NOT NULL,
ALTER COLUMN account_type SET NOT NULL;

-- Create the income transactions view
CREATE OR REPLACE VIEW public.view_income_transactions AS
SELECT *
FROM public.transactions
WHERE 
  direction = 'credit'
  AND account_type IN ('chequing', 'savings')
  AND amount > 0;

-- Add RLS policy for the view (views inherit RLS from base tables, but being explicit)
-- Note: Views automatically inherit RLS policies from their base tables
