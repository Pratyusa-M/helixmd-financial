-- Temporarily disable the validation trigger
ALTER TABLE transactions DISABLE TRIGGER validate_expense_classification_trigger;

-- Update any transactions rows using old Auto Expense > Parking structure
UPDATE transactions
SET expense_category = 'Parking', expense_subcategory = 'Parking'
WHERE expense_subcategory = 'Parking';

-- Optional cleanup – remove exact duplicates in the mapping table
DELETE FROM category_subcategory_mapping a
USING category_subcategory_mapping b
WHERE 
  a.ctid < b.ctid AND 
  a.expense_category = b.expense_category AND 
  a.expense_subcategory = b.expense_subcategory AND 
  a.expense_type = b.expense_type;

-- Add a unique index to enforce no duplicates going forward (if it doesn't exist)
CREATE UNIQUE INDEX IF NOT EXISTS unique_category_mapping 
ON category_subcategory_mapping (expense_category, expense_subcategory, expense_type);

-- Re-enable the validation trigger
ALTER TABLE transactions ENABLE TRIGGER validate_expense_classification_trigger;