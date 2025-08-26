-- Fix transactions policies
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
CREATE POLICY "Users can insert their own transactions" 
ON public.transactions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
CREATE POLICY "Users can delete their own transactions" 
ON public.transactions 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
CREATE POLICY "Users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Fix vehicle_logs policies
DROP POLICY IF EXISTS "Users can create their own vehicle logs" ON public.vehicle_logs;
CREATE POLICY "Users can create their own vehicle logs" 
ON public.vehicle_logs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own vehicle logs" ON public.vehicle_logs;
CREATE POLICY "Users can delete their own vehicle logs" 
ON public.vehicle_logs 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own vehicle logs" ON public.vehicle_logs;
CREATE POLICY "Users can update their own vehicle logs" 
ON public.vehicle_logs 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own vehicle logs" ON public.vehicle_logs;
CREATE POLICY "Users can view their own vehicle logs" 
ON public.vehicle_logs 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);