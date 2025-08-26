
-- Clear existing transactions and create new mock data
DELETE FROM public.transactions;

-- Insert new mock transaction data with proper mix of income and business expenses
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
  -- Income transactions (positive amounts, is_business_expense = false)
  (auth.uid(), '2025-01-15', 'RBC', 'Business Chequing', 'Professional Services - January', 12000.00, false, 'Income'),
  (auth.uid(), '2025-01-28', 'TD Bank', 'Practice Account', 'Consultation Fees', 2500.00, false, 'Income'),
  (auth.uid(), '2025-02-15', 'RBC', 'Business Chequing', 'Professional Services - February', 14500.00, false, 'Income'),
  (auth.uid(), '2025-02-25', 'TD Bank', 'Practice Account', 'Emergency Consultations', 1800.00, false, 'Income'),
  (auth.uid(), '2025-03-15', 'RBC', 'Business Chequing', 'Professional Services - March', 13200.00, false, 'Income'),
  (auth.uid(), '2025-03-30', 'TD Bank', 'Practice Account', 'Weekend Clinic', 2200.00, false, 'Income'),
  (auth.uid(), '2025-04-15', 'RBC', 'Business Chequing', 'Professional Services - April', 15800.00, false, 'Income'),
  (auth.uid(), '2025-04-28', 'TD Bank', 'Practice Account', 'Telehealth Sessions', 1900.00, false, 'Income'),
  (auth.uid(), '2025-05-15', 'RBC', 'Business Chequing', 'Professional Services - May', 16500.00, false, 'Income'),
  (auth.uid(), '2025-05-30', 'TD Bank', 'Practice Account', 'Special Consultations', 2100.00, false, 'Income'),
  (auth.uid(), '2025-06-15', 'RBC', 'Business Chequing', 'Professional Services - June', 17200.00, false, 'Income'),
  (auth.uid(), '2025-06-28', 'TD Bank', 'Practice Account', 'Month-end Consultations', 2400.00, false, 'Income'),

  -- Business expense transactions (negative amounts, is_business_expense = true)
  (auth.uid(), '2025-01-05', 'Shell', 'Business Credit Card', 'Fuel for house calls', -150.00, true, 'Fuel'),
  (auth.uid(), '2025-01-10', 'Medical Conference Inc', 'Business Credit Card', 'CME Conference Registration', -800.00, true, 'Education'),
  (auth.uid(), '2025-01-20', 'Downtown Parking', 'Business Credit Card', 'Hospital parking', -25.00, true, 'Parking'),
  (auth.uid(), '2025-01-25', 'Office Depot', 'Business Credit Card', 'Medical supplies and forms', -120.00, true, 'Supplies'),
  
  (auth.uid(), '2025-02-03', 'Petro-Canada', 'Business Credit Card', 'Monthly fuel expenses', -180.00, true, 'Fuel'),
  (auth.uid(), '2025-02-12', 'Medical Equipment Co', 'Business Credit Card', 'Stethoscope replacement', -450.00, true, 'Equipment'),
  (auth.uid(), '2025-02-18', 'Legal Associates', 'Business Credit Card', 'Legal consultation', -600.00, true, 'Professional Services'),
  (auth.uid(), '2025-02-28', 'Microsoft', 'Business Credit Card', 'Office 365 subscription', -35.00, true, 'Software'),
  
  (auth.uid(), '2025-03-08', 'Esso', 'Business Credit Card', 'Fuel for medical visits', -165.00, true, 'Fuel'),
  (auth.uid(), '2025-03-15', 'City Parking Authority', 'Business Credit Card', 'Monthly parking pass', -140.00, true, 'Parking'),
  (auth.uid(), '2025-03-22', 'The Keg', 'Business Credit Card', 'Client dinner meeting', -220.00, true, 'Meals'),
  (auth.uid(), '2025-03-30', 'Medical Journal Subscription', 'Business Credit Card', 'Professional reading', -180.00, true, 'Education'),
  
  (auth.uid(), '2025-04-05', 'Shell', 'Business Credit Card', 'Monthly fuel costs', -175.00, true, 'Fuel'),
  (auth.uid(), '2025-04-12', 'Professional College', 'Business Credit Card', 'Annual membership fee', -500.00, true, 'Professional Services'),
  (auth.uid(), '2025-04-20', 'Staples', 'Business Credit Card', 'Office supplies', -85.00, true, 'Supplies'),
  (auth.uid(), '2025-04-28', 'Medical Conference', 'Business Credit Card', 'CME Workshop', -350.00, true, 'Education'),
  
  (auth.uid(), '2025-05-06', 'Petro-Canada', 'Business Credit Card', 'Fuel expenses', -190.00, true, 'Fuel'),
  (auth.uid(), '2025-05-15', 'Equipment Supplier', 'Business Credit Card', 'Medical instruments', -750.00, true, 'Equipment'),
  (auth.uid(), '2025-05-22', 'Downtown Restaurant', 'Business Credit Card', 'Business lunch', -95.00, true, 'Meals'),
  (auth.uid(), '2025-05-30', 'Software Solutions', 'Business Credit Card', 'EMR software subscription', -250.00, true, 'Software'),
  
  (auth.uid(), '2025-06-08', 'Shell', 'Business Credit Card', 'Monthly fuel', -185.00, true, 'Fuel'),
  (auth.uid(), '2025-06-15', 'City Parking', 'Business Credit Card', 'Hospital parking fees', -45.00, true, 'Parking'),
  (auth.uid(), '2025-06-22', 'Medical Supply Co', 'Business Credit Card', 'Disposable supplies', -150.00, true, 'Supplies'),
  (auth.uid(), '2025-06-28', 'Professional Development', 'Business Credit Card', 'Online CME course', -200.00, true, 'Education'),

  -- Personal expense transactions (negative amounts, is_business_expense = false)
  (auth.uid(), '2025-01-03', 'Grocery Store', 'Personal Chequing', 'Weekly groceries', -180.00, false, 'Personal'),
  (auth.uid(), '2025-01-15', 'Utility Company', 'Personal Chequing', 'Monthly utilities', -250.00, false, 'Personal'),
  (auth.uid(), '2025-01-30', 'Mortgage Company', 'Personal Chequing', 'Monthly mortgage', -3200.00, false, 'Personal'),
  
  (auth.uid(), '2025-02-05', 'Gas Station', 'Personal Credit Card', 'Personal vehicle fuel', -85.00, false, 'Personal'),
  (auth.uid(), '2025-02-20', 'Restaurant', 'Personal Credit Card', 'Family dinner', -120.00, false, 'Personal'),
  (auth.uid(), '2025-02-28', 'Insurance Co', 'Personal Chequing', 'Auto insurance', -160.00, false, 'Personal'),
  
  (auth.uid(), '2025-03-10', 'Department Store', 'Personal Credit Card', 'Personal shopping', -200.00, false, 'Personal'),
  (auth.uid(), '2025-03-25', 'Phone Company', 'Personal Credit Card', 'Monthly phone bill', -95.00, false, 'Personal'),
  
  (auth.uid(), '2025-04-08', 'Home Depot', 'Personal Credit Card', 'Home maintenance', -350.00, false, 'Personal'),
  (auth.uid(), '2025-04-22', 'Grocery Store', 'Personal Credit Card', 'Monthly groceries', -220.00, false, 'Personal'),
  
  (auth.uid(), '2025-05-12', 'Vacation Rental', 'Personal Credit Card', 'Weekend getaway', -800.00, false, 'Personal'),
  (auth.uid(), '2025-05-28', 'Clothing Store', 'Personal Credit Card', 'Personal clothing', -180.00, false, 'Personal'),
  
  (auth.uid(), '2025-06-10', 'Dentist Office', 'Personal Credit Card', 'Dental checkup', -300.00, false, 'Personal'),
  (auth.uid(), '2025-06-25', 'Electronics Store', 'Personal Credit Card', 'Personal electronics', -450.00, false, 'Personal');

-- Add unique constraint to tax_settings user_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tax_settings_user_id_key') THEN
        ALTER TABLE public.tax_settings ADD CONSTRAINT tax_settings_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Ensure tax_settings exists for current user
INSERT INTO public.tax_settings (user_id, personal_tax_credit_amount, province)
VALUES (auth.uid(), 15705, 'ON')
ON CONFLICT (user_id) DO UPDATE SET
  personal_tax_credit_amount = 15705,
  province = 'ON';
