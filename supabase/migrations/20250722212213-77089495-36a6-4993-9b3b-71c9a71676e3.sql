-- Enable RLS on tables that don't have it enabled
ALTER TABLE public.category_subcategory_mapping ENABLE ROW LEVEL SECURITY;

-- Create a policy for category_subcategory_mapping to allow read access to all authenticated users
-- since this is reference data that all users need to access
CREATE POLICY "All authenticated users can view category mappings" 
ON public.category_subcategory_mapping 
FOR SELECT 
USING (auth.role() = 'authenticated');