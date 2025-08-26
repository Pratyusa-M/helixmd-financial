-- Create rate_limit table
CREATE TABLE public.rate_limit (
    user_id uuid NOT NULL,
    operation_type text NOT NULL,
    window_start timestamptz NOT NULL,
    count int NOT NULL DEFAULT 0
);

-- Create unique index on (user_id, operation_type, window_start)
CREATE UNIQUE INDEX idx_rate_limit_user_op_window 
ON public.rate_limit (user_id, operation_type, window_start);

-- Enable RLS on the rate_limit table
ALTER TABLE public.rate_limit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rate_limit table
CREATE POLICY "Service role can manage rate limits" 
ON public.rate_limit 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Floor to minute function
CREATE OR REPLACE FUNCTION public.floor_to_minute(ts timestamptz)
RETURNS timestamptz 
LANGUAGE sql 
IMMUTABLE 
AS $$ 
SELECT date_trunc('minute', ts) 
$$;

-- Change owner to supabase_admin for privileged access
ALTER FUNCTION public.floor_to_minute(timestamptz) OWNER TO supabase_admin;

-- Rate limit check function
CREATE OR REPLACE FUNCTION public.rate_limit_check(p_user uuid, p_op text, p_limit int)
RETURNS TABLE(allowed boolean, remaining int, reset_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE 
    ws timestamptz := public.floor_to_minute(now());
    c int;
BEGIN
    INSERT INTO public.rate_limit AS rl (user_id, operation_type, window_start, count)
    VALUES (p_user, p_op, ws, 1)
    ON CONFLICT (user_id, operation_type, window_start)
    DO UPDATE SET count = rl.count + 1
    RETURNING rl.count INTO c;
    
    allowed := c <= p_limit;
    remaining := greatest(0, p_limit - c);
    reset_at := ws + interval '1 minute';
    
    RETURN NEXT;
END;
$$;

-- Change owner to supabase_admin for privileged access
ALTER FUNCTION public.rate_limit_check(uuid, text, int) OWNER TO supabase_admin;