-- Fix category_subcategory_mapping policy
DROP POLICY IF EXISTS "All authenticated users can view category mappings" ON public.category_subcategory_mapping;
CREATE POLICY "All authenticated users can view category mappings" 
ON public.category_subcategory_mapping 
FOR SELECT 
TO authenticated
USING (true);

-- Fix mnp_exports policies
DROP POLICY IF EXISTS "Users can create their own MNP exports" ON public.mnp_exports;
CREATE POLICY "Users can create their own MNP exports" 
ON public.mnp_exports 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own MNP exports" ON public.mnp_exports;
CREATE POLICY "Users can view their own MNP exports" 
ON public.mnp_exports 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Fix monthly_vehicle_summary policies
DROP POLICY IF EXISTS "Users can create their own monthly vehicle summary" ON public.monthly_vehicle_summary;
CREATE POLICY "Users can create their own monthly vehicle summary" 
ON public.monthly_vehicle_summary 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own monthly vehicle summary" ON public.monthly_vehicle_summary;
CREATE POLICY "Users can delete their own monthly vehicle summary" 
ON public.monthly_vehicle_summary 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own monthly vehicle summary" ON public.monthly_vehicle_summary;
CREATE POLICY "Users can update their own monthly vehicle summary" 
ON public.monthly_vehicle_summary 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own monthly vehicle summary" ON public.monthly_vehicle_summary;
CREATE POLICY "Users can view their own monthly vehicle summary" 
ON public.monthly_vehicle_summary 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);