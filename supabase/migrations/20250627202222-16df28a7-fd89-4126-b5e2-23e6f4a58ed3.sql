
-- Fix sample transaction data by removing NULL user_id entries and adding proper user-linked data
-- First, delete any transactions with NULL user_id (from the previous migration)
DELETE FROM public.transactions WHERE user_id IS NULL;

-- Insert sample transaction data with your specific user_id
INSERT INTO public.transactions (
  user_id,
  date,
  institution_name,
  account_name,
  description,
  amount,
  is_business_expense,
  category
) VALUES
  -- Income transactions (positive amounts)
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-06-15', 'RBC', 'Business Chequing', 'Professional Services - June', 8500.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-06-10', 'TD Bank', 'Practice Account', 'Consultation Fees', 1200.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-06-08', 'RBC', 'Business Chequing', 'Emergency Call Fee', 450.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-06-01', 'RBC', 'Business Chequing', 'Professional Services - Clinic', 12500.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-05-28', 'TD Bank', 'Practice Account', 'Telehealth Consultations', 2100.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-05-15', 'RBC', 'Business Chequing', 'Professional Services - May', 9200.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-04-30', 'TD Bank', 'Practice Account', 'Weekend Clinic', 3400.00, false, null),
  
  -- Business expense transactions (negative amounts)
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-06-20', 'Shell', 'Business Credit Card', 'Fuel for house calls', -85.50, true, 'Fuel'),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-06-18', 'Medical Conference Inc', 'Business Credit Card', 'CME Conference Registration', -1200.00, true, 'CME'),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-06-15', 'Downtown Parking', 'Business Credit Card', 'Hospital parking', -15.00, true, 'Parking'),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-06-12', 'The Keg', 'Business Credit Card', 'Client dinner meeting', -180.75, true, 'Meals'),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-06-10', 'Staples', 'Business Credit Card', 'Office supplies and forms', -67.89, true, 'Office Supplies'),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-06-08', 'Legal Associates', 'Business Credit Card', 'Legal consultation', -450.00, true, 'Professional Fees'),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-06-05', 'Medical Equipment Co', 'Business Credit Card', 'Stethoscope replacement', -320.00, true, 'Equipment'),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-06-01', 'Microsoft', 'Business Credit Card', 'Office 365 subscription', -29.99, true, 'Software'),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-05-30', 'Petro-Canada', 'Business Credit Card', 'Fuel for conferences', -92.35, true, 'Fuel'),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-05-25', 'Medical Journal Subscription', 'Business Credit Card', 'Professional reading', -150.00, true, 'CME'),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-05-20', 'City Parking Authority', 'Business Credit Card', 'Monthly parking pass', -120.00, true, 'Parking'),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-05-15', 'Tim Hortons', 'Business Credit Card', 'Meeting with colleague', -12.50, true, 'Meals'),
  
  -- Personal expense transactions (negative amounts)
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-06-25', 'Grocery Store', 'Personal Chequing', 'Weekly groceries', -156.78, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-06-22', 'Gas Station', 'Personal Credit Card', 'Personal vehicle fuel', -65.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-06-20', 'Restaurant', 'Personal Credit Card', 'Family dinner', -89.50, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-06-15', 'Utility Company', 'Personal Chequing', 'Monthly utilities', -180.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-06-01', 'Mortgage Company', 'Personal Chequing', 'Monthly mortgage payment', -2800.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-05-30', 'Insurance Co', 'Personal Chequing', 'Auto insurance', -145.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2024-05-25', 'Phone Company', 'Personal Credit Card', 'Monthly phone bill', -85.00, false, null);
