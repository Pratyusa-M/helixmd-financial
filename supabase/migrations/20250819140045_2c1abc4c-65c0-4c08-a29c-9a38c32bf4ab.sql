-- Add 'Internal Transfer' to the enum used by transactions.category_override
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'transaction_category' AND e.enumlabel = 'Internal Transfer'
  ) THEN
    ALTER TYPE public.transaction_category ADD VALUE 'Internal Transfer';
  END IF;
END$$;