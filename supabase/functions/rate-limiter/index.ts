import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = corsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ allowed: false }),
        { 
          status: 429, 
          headers: { 
            ...headers, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          } 
        }
      );
    }

    // Extract user ID from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ allowed: false }),
        { 
          status: 401, 
          headers: { 
            ...headers, 
            'Content-Type': 'application/json'
          } 
        }
      );
    }

    // Create anon Supabase client with auth header
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Invalid or expired token:', userError);
      return new Response(
        JSON.stringify({ allowed: false }),
        { 
          status: 401, 
          headers: { 
            ...headers, 
            'Content-Type': 'application/json'
          } 
        }
      );
    }

    // Get operation and limit from URL search params
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const op = searchParams.get('op') || 'generic';
    const limit = parseInt(searchParams.get('limit') || '60', 10);

    console.log(`Rate limit check for user ${user.id}, operation: ${op}, limit: ${limit}`);

    // Call the rate_limit_check RPC function
    const { data, error } = await supabase.rpc('rate_limit_check', {
      p_user: user.id,
      p_op: op,
      p_limit: limit
    });

    if (error) {
      console.error('RPC rate_limit_check error:', error);
      // Fail closed - deny request if RPC fails
      return new Response(
        JSON.stringify({ allowed: false }),
        { 
          status: 429, 
          headers: { 
            ...headers, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          } 
        }
      );
    }

    if (!data || data.length === 0) {
      console.error('No data returned from rate_limit_check RPC');
      // Fail closed - deny request if no data returned
      return new Response(
        JSON.stringify({ allowed: false }),
        { 
          status: 429, 
          headers: { 
            ...headers, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          } 
        }
      );
    }

    const result = data[0];
    const resetAt = new Date(result.reset_at).getTime();

    if (!result.allowed) {
      // Rate limit exceeded
      return new Response(
        JSON.stringify({
          allowed: false,
          remaining: result.remaining || 0,
          resetAt: resetAt
        }),
        { 
          status: 429, 
          headers: { 
            ...headers, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          } 
        }
      );
    }

    // Request allowed
    return new Response(
      JSON.stringify({
        allowed: true,
        remaining: result.remaining || 0,
        resetAt: resetAt
      }),
      {
        status: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in rate-limiter function:', error);
    
    // Fail closed - deny request on any unexpected error
    return new Response(
      JSON.stringify({ allowed: false }),
      {
        status: 429,
        headers: { 
          ...headers, 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        }
      }
    );
  }
});