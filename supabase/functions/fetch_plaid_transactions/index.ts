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
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders
    });
  }
  const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID");
  const PLAID_SECRET = Deno.env.get("PLAID_SECRET");
  const PLAID_ENV = Deno.env.get("PLAID_ENV") || "sandbox";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
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
  let body;
  try {
    body = await req.json();
  } catch  {
    return new Response("Invalid request body", {
      status: 400,
      headers: corsHeaders
    });
  }
  const { accountId, startDate, endDate } = body;
  if (!accountId || !startDate || !endDate) {
    return new Response("Missing accountId, startDate, or endDate", {
      status: 400,
      headers: corsHeaders
    });
  }
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
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: account, error: accountError } = await supabaseAdmin.from("connected_accounts").select("access_token").eq("id", accountId).eq("user_id", userId).single();
    if (accountError || !account) {
      throw new Error("Account not found or unauthorized");
    }
    const response = await fetch(`${baseUrl}/transactions/get`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: account.access_token,
        start_date: startDate,
        end_date: endDate,
        options: {
          count: 500,
          offset: 0
        }
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error_message || "Plaid API error");
    }
    const transactions = data.transactions.map((tx)=>({
        connected_account_id: accountId,
        transaction_id: tx.transaction_id,
        amount: tx.amount,
        date: new Date(tx.date).toISOString(),
        name: tx.name,
        pending: tx.pending || false,
        category: tx.category?.[0] || null,
        subcategory: tx.category?.[1] || null,
        transaction_type: tx.amount > 0 ? "credit" : "debit"
      }));
    const { error } = await supabaseAdmin.from("plaid_transactions").insert(transactions);
    if (error) throw error;
    await supabaseAdmin.from("connected_accounts").update({
      last_sync: new Date().toISOString()
    }).eq("id", accountId);
    return new Response(JSON.stringify({
      success: true,
      count: transactions.length
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
      error: error.message || "Failed to fetch transactions"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
