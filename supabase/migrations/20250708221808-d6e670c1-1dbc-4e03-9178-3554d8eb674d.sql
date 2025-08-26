-- Fix invalid category combinations first, then update amounts and direction

-- Step 1: Fix invalid expense category combinations
-- Set personal transactions with "Personal" category to NULL category since "Personal" category 
-- is only valid for business expense type according to our mapping
UPDATE public.transactions 
SET expense_category = NULL, expense_subcategory = NULL
WHERE expense_type = 'personal' AND expense_category = 'Personal';

-- Step 2: Update the direction field based on the current amount values
UPDATE public.transactions 
SET direction = CASE 
  WHEN amount < 0 THEN 'debit'::public.transaction_direction
  ELSE 'credit'::public.transaction_direction
END;

-- Step 3: Update all amounts to be absolute values
UPDATE public.transactions 
SET amount = ABS(amount)
WHERE amount < 0;

-- Step 4: Add a check constraint to ensure amounts are always positive going forward
ALTER TABLE public.transactions 
ADD CONSTRAINT check_amount_positive CHECK (amount >= 0);