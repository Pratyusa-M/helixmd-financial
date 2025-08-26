-- Add home_office_percentage field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN home_office_percentage DECIMAL(5,2) DEFAULT 0.0 CHECK (home_office_percentage >= 0 AND home_office_percentage <= 100);