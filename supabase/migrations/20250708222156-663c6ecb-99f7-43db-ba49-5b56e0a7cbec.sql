-- Add Plaid-specific columns to transactions table for storing raw metadata

ALTER TABLE public.transactions 
ADD COLUMN plaid_transaction_id text,
ADD COLUMN plaid_account_id text,
ADD COLUMN plaid_category_raw text[],
ADD COLUMN plaid_pending boolean;

-- Note: plaid_raw (jsonb) column already exists in the table