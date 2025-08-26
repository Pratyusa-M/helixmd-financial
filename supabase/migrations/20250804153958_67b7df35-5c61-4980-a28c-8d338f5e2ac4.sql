-- Fix remaining security issues

-- 1. Check for any remaining Security Definer views and fix them
-- There seems to be another view with SECURITY DEFINER that wasn't fixed
-- Let's list all views first to identify the problematic one
DO $$
DECLARE
    view_name text;
BEGIN
    FOR view_name IN 
        SELECT schemaname||'.'||viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        RAISE NOTICE 'Found view: %', view_name;
    END LOOP;
END $$;

-- 2. Fix storage policies to require authentication
DROP POLICY IF EXISTS "Users can view their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own receipts" ON storage.objects;

-- Create proper storage policies that require authentication
CREATE POLICY "Authenticated users can view their own receipts" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can upload their own receipts" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can update their own receipts" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can delete their own receipts" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);