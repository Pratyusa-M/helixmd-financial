-- Remove Parking from Auto Expense subcategories  
DELETE FROM category_subcategory_mapping 
WHERE expense_subcategory = 'Parking' AND expense_category = 'Auto Expense';