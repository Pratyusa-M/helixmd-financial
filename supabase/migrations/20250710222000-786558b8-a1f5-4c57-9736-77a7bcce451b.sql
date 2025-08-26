-- Add Parking category mappings to allow null subcategory
INSERT INTO category_subcategory_mapping (expense_category, expense_subcategory, expense_type)
VALUES 
  ('Parking', 'Parking', 'business'),
  ('Parking', 'Parking', 'personal');