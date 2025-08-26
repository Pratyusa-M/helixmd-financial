-- Fix tax_instalments policies
DROP POLICY IF EXISTS "Users can create their own tax instalments" ON public.tax_instalments;
CREATE POLICY "Users can create their own tax instalments" 
ON public.tax_instalments 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tax instalments" ON public.tax_instalments;
CREATE POLICY "Users can delete their own tax instalments" 
ON public.tax_instalments 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tax instalments" ON public.tax_instalments;
CREATE POLICY "Users can update their own tax instalments" 
ON public.tax_instalments 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own tax instalments" ON public.tax_instalments;
CREATE POLICY "Users can view their own tax instalments" 
ON public.tax_instalments 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Fix transaction_categorization_rules policies
DROP POLICY IF EXISTS "Users can create their own categorization rules" ON public.transaction_categorization_rules;
CREATE POLICY "Users can create their own categorization rules" 
ON public.transaction_categorization_rules 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own categorization rules" ON public.transaction_categorization_rules;
CREATE POLICY "Users can delete their own categorization rules" 
ON public.transaction_categorization_rules 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own categorization rules" ON public.transaction_categorization_rules;
CREATE POLICY "Users can update their own categorization rules" 
ON public.transaction_categorization_rules 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own categorization rules" ON public.transaction_categorization_rules;
CREATE POLICY "Users can view their own categorization rules" 
ON public.transaction_categorization_rules 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);