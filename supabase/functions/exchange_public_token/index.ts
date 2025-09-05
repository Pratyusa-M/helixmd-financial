import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const PLAID_URLS = {
  sandbox: "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production: "https://production.plaid.com"
};
serve(async (req)=>{
  const corsHeaders = {
    "Access-Control-Allow-Origin": "https://helixmd-financial.vercel.app",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey"
  };
  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  // Restrict to POST requests
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders
    });
  }
  // Load environment variables
  const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID");
  const PLAID_SECRET = Deno.env.get("PLAID_SECRET");
  const PLAID_ENV = Deno.env.get("PLAID_ENV") || "sandbox";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  // Validate environment variables
  if (!PLAID_CLIENT_ID || !PLAID_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return new Response("Missing configuration", {
      status: 500,
      headers: corsHeaders
    });
  }
  const baseUrl = PLAID_URLS[PLAID_ENV];
  if (!baseUrl) {
    return new Response("Invalid Plaid environment", {
      status: 400,
      headers: corsHeaders
    });
  }
  // Parse request body
  let body;
  try {
    body = await req.json();
  } catch  {
    return new Response("Invalid request body", {
      status: 400,
      headers: corsHeaders
    });
  }
  const { public_token, metadata } = body;
  if (!public_token || !metadata || !metadata.institution || !metadata.accounts) {
    return new Response("Missing public_token or metadata", {
      status: 400,
      headers: corsHeaders
    });
  }
  // Authenticate user
  let userId;
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response("Missing or invalid Authorization header", {
        status: 401,
        headers: corsHeaders
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.id) {
      throw new Error("Invalid or expired token");
    }
    userId = data.user.id;
  } catch (error) {
    console.error("Auth error:", error);
    return new Response(JSON.stringify({
      error: "Authentication failed"
    }), {
      status: 401,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  try {
    // Exchange public token for access token
    const exchangeResponse = await fetch(`${baseUrl}/item/public_token/exchange`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        public_token
      })
    });
    const exchangeData = await exchangeResponse.json();
    if (!exchangeResponse.ok) {
      throw new Error(exchangeData.error_message || "Plaid exchange error");
    }
    const { access_token, item_id } = exchangeData;
    // Initialize Supabase client for database operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    // Insert into connected_accounts
    const { data: connectedAccount, error: connectedAccountError } = await supabaseAdmin.from("connected_accounts").insert({
      user_id: userId,
      access_token,
      item_id,
      institution: metadata.institution.name || "Unknown",
      account_type: metadata.accounts[0].type || "unknown",
      status: "active",
      last_sync: new Date().toISOString(),
      created_at: new Date().toISOString()
    }).select("id").single();
    if (connectedAccountError || !connectedAccount) {
      throw new Error(connectedAccountError?.message || "Failed to store connected account");
    }
    // Prepare data for connected_plaid_accounts
    const plaidAccounts = metadata.accounts.map((account)=>({
        connected_account_id: connectedAccount.id,
        plaid_account_id: account.id,
        account_name: account.name || "Unknown",
        account_type: account.type || "unknown",
        account_subtype: account.subtype || null,
        mask: account.mask || null,
        status: "active",
        created_at: new Date().toISOString(),
        access_token: access_token,
        last_sync: new Date().toISOString()
      }));
    // Insert into connected_plaid_accounts
    const { error: plaidAccountsError } = await supabaseAdmin.from("connected_plaid_accounts").insert(plaidAccounts);
    if (plaidAccountsError) {
      // Rollback connected_accounts insertion if plaid_accounts fails
      await supabaseAdmin.from("connected_accounts").delete().eq("id", connectedAccount.id);
      throw new Error(plaidAccountsError.message || "Failed to store Plaid accounts");
    }
    return new Response(JSON.stringify({
      success: true,
      connected_account_id: connectedAccount.id
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error details:", error);
    return new Response(JSON.stringify({
      error: error.message || "Failed to exchange token or store accounts"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
