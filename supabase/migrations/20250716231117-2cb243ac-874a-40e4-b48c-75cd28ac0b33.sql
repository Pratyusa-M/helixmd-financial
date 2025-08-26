-- Add 'auto' method to tax_instalments method column
-- First check if we need to update the column type or if it's already flexible
ALTER TABLE public.tax_instalments 
ALTER COLUMN method TYPE TEXT;