-- Add new expense_type column
ALTER TABLE public.transactions 
ADD COLUMN expense_type text DEFAULT 'personal';

-- Migrate existing data from is_business_expense to expense_type
UPDATE public.transactions 
SET expense_type = CASE 
  WHEN is_business_expense = true THEN 'business'
  ELSE 'personal'
END;

-- Make expense_type non-nullable now that we have data
ALTER TABLE public.transactions 
ALTER COLUMN expense_type SET NOT NULL;

-- Drop the old boolean column
ALTER TABLE public.transactions 
DROP COLUMN is_business_expense;