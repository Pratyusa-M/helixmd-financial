
-- Enable RLS policies for profiles table
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" 
  ON public.profiles 
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = id);

-- Enable RLS policies for transactions table
CREATE POLICY "Users can view their own transactions" 
  ON public.transactions 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" 
  ON public.transactions 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" 
  ON public.transactions 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" 
  ON public.transactions 
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable RLS policies for receipts table (requires join with transactions)
CREATE POLICY "Users can view receipts for their own transactions" 
  ON public.receipts 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions 
      WHERE transactions.id = receipts.transaction_id 
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert receipts for their own transactions" 
  ON public.receipts 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions 
      WHERE transactions.id = receipts.transaction_id 
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update receipts for their own transactions" 
  ON public.receipts 
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions 
      WHERE transactions.id = receipts.transaction_id 
      AND transactions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions 
      WHERE transactions.id = receipts.transaction_id 
      AND transactions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete receipts for their own transactions" 
  ON public.receipts 
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions 
      WHERE transactions.id = receipts.transaction_id 
      AND transactions.user_id = auth.uid()
    )
  );

-- Enable RLS policies for tax_settings table
CREATE POLICY "Users can view their own tax settings" 
  ON public.tax_settings 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax settings" 
  ON public.tax_settings 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax settings" 
  ON public.tax_settings 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax settings" 
  ON public.tax_settings 
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);
