-- Create enum for instalment method
CREATE TYPE public.instalment_method AS ENUM ('safe_harbour', 'estimate', 'not_required');

-- Add instalment_method column to tax_settings
ALTER TABLE public.tax_settings 
ADD COLUMN instalment_method public.instalment_method DEFAULT 'not_required';

-- Add safe_harbour_total_tax_last_year column
ALTER TABLE public.tax_settings 
ADD COLUMN safe_harbour_total_tax_last_year numeric;