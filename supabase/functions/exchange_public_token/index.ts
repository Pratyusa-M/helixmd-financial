// Deno-based Supabase Edge Function for exchanging Plaid public_token and storing access_token
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const PLAID_URLS = {
  sandbox: "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production: "https://production.plaid.com"
};
serve(async (req)=>{
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405
    });
  }
  // Get environment variables
  const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID");
  const PLAID_SECRET = Deno.env.get("PLAID_SECRET");
  const PLAID_ENV = Deno.env.get("PLAID_ENV") || "sandbox";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); // Set this in dashboard, service role key for writes
  if (!PLAID_CLIENT_ID || !PLAID_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return new Response("Missing configuration", {
      status: 500
    });
  }
  const baseUrl = PLAID_URLS[PLAID_ENV];
  if (!baseUrl) {
    return new Response("Invalid Plaid environment", {
      status: 400
    });
  }
  let body;
  try {
    body = await req.json();
  } catch  {
    return new Response("Invalid request body", {
      status: 400
    });
  }
  const { public_token, metadata } = body;
  if (!public_token || !metadata) {
    return new Response("Missing public_token or metadata", {
      status: 400
    });
  }
  // Exchange public_token for access_token
  try {
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
    // Store in Supabase
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    // Assuming user_id is from metadata or auth, here using a placeholder
    // In production, extract user_id from Supabase auth token in headers
    const userId = "authenticated-user-id"; // TODO: Get from req.headers.get('Authorization')
    // For now, assume user_id is sent in body for simplicity
    // const userId = body.user_id;
    const { error } = await supabaseAdmin.from("connected_accounts").insert({
      user_id: userId,
      access_token,
      item_id,
      institution: metadata.institution.name,
      account_type: metadata.accounts[0].type,
      status: "active",
      last_sync: new Date().toISOString()
    });
    if (error) throw error;
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({
      error: "Failed to exchange token or store account"
    }), {
      status: 500
    });
  }
});
