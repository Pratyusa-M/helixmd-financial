-- Update transactions table to use absolute values for amounts and proper direction field

-- First, update the direction field based on the current amount values
UPDATE public.transactions 
SET direction = CASE 
  WHEN amount < 0 THEN 'debit'::public.transaction_direction
  ELSE 'credit'::public.transaction_direction
END;

-- Then update all amounts to be absolute values
UPDATE public.transactions 
SET amount = ABS(amount)
WHERE amount < 0;

-- Add a check constraint to ensure amounts are always positive going forward
ALTER TABLE public.transactions 
ADD CONSTRAINT check_amount_positive CHECK (amount >= 0);