-- Fix security definer view by updating the view without SECURITY DEFINER
DROP VIEW IF EXISTS public.view_income_transactions;

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
  category_override,
  income_source,
  institution_name,
  account_name,
  account_type,
  receipt_url,
  created_at,
  plaid_raw
FROM public.transactions
WHERE direction = 'credit';

-- Fix function search paths by updating existing functions
CREATE OR REPLACE FUNCTION public.validate_expense_classification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- If subcategory is provided, ensure it's valid for the given category
    IF NEW.expense_subcategory IS NOT NULL AND NEW.expense_category IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.category_subcategory_mapping 
            WHERE expense_category = NEW.expense_category 
            AND expense_subcategory = NEW.expense_subcategory
            AND expense_type = NEW.expense_type
        ) THEN
            RAISE EXCEPTION 'Invalid subcategory "%" for category "%" and expense type "%"', 
                NEW.expense_subcategory, NEW.expense_category, NEW.expense_type;
        END IF;
    END IF;
    
    -- If category is provided, ensure it's valid for the expense type
    IF NEW.expense_category IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.category_subcategory_mapping 
            WHERE expense_category = NEW.expense_category 
            AND expense_type = NEW.expense_type
        ) THEN
            RAISE EXCEPTION 'Invalid category "%" for expense type "%"', 
                NEW.expense_category, NEW.expense_type;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_categorize_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    rule RECORD;
    description_lower TEXT;
    match_text_lower TEXT;
    is_match BOOLEAN := FALSE;
BEGIN
    -- Only run on INSERT (not UPDATE)
    IF TG_OP != 'INSERT' THEN
        RETURN NEW;
    END IF;
    
    -- Skip if user_id is null or description is null/empty
    IF NEW.user_id IS NULL OR NEW.description IS NULL OR trim(NEW.description) = '' THEN
        RETURN NEW;
    END IF;
    
    -- Skip if categories are already set (user has manually categorized)
    IF NEW.expense_category IS NOT NULL OR NEW.expense_subcategory IS NOT NULL OR NEW.income_source IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    -- Convert description to lowercase for case-insensitive matching
    description_lower := lower(NEW.description);
    
    -- Look up categorization rules for this user, ordered by creation date (first rules have priority)
    FOR rule IN 
        SELECT * FROM public.transaction_categorization_rules 
        WHERE user_id = NEW.user_id 
        ORDER BY created_at ASC
    LOOP
        match_text_lower := lower(rule.match_text);
        is_match := FALSE;
        
        -- Check for match based on match_type
        IF rule.match_type = 'contains' THEN
            is_match := description_lower LIKE '%' || match_text_lower || '%';
        ELSIF rule.match_type = 'equals' THEN
            is_match := description_lower = match_text_lower;
        END IF;
        
        -- If we found a match, apply the categorization
        IF is_match THEN
            -- Set the appropriate fields based on the rule type
            IF rule.type = 'business_expense' THEN
                NEW.expense_type := 'business';
                NEW.expense_category := rule.category::public.expense_category;
                IF rule.subcategory IS NOT NULL THEN
                    NEW.expense_subcategory := rule.subcategory::public.expense_subcategory;
                END IF;
            ELSIF rule.type = 'personal_expense' THEN
                NEW.expense_type := 'personal';
                NEW.expense_category := rule.category::public.expense_category;
                IF rule.subcategory IS NOT NULL THEN
                    NEW.expense_subcategory := rule.subcategory::public.expense_subcategory;
                END IF;
            ELSIF rule.type = 'business_income' THEN
                NEW.income_source := rule.category::public.income_source_type;
            END IF;
            
            -- Exit after first match (rules are processed in order of creation)
            EXIT;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$;