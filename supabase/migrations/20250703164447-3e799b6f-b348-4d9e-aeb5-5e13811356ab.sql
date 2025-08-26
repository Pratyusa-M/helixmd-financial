
-- Create enum for vehicle tracking modes
CREATE TYPE public.vehicle_tracking_mode AS ENUM ('trip', 'monthly');

-- Create enum for vehicle deduction methods  
CREATE TYPE public.vehicle_deduction_method AS ENUM ('per_km', 'actual_expense');

-- Add vehicle tracking fields to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN vehicle_tracking_mode public.vehicle_tracking_mode DEFAULT 'trip',
ADD COLUMN vehicle_deduction_method public.vehicle_deduction_method DEFAULT 'per_km',
ADD COLUMN per_km_rate numeric DEFAULT 0.68;

-- Create vehicle_logs table for individual trip tracking
CREATE TABLE public.vehicle_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    from_location TEXT,
    to_location TEXT,
    distance_km NUMERIC NOT NULL CHECK (distance_km > 0),
    purpose TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create monthly_vehicle_summary table for monthly totals
CREATE TABLE public.monthly_vehicle_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    month DATE NOT NULL, -- stored as YYYY-MM-01
    total_km NUMERIC NOT NULL CHECK (total_km > 0),
    business_km NUMERIC NOT NULL CHECK (business_km >= 0 AND business_km <= total_km),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, month) -- prevent duplicate entries for same month
);

-- Enable RLS on vehicle_logs table
ALTER TABLE public.vehicle_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vehicle_logs
CREATE POLICY "Users can view their own vehicle logs" 
    ON public.vehicle_logs 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vehicle logs" 
    ON public.vehicle_logs 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicle logs" 
    ON public.vehicle_logs 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicle logs" 
    ON public.vehicle_logs 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Enable RLS on monthly_vehicle_summary table
ALTER TABLE public.monthly_vehicle_summary ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for monthly_vehicle_summary
CREATE POLICY "Users can view their own monthly vehicle summary" 
    ON public.monthly_vehicle_summary 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own monthly vehicle summary" 
    ON public.monthly_vehicle_summary 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly vehicle summary" 
    ON public.monthly_vehicle_summary 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monthly vehicle summary" 
    ON public.monthly_vehicle_summary 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_vehicle_logs_user_date ON public.vehicle_logs(user_id, date DESC);
CREATE INDEX idx_monthly_vehicle_summary_user_month ON public.monthly_vehicle_summary(user_id, month DESC);
