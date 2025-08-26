-- Drop the deprecated receipt_url column from transactions table
ALTER TABLE public.transactions DROP COLUMN IF EXISTS receipt_url;