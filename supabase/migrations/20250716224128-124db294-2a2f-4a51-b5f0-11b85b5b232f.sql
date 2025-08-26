-- Create tax_instalments table
CREATE TABLE public.tax_instalments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  method TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tax_instalments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user access control
CREATE POLICY "Users can view their own tax instalments" 
ON public.tax_instalments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tax instalments" 
ON public.tax_instalments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax instalments" 
ON public.tax_instalments 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax instalments" 
ON public.tax_instalments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_tax_instalments_user_id ON public.tax_instalments(user_id);
CREATE INDEX idx_tax_instalments_date ON public.tax_instalments(date);
CREATE INDEX idx_tax_instalments_method ON public.tax_instalments(method);