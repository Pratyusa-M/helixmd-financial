UPDATE public.transactions
SET expense_subcategory = NULL
WHERE expense_subcategory = 'none';