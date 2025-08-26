-- Update transactions that currently have Parking under Auto Expense to use new Parking category
UPDATE transactions 
SET expense_category = 'Parking', expense_subcategory = 'Parking'
WHERE expense_category = 'Auto Expense' AND expense_subcategory = 'Parking';