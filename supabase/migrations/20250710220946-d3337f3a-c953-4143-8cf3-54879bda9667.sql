-- Step 1: Remove old mapping (if it exists)
DELETE FROM category_subcategory_mapping
WHERE expense_category = 'Auto Expense' AND expense_subcategory = 'Parking';

-- Step 2: Update transactions to use the Parking category
UPDATE transactions
SET expense_category = 'Parking', expense_subcategory = 'Parking'
WHERE expense_subcategory = 'Parking';