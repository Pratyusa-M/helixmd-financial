-- Add receipt_path field to transactions table
ALTER TABLE public.transactions ADD COLUMN receipt_path TEXT;

-- Update existing records that have receipt_url to extract the path
UPDATE public.transactions 
SET receipt_path = 
  CASE 
    WHEN receipt_url IS NOT NULL AND receipt_url LIKE '%/receipts/%' 
    THEN SUBSTRING(receipt_url FROM '/receipts/.*')
    ELSE NULL
  END
WHERE receipt_url IS NOT NULL;