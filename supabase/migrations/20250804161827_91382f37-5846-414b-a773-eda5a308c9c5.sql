-- Add "Meals & Entertainment" subcategory to "Office Expenses or Supplies" category
INSERT INTO public.category_subcategory_mapping (expense_type, expense_category, expense_subcategory)
VALUES ('business', 'Office Expenses or Supplies', 'Meals & Entertainment')
ON CONFLICT DO NOTHING;