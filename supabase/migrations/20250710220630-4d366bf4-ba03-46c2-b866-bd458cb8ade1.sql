-- Check if Parking category exists and add if it doesn't
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