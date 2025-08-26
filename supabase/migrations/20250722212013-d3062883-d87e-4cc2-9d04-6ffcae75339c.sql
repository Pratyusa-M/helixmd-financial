-- Create table to log MNP exports
CREATE TABLE public.mnp_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  number_of_transactions INTEGER NOT NULL DEFAULT 0,
  number_of_flagged_transactions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mnp_exports ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own MNP exports" 
ON public.mnp_exports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own MNP exports" 
ON public.mnp_exports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_mnp_exports_user_year ON public.mnp_exports(user_id, year);
CREATE INDEX idx_mnp_exports_timestamp ON public.mnp_exports(timestamp);