-- Temporarily disable the validation trigger
ALTER TABLE transactions DISABLE TRIGGER validate_expense_classification_trigger;

-- Step 1: Remove old mapping (if it exists)
DELETE FROM category_subcategory_mapping
WHERE expense_category = 'Auto Expense' AND expense_subcategory = 'Parking';

-- Step 2: Ensure Parking category mappings exist
DELETE FROM category_subcategory_mapping
WHERE expense_category = 'Parking' AND expense_subcategory = 'Parking';

INSERT INTO category_subcategory_mapping (expense_category, expense_subcategory, expense_type)
VALUES 
  ('Parking', 'Parking', 'business'),
  ('Parking', 'Parking', 'personal');

-- Step 3: Update transactions to use the Parking category
UPDATE transactions
SET expense_category = 'Parking', expense_subcategory = 'Parking'
WHERE expense_subcategory = 'Parking';

-- Re-enable the validation trigger
ALTER TABLE transactions ENABLE TRIGGER validate_expense_classification_trigger;