import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const PLAID_URLS = {
  sandbox: "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production: "https://production.plaid.com"
};
serve(async (req)=>{
  // Define CORS headers
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
  const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID");
  const PLAID_SECRET = Deno.env.get("PLAID_SECRET");
  const PLAID_ENV = Deno.env.get("PLAID_ENV") || "sandbox";
  if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
    return new Response("Plaid credentials not configured", {
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
  let body;
  try {
    body = await req.json();
  } catch  {
    body = {};
  }
  const clientUserId = body.user_id || "unique-user-id"; // Fallback, will be replaced with auth
  const accessToken = body.access_token;
  const plaidRequest = {
    client_id: PLAID_CLIENT_ID,
    secret: PLAID_SECRET,
    client_name: "HelixMD",
    user: {
      client_user_id: clientUserId
    },
    products: [
      "transactions"
    ],
    country_codes: [
      "CA"
    ],
    language: "en",
    transactions: {
      days_requested: 730
    },
    webhook: "https://plaid.helixmd.ai/api/webhook"
  };
  if (accessToken) {
    plaidRequest.access_token = accessToken;
  }
  try {
    const response = await fetch(`${baseUrl}/link/token/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(plaidRequest)
    });
    if (!response.ok) {
      throw new Error(await response.text() || "Plaid API error");
    }
    const data = await response.json();
    return new Response(JSON.stringify({
      link_token: data.link_token
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({
      error: "Failed to create link token"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
