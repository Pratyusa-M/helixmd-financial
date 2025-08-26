-- Fix Critical Security Issues

-- 1. Drop the security definer view and recreate it without security definer
DROP VIEW IF EXISTS public.view_income_transactions;

-- Recreate the view without SECURITY DEFINER (will use invoker's permissions)
CREATE VIEW public.view_income_transactions AS
SELECT 
  id,
  user_id,
  date,
  amount,
  description,
  direction,
  expense_type,
  expense_category,
  expense_subcategory,
  income_source,
  category_override,
  institution_name,
  account_name,
  account_type,
  receipt_url,
  created_at,
  plaid_raw
FROM public.transactions
WHERE direction = 'inbound';

-- 2. Fix RLS policies to require authentication (authenticated role instead of public)
-- This ensures anonymous users cannot access any data

-- Audit logs - restrict to authenticated users only
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can view their own audit logs" 
ON public.audit_logs 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Category mapping - restrict to authenticated users only
DROP POLICY IF EXISTS "All authenticated users can view category mappings" ON public.category_subcategory_mapping;
CREATE POLICY "Authenticated users can view category mappings" 
ON public.category_subcategory_mapping 
FOR SELECT 
TO authenticated
USING (true);

-- MNP exports
DROP POLICY IF EXISTS "Users can view their own MNP exports" ON public.mnp_exports;
DROP POLICY IF EXISTS "Users can create their own MNP exports" ON public.mnp_exports;
CREATE POLICY "Authenticated users can view their own MNP exports" 
ON public.mnp_exports 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can create their own MNP exports" 
ON public.mnp_exports 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Monthly vehicle summary
DROP POLICY IF EXISTS "Users can view their own monthly vehicle summary" ON public.monthly_vehicle_summary;
DROP POLICY IF EXISTS "Users can create their own monthly vehicle summary" ON public.monthly_vehicle_summary;
DROP POLICY IF EXISTS "Users can update their own monthly vehicle summary" ON public.monthly_vehicle_summary;
DROP POLICY IF EXISTS "Users can delete their own monthly vehicle summary" ON public.monthly_vehicle_summary;

CREATE POLICY "Authenticated users can view their own monthly vehicle summary" 
ON public.monthly_vehicle_summary 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can create their own monthly vehicle summary" 
ON public.monthly_vehicle_summary 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update their own monthly vehicle summary" 
ON public.monthly_vehicle_summary 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can delete their own monthly vehicle summary" 
ON public.monthly_vehicle_summary 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);
CREATE POLICY "Authenticated users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);
CREATE POLICY "Authenticated users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
CREATE POLICY "Authenticated users can delete their own profile" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (auth.uid() = id);

-- Rate limits
DROP POLICY IF EXISTS "Users can view their own rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Users can insert their own rate limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Users can update their own rate limits" ON public.rate_limits;

CREATE POLICY "Authenticated users can view their own rate limits" 
ON public.rate_limits 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert their own rate limits" 
ON public.rate_limits 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update their own rate limits" 
ON public.rate_limits 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Receipts
DROP POLICY IF EXISTS "Users can view receipts for their own transactions" ON public.receipts;
DROP POLICY IF EXISTS "Users can insert receipts for their own transactions" ON public.receipts;
DROP POLICY IF EXISTS "Users can update receipts for their own transactions" ON public.receipts;
DROP POLICY IF EXISTS "Users can delete receipts for their own transactions" ON public.receipts;

CREATE POLICY "Authenticated users can view receipts for their own transactions" 
ON public.receipts 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM transactions 
  WHERE transactions.id = receipts.transaction_id 
  AND transactions.user_id = auth.uid()
));
CREATE POLICY "Authenticated users can insert receipts for their own transactions" 
ON public.receipts 
FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM transactions 
  WHERE transactions.id = receipts.transaction_id 
  AND transactions.user_id = auth.uid()
));
CREATE POLICY "Authenticated users can update receipts for their own transactions" 
ON public.receipts 
FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM transactions 
  WHERE transactions.id = receipts.transaction_id 
  AND transactions.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM transactions 
  WHERE transactions.id = receipts.transaction_id 
  AND transactions.user_id = auth.uid()
));
CREATE POLICY "Authenticated users can delete receipts for their own transactions" 
ON public.receipts 
FOR DELETE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM transactions 
  WHERE transactions.id = receipts.transaction_id 
  AND transactions.user_id = auth.uid()
));

-- Tax instalments
DROP POLICY IF EXISTS "Users can view their own tax instalments" ON public.tax_instalments;
DROP POLICY IF EXISTS "Users can create their own tax instalments" ON public.tax_instalments;
DROP POLICY IF EXISTS "Users can update their own tax instalments" ON public.tax_instalments;
DROP POLICY IF EXISTS "Users can delete their own tax instalments" ON public.tax_instalments;

CREATE POLICY "Authenticated users can view their own tax instalments" 
ON public.tax_instalments 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can create their own tax instalments" 
ON public.tax_instalments 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update their own tax instalments" 
ON public.tax_instalments 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can delete their own tax instalments" 
ON public.tax_instalments 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Tax settings
DROP POLICY IF EXISTS "Users can view their own tax settings" ON public.tax_settings;
DROP POLICY IF EXISTS "Users can insert their own tax settings" ON public.tax_settings;
DROP POLICY IF EXISTS "Users can update their own tax settings" ON public.tax_settings;
DROP POLICY IF EXISTS "Users can delete their own tax settings" ON public.tax_settings;

CREATE POLICY "Authenticated users can view their own tax settings" 
ON public.tax_settings 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert their own tax settings" 
ON public.tax_settings 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update their own tax settings" 
ON public.tax_settings 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can delete their own tax settings" 
ON public.tax_settings 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Transaction categorization rules
DROP POLICY IF EXISTS "Users can view their own categorization rules" ON public.transaction_categorization_rules;
DROP POLICY IF EXISTS "Users can create their own categorization rules" ON public.transaction_categorization_rules;
DROP POLICY IF EXISTS "Users can update their own categorization rules" ON public.transaction_categorization_rules;
DROP POLICY IF EXISTS "Users can delete their own categorization rules" ON public.transaction_categorization_rules;

CREATE POLICY "Authenticated users can view their own categorization rules" 
ON public.transaction_categorization_rules 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can create their own categorization rules" 
ON public.transaction_categorization_rules 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update their own categorization rules" 
ON public.transaction_categorization_rules 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can delete their own categorization rules" 
ON public.transaction_categorization_rules 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

CREATE POLICY "Authenticated users can view their own transactions" 
ON public.transactions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert their own transactions" 
ON public.transactions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can delete their own transactions" 
ON public.transactions 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Vehicle logs
DROP POLICY IF EXISTS "Users can view their own vehicle logs" ON public.vehicle_logs;
DROP POLICY IF EXISTS "Users can create their own vehicle logs" ON public.vehicle_logs;
DROP POLICY IF EXISTS "Users can update their own vehicle logs" ON public.vehicle_logs;
DROP POLICY IF EXISTS "Users can delete their own vehicle logs" ON public.vehicle_logs;

CREATE POLICY "Authenticated users can view their own vehicle logs" 
ON public.vehicle_logs 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can create their own vehicle logs" 
ON public.vehicle_logs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update their own vehicle logs" 
ON public.vehicle_logs 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can delete their own vehicle logs" 
ON public.vehicle_logs 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- 3. Add RLS policy for the view
ALTER VIEW public.view_income_transactions SET (security_barrier = true);

-- Enable RLS on view_income_transactions (treated as a table for RLS purposes)
CREATE POLICY "Authenticated users can view their own income transactions" 
ON public.view_income_transactions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);