-- Check existing constraints on the direction column
SELECT conname, contype, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.transactions'::regclass 
AND conname LIKE '%direction%';

-- Check existing indexes that might be blocking
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'transactions' 
AND schemaname = 'public';