-- Drop the old unique constraint
ALTER TABLE category_subcategory_mapping 
DROP CONSTRAINT category_subcategory_mapping_expense_category_expense_subca_key;

-- Add the correct unique constraint that includes expense_type
ALTER TABLE category_subcategory_mapping 
ADD CONSTRAINT category_subcategory_mapping_unique 
UNIQUE (expense_category, expense_subcategory, expense_type);

-- Now add the Parking mappings
INSERT INTO category_subcategory_mapping (expense_category, expense_subcategory, expense_type)
VALUES 
  ('Parking', 'Parking', 'business'),
  ('Parking', 'Parking', 'personal');