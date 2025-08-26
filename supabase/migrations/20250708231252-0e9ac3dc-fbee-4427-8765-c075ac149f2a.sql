-- Add mileage tracking fields to profiles table for vehicle deduction calculations
ALTER TABLE public.profiles 
ADD COLUMN start_of_year_mileage NUMERIC CHECK (start_of_year_mileage >= 0),
ADD COLUMN current_mileage NUMERIC CHECK (current_mileage >= 0);