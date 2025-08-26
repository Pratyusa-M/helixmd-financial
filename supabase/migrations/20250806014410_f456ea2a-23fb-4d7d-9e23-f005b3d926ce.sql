-- Update existing receipt_path values to remove leading slashes and ensure proper format
UPDATE public.transactions 
SET receipt_path = CASE 
  WHEN receipt_path LIKE '/%' THEN SUBSTRING(receipt_path FROM 2)
  ELSE receipt_path
END
WHERE receipt_path IS NOT NULL;