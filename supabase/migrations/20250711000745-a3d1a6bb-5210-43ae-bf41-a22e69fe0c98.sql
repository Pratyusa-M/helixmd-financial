-- Create enum for income source types
CREATE TYPE public.income_source_type AS ENUM (
  'OHIP',
  'Fee for Service/Locum',
  'Honoraria',
  'AFP Funding',
  'ER/On-Call Coverage',
  'Recruiting Bonus',
  'Stipend',
  'CMPA Reimbursements',
  'Other'
);

-- Add income_source column to transactions table
ALTER TABLE public.transactions
ADD COLUMN income_source public.income_source_type;

-- Add index for better performance on income_source filtering
CREATE INDEX idx_transactions_income_source ON public.transactions(income_source);