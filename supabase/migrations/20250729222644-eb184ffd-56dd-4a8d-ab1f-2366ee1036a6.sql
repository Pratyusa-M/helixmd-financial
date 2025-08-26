-- Create audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  action_details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  session_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit logs (users can only view their own logs)
CREATE POLICY "Users can view their own audit logs" 
ON public.audit_logs 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Only allow inserts through edge functions (service role)
CREATE POLICY "Service role can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs (action_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_user_action_time ON public.audit_logs (user_id, action_type, created_at DESC);

-- Create function to automatically clean up old audit logs (older than 2 years)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.audit_logs 
  WHERE created_at < NOW() - INTERVAL '2 years';
END;
$$;

-- Create enum for standardized action types
CREATE TYPE audit_action_type AS ENUM (
  'login_attempt',
  'login_success', 
  'login_failure',
  'logout',
  'password_change',
  'password_reset_request',
  'rule_creation',
  'rule_update',
  'rule_deletion',
  'file_upload',
  'file_deletion',
  'transaction_import',
  'data_export',
  'profile_update',
  'settings_change',
  'rate_limit_exceeded',
  'suspicious_activity'
);

-- Update the table to use the enum
ALTER TABLE public.audit_logs 
ALTER COLUMN action_type TYPE audit_action_type 
USING action_type::audit_action_type;