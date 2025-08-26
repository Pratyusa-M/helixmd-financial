-- Add Parking as its own category (no subcategories needed)
INSERT INTO category_subcategory_mapping (expense_category, expense_subcategory, expense_type)
VALUES ('Parking', 'Parking', 'business');

INSERT INTO category_subcategory_mapping (expense_category, expense_subcategory, expense_type)
VALUES ('Parking', 'Parking', 'personal');