-- Add source column to tax_instalments table
ALTER TABLE public.tax_instalments
ADD COLUMN source TEXT DEFAULT 'manual';