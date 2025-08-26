-- Step 1: Remove old mapping
DELETE FROM category_subcategory_mapping
WHERE expense_category = 'Auto Expense' AND expense_subcategory = 'Parking';

-- Step 2: Add new category-subcategory mappings
INSERT INTO category_subcategory_mapping (expense_category, expense_subcategory, expense_type)
VALUES 
  ('Parking', 'Parking', 'business'),
  ('Parking', 'Parking', 'personal')
ON CONFLICT (expense_category, expense_subcategory, expense_type) DO NOTHING;

-- Step 3: Update transactions
UPDATE transactions
SET expense_category = 'Parking', expense_subcategory = 'Parking'
WHERE expense_subcategory = 'Parking';