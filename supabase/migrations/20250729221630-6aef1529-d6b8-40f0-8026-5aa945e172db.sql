-- Fix storage.objects policies (receipts bucket)
DROP POLICY IF EXISTS "Users can upload their own receipts" ON storage.objects;
CREATE POLICY "Users can upload their own receipts" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' 
  AND (auth.uid())::text = (storage.foldername(name))[1] 
  AND lower(storage.extension(name)) = ANY (ARRAY['jpg'::text, 'jpeg'::text, 'png'::text, 'pdf'::text, 'gif'::text])
);

DROP POLICY IF EXISTS "Users can view their own receipts" ON storage.objects;
CREATE POLICY "Users can view their own receipts" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own receipts" ON storage.objects;
CREATE POLICY "Users can update their own receipts" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own receipts" ON storage.objects;
CREATE POLICY "Users can delete their own receipts" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'receipts' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);