-- Fix Security Definer View Issue
-- Drop the existing view and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.view_income_transactions;

-- Recreate the view without SECURITY DEFINER to respect RLS policies
-- Use 'credit' instead of 'incoming' for the direction enum
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
WHERE direction = 'credit';

-- The view inherits RLS from the underlying transactions table automatically
-- No need to add additional policies as the base table already has proper RLS

-- Create storage bucket for receipts with proper security
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for receipt uploads
CREATE POLICY "Users can view their own receipts" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own receipts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (lower(storage.extension(name)) = ANY(ARRAY['jpg', 'jpeg', 'png', 'pdf', 'gif']))
);

CREATE POLICY "Users can update their own receipts" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own receipts" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);