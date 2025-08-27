import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
  const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID");
  const PLAID_SECRET = Deno.env.get("PLAID_SECRET");
  const PLAID_ENV = Deno.env.get("PLAID_ENV") || "sandbox";
  if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
    return new Response("Plaid credentials not configured", {
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
    body = {};
  }
  const clientUserId = body.user_id || "unique-user-id"; // Fallback, will be replaced with auth
  const plaidRequest = {
    client_id: PLAID_CLIENT_ID,
    secret: PLAID_SECRET,
    client_name: "HelixMD",
    user: {
      client_user_id: clientUserId
    },
    products: [
      "auth",
      "transactions"
    ],
    country_codes: [
      "CA"
    ],
    language: "en"
  };
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
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({
      error: "Failed to create link token"
    }), {
      status: 500
    });
  }
});
