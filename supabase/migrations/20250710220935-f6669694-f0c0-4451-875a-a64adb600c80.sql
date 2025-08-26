-- Step 1: Remove old mapping
DELETE FROM category_subcategory_mapping
WHERE expense_category = 'Auto Expense' AND expense_subcategory = 'Parking';

-- Step 2: Add new category-subcategory mappings only if they don't exist
INSERT INTO category_subcategory_mapping (expense_category, expense_subcategory, expense_type)
SELECT 'Parking', 'Parking', 'business'
WHERE NOT EXISTS (
    SELECT 1 FROM category_subcategory_mapping 
    WHERE expense_category = 'Parking' AND expense_subcategory = 'Parking' AND expense_type = 'business'
);

INSERT INTO category_subcategory_mapping (expense_category, expense_subcategory, expense_type)
SELECT 'Parking', 'Parking', 'personal'
WHERE NOT EXISTS (
    SELECT 1 FROM category_subcategory_mapping 
    WHERE expense_category = 'Parking' AND expense_subcategory = 'Parking' AND expense_type = 'personal'
);

-- Step 3: Update transactions
UPDATE transactions
SET expense_category = 'Parking', expense_subcategory = 'Parking'
WHERE expense_subcategory = 'Parking';