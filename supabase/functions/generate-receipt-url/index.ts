import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...headers, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...headers, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create anon client for user authentication
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Get user from auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...headers, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User authenticated:', { userId: user.id });

    // Parse and validate input
    const body = await req.json();
    const { path, expiresIn } = body;

    if (typeof path !== 'string') {
      console.error('Invalid path type:', typeof path);
      return new Response(
        JSON.stringify({ error: 'Path must be a string' }),
        { 
          status: 400, 
          headers: { ...headers, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!path.startsWith(`${user.id}/`)) {
      console.error('Path does not start with user ID:', { path, userId: user.id });
      return new Response(
        JSON.stringify({ error: 'Path must start with your user ID' }),
        { 
          status: 400, 
          headers: { ...headers, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Cap TTL to maximum of 1 hour (3600 seconds)
    const ttl = Math.min(Number(expiresIn) || 600, 3600);

    console.log('Creating signed URL:', { path, ttl, userId: user.id });

    // Create service-role client for storage operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Generate signed URL
    const { data, error: storageError } = await serviceClient.storage
      .from('receipts')
      .createSignedUrl(path, ttl);

    if (storageError) {
      console.error('Storage error generating signed URL:', storageError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate signed URL' }),
        { 
          status: 400, 
          headers: { ...headers, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Signed URL generated successfully');

    return new Response(
      JSON.stringify({ 
        url: data.signedUrl,
        expiresIn: ttl
      }),
      { 
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in generate-receipt-url function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...headers, 'Content-Type': 'application/json' } 
      }
    );
  }
});