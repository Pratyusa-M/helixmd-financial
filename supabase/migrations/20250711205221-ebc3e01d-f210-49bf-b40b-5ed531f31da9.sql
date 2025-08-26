-- Create ENUM types for the new table
CREATE TYPE public.match_type AS ENUM ('contains', 'equals');
CREATE TYPE public.categorization_type AS ENUM ('business_income', 'business_expense', 'personal_expense');

-- Create the transaction_categorization_rules table
CREATE TABLE public.transaction_categorization_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    match_type public.match_type NOT NULL,
    match_text TEXT NOT NULL,
    type public.categorization_type NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Create indexes for performance
CREATE INDEX idx_transaction_categorization_rules_user_id ON public.transaction_categorization_rules(user_id);
CREATE INDEX idx_transaction_categorization_rules_match_text ON public.transaction_categorization_rules(match_text);
CREATE INDEX idx_transaction_categorization_rules_type ON public.transaction_categorization_rules(type);

-- Enable Row Level Security
ALTER TABLE public.transaction_categorization_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own categorization rules"
ON public.transaction_categorization_rules
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categorization rules"
ON public.transaction_categorization_rules
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categorization rules"
ON public.transaction_categorization_rules
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categorization rules"
ON public.transaction_categorization_rules
FOR DELETE
USING (auth.uid() = user_id);