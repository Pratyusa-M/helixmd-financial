
-- Add sample income transactions for 2023 to populate the previous year data in the chart
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
  -- 2023 Income transactions (positive amounts) - spread across the year
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-01-15', 'RBC', 'Business Chequing', 'Professional Services - January', 7200.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-01-28', 'TD Bank', 'Practice Account', 'Emergency Consultations', 1800.00, false, null),
  
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-02-10', 'RBC', 'Business Chequing', 'Professional Services - February', 6800.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-02-25', 'TD Bank', 'Practice Account', 'Weekend Clinic', 2200.00, false, null),
  
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-03-05', 'RBC', 'Business Chequing', 'Professional Services - March', 8100.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-03-20', 'TD Bank', 'Practice Account', 'Telehealth Sessions', 1600.00, false, null),
  
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-04-12', 'RBC', 'Business Chequing', 'Professional Services - April', 7900.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-04-28', 'TD Bank', 'Practice Account', 'Consultation Fees', 2400.00, false, null),
  
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-05-08', 'RBC', 'Business Chequing', 'Professional Services - May', 8800.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-05-22', 'TD Bank', 'Practice Account', 'Emergency Call Fees', 1900.00, false, null),
  
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-06-15', 'RBC', 'Business Chequing', 'Professional Services - June', 9200.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-06-30', 'TD Bank', 'Practice Account', 'Month-end Consultations', 2100.00, false, null),
  
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-07-10', 'RBC', 'Business Chequing', 'Professional Services - July', 8500.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-07-25', 'TD Bank', 'Practice Account', 'Summer Clinic', 2800.00, false, null),
  
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-08-05', 'RBC', 'Business Chequing', 'Professional Services - August', 7600.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-08-20', 'TD Bank', 'Practice Account', 'Telehealth Revenue', 2300.00, false, null),
  
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-09-12', 'RBC', 'Business Chequing', 'Professional Services - September', 8900.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-09-28', 'TD Bank', 'Practice Account', 'Consultation Revenue', 2500.00, false, null),
  
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-10-15', 'RBC', 'Business Chequing', 'Professional Services - October', 9400.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-10-30', 'TD Bank', 'Practice Account', 'Emergency Services', 2700.00, false, null),
  
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-11-08', 'RBC', 'Business Chequing', 'Professional Services - November', 8300.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-11-22', 'TD Bank', 'Practice Account', 'Holiday Consultations', 2000.00, false, null),
  
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-12-10', 'RBC', 'Business Chequing', 'Professional Services - December', 7800.00, false, null),
  ('12f43d27-1fa7-4154-8bb1-c850777ca23e', '2023-12-28', 'TD Bank', 'Practice Account', 'Year-end Services', 2600.00, false, null);
