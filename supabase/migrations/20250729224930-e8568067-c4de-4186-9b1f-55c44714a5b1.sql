-- Add other_credits field to tax_settings table
ALTER TABLE public.tax_settings 
ADD COLUMN other_credits numeric DEFAULT 0;