-- Create ENUMs for the 3-level expense classification system

-- 1. Create expense_type enum
CREATE TYPE public.expense_type AS ENUM (
    'business',
    'personal'
);

-- 2. Create expense_category enum
CREATE TYPE public.expense_category AS ENUM (
    'CME',
    'Fees & Insurance',
    'Office Expenses or Supplies',
    'Auto Expense',
    'Shared Business',
    'Personal'
);

-- 3. Create expense_subcategory enum
CREATE TYPE public.expense_subcategory AS ENUM (
    -- Business → CME
    'Books, Subscriptions, Journals',
    'Professional Development/CME',
    'Travel & Conference',
    'Meals & Entertainment',
    
    -- Business → Fees & Insurance
    'CMPA Insurance',
    'Insurance - Prof Overhead Expense',
    'Professional Association Fees',
    'Private Health Plan Premiums',
    'Accounting & Legal',
    'Bank Fees or Interest',
    'Insurance - Home Office',
    
    -- Business → Office Expenses or Supplies
    'Capital Assets (Computer, Desk etc)',
    'Office Supplies',
    'Salary to Secretary',
    'Shared Overhead',
    'Patient Medical/Drug Supplies',
    'Gifts for Staff/Colleagues',
    'Office - Telecom',
    'Office - Internet',
    'Meals & Entertainment (Office)',
    'Insurance - Office',
    
    -- Business → Auto Expense
    'Gas',
    'Repairs',
    'Insurance (Auto)',
    'Licensing Fees',
    'Parking',
    'Finance/Lease Payment',
    
    -- Personal → Shared Business
    'Rent/Mortgage',
    'Hydro',
    'Gas (Utilities)',
    'Hot Water Heater',
    'Property Tax',
    'Water',
    'Home Insurance',
    'Cleaning Service',
    'Other'
);

-- 4. Create a lookup table to enforce category-subcategory relationships
CREATE TABLE public.category_subcategory_mapping (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_type public.expense_type NOT NULL,
    expense_category public.expense_category NOT NULL,
    expense_subcategory public.expense_subcategory NOT NULL,
    UNIQUE(expense_category, expense_subcategory)
);

-- 5. Insert the valid category-subcategory mappings
INSERT INTO public.category_subcategory_mapping (expense_type, expense_category, expense_subcategory) VALUES
-- Business → CME
('business', 'CME', 'Books, Subscriptions, Journals'),
('business', 'CME', 'Professional Development/CME'),
('business', 'CME', 'Travel & Conference'),
('business', 'CME', 'Meals & Entertainment'),

-- Business → Fees & Insurance
('business', 'Fees & Insurance', 'CMPA Insurance'),
('business', 'Fees & Insurance', 'Insurance - Prof Overhead Expense'),
('business', 'Fees & Insurance', 'Professional Association Fees'),
('business', 'Fees & Insurance', 'Private Health Plan Premiums'),
('business', 'Fees & Insurance', 'Accounting & Legal'),
('business', 'Fees & Insurance', 'Bank Fees or Interest'),
('business', 'Fees & Insurance', 'Insurance - Home Office'),

-- Business → Office Expenses or Supplies
('business', 'Office Expenses or Supplies', 'Capital Assets (Computer, Desk etc)'),
('business', 'Office Expenses or Supplies', 'Office Supplies'),
('business', 'Office Expenses or Supplies', 'Salary to Secretary'),
('business', 'Office Expenses or Supplies', 'Shared Overhead'),
('business', 'Office Expenses or Supplies', 'Patient Medical/Drug Supplies'),
('business', 'Office Expenses or Supplies', 'Gifts for Staff/Colleagues'),
('business', 'Office Expenses or Supplies', 'Office - Telecom'),
('business', 'Office Expenses or Supplies', 'Office - Internet'),
('business', 'Office Expenses or Supplies', 'Meals & Entertainment (Office)'),
('business', 'Office Expenses or Supplies', 'Insurance - Office'),

-- Business → Auto Expense
('business', 'Auto Expense', 'Gas'),
('business', 'Auto Expense', 'Repairs'),
('business', 'Auto Expense', 'Insurance (Auto)'),
('business', 'Auto Expense', 'Licensing Fees'),
('business', 'Auto Expense', 'Parking'),
('business', 'Auto Expense', 'Finance/Lease Payment'),

-- Personal → Shared Business
('personal', 'Shared Business', 'Rent/Mortgage'),
('personal', 'Shared Business', 'Hydro'),
('personal', 'Shared Business', 'Gas (Utilities)'),
('personal', 'Shared Business', 'Hot Water Heater'),
('personal', 'Shared Business', 'Property Tax'),
('personal', 'Shared Business', 'Water'),
('personal', 'Shared Business', 'Home Insurance'),
('personal', 'Shared Business', 'Cleaning Service'),
('personal', 'Shared Business', 'Other');

-- 6. Drop the view that depends on the columns we need to change
DROP VIEW IF EXISTS public.view_income_transactions;

-- 7. Update transactions table to use the new ENUMs
-- First, add new columns
ALTER TABLE public.transactions 
ADD COLUMN new_expense_type public.expense_type,
ADD COLUMN new_expense_category public.expense_category,
ADD COLUMN new_expense_subcategory public.expense_subcategory;

-- 8. Migrate existing data
-- Convert existing expense_type values
UPDATE public.transactions 
SET new_expense_type = CASE 
    WHEN expense_type = 'business' THEN 'business'::public.expense_type
    WHEN expense_type = 'personal' THEN 'personal'::public.expense_type
    ELSE 'personal'::public.expense_type -- default to personal for any other values
END;

-- Convert existing category values where possible
UPDATE public.transactions 
SET new_expense_category = CASE 
    WHEN category = 'CME' THEN 'CME'::public.expense_category
    WHEN category = 'Fees & Insurance' THEN 'Fees & Insurance'::public.expense_category
    WHEN category = 'Office Expenses or Supplies' THEN 'Office Expenses or Supplies'::public.expense_category
    WHEN category = 'Auto Expense' THEN 'Auto Expense'::public.expense_category
    WHEN category = 'Shared Business' THEN 'Shared Business'::public.expense_category
    WHEN category = 'Personal' THEN 'Personal'::public.expense_category
    ELSE NULL
END;

-- Convert subcategory values where they match exactly
UPDATE public.transactions 
SET new_expense_subcategory = subcategory::public.expense_subcategory
WHERE subcategory IS NOT NULL 
AND subcategory IN (
    'Books, Subscriptions, Journals', 'Professional Development/CME', 'Travel & Conference', 'Meals & Entertainment',
    'CMPA Insurance', 'Insurance - Prof Overhead Expense', 'Professional Association Fees', 'Private Health Plan Premiums',
    'Accounting & Legal', 'Bank Fees or Interest', 'Insurance - Home Office',
    'Capital Assets (Computer, Desk etc)', 'Office Supplies', 'Salary to Secretary', 'Shared Overhead',
    'Patient Medical/Drug Supplies', 'Gifts for Staff/Colleagues', 'Office - Telecom', 'Office - Internet',
    'Meals & Entertainment (Office)', 'Insurance - Office',
    'Gas', 'Repairs', 'Insurance (Auto)', 'Licensing Fees', 'Parking', 'Finance/Lease Payment',
    'Rent/Mortgage', 'Hydro', 'Gas (Utilities)', 'Hot Water Heater', 'Property Tax', 'Water',
    'Home Insurance', 'Cleaning Service', 'Other'
);

-- 9. Drop old columns and rename new ones
ALTER TABLE public.transactions 
DROP COLUMN expense_type,
DROP COLUMN category,
DROP COLUMN subcategory;

ALTER TABLE public.transactions 
RENAME COLUMN new_expense_type TO expense_type;

ALTER TABLE public.transactions 
RENAME COLUMN new_expense_category TO expense_category;

ALTER TABLE public.transactions 
RENAME COLUMN new_expense_subcategory TO expense_subcategory;

-- 10. Make expense_type NOT NULL and set default
ALTER TABLE public.transactions 
ALTER COLUMN expense_type SET NOT NULL,
ALTER COLUMN expense_type SET DEFAULT 'personal'::public.expense_type;

-- 11. Recreate the income transactions view with new column types
CREATE VIEW public.view_income_transactions AS
SELECT 
    id,
    user_id,
    date,
    institution_name,
    account_name,
    description,
    amount,
    expense_type,
    expense_category,
    expense_subcategory,
    receipt_url,
    created_at,
    direction,
    account_type,
    plaid_raw,
    category_override
FROM public.transactions
WHERE amount > 0 AND expense_type = 'personal';

-- 12. Create a function to validate category-subcategory relationships
CREATE OR REPLACE FUNCTION public.validate_expense_classification()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- 13. Create trigger to enforce the validation
CREATE TRIGGER validate_expense_classification_trigger
    BEFORE INSERT OR UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_expense_classification();