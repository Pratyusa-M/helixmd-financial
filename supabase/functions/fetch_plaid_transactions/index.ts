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
  const { accountId: connectedAccountId } = body;
  if (!connectedAccountId) {
    return new Response("Missing accountId", {
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
    // Verify the connected account belongs to the user
    const { data: connectedAccount, error: connectedAccountError } = await supabaseAdmin.from("connected_accounts").select("id, user_id, institution").eq("id", connectedAccountId).eq("user_id", userId).single();
    if (connectedAccountError || !connectedAccount) {
      throw new Error("Connected account not found or unauthorized");
    }
    // Get all Plaid accounts for the connected account
    const { data: plaidAccounts, error: plaidAccountsError } = await supabaseAdmin.from("connected_plaid_accounts").select("id, plaid_account_id, access_token, next_cursor, account_name, account_type").eq("connected_account_id", connectedAccountId);
    if (plaidAccountsError || !plaidAccounts?.length) {
      throw new Error("No Plaid accounts found for this connected account");
    }
    let totalTransactions = 0;
    const updatedCursors = {};
    // Process transactions for each Plaid account
    for (const plaidAccount of plaidAccounts){
      let nextCursor = plaidAccount.next_cursor;
      let hasMore = true;
      while(hasMore){
        const response = await fetch(`${baseUrl}/transactions/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            client_id: PLAID_CLIENT_ID,
            secret: PLAID_SECRET,
            access_token: plaidAccount.access_token,
            cursor: nextCursor,
            options: {
              include_personal_finance_category: true
            }
          })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error_message || "Plaid API error");
        }
        const { added, modified, removed, next_cursor } = data;
        const transactionsToInsert = [
          ...added,
          ...modified
        ].map((t)=>{
          const matchingAccount = plaidAccounts.find((pa)=>pa.plaid_account_id === t.account_id);
          if (!matchingAccount) {
            console.warn(`No matching account found for transaction ${t.transaction_id}`);
            return null;
          }
          return {
            user_id: connectedAccount.user_id,
            institution_name: connectedAccount.institution,
            account_name: matchingAccount.account_name,
            account_type: matchingAccount.account_type,
            date: t.date,
            description: t.name,
            amount: t.amount * -1,
            direction: t.amount > 0 ? "debit" : "credit",
            plaid_raw: t,
            plaid_transaction_id: t.transaction_id,
            plaid_account_id: t.account_id,
            plaid_category_raw: t.personal_finance_category ? [
              t.personal_finance_category.primary,
              t.personal_finance_category.detailed
            ] : null,
            plaid_pending: t.pending,
            category_override: t.personal_finance_category ? t.personal_finance_category.detailed : null,
            expense_category: t.category?.[0],
            expense_subcategory: t.category?.[1]
          };
        }).filter((t)=>t !== null);
        if (transactionsToInsert.length > 0) {
          const { error: insertError } = await supabaseAdmin.from("transactions").upsert(transactionsToInsert, {
            onConflict: "plaid_transaction_id"
          });
          if (insertError) throw insertError;
        }
        if (removed.length > 0) {
          const { error: deleteError } = await supabaseAdmin.from("transactions").delete().in("plaid_transaction_id", removed.map((r)=>r.transaction_id));
          if (deleteError) throw deleteError;
        }
        totalTransactions += transactionsToInsert.length + removed.length;
        nextCursor = next_cursor;
        hasMore = data.has_more;
        updatedCursors[plaidAccount.id] = nextCursor;
      }
      // Update the next_cursor for the Plaid account
      await supabaseAdmin.from("connected_plaid_accounts").update({
        next_cursor: updatedCursors[plaidAccount.id],
        last_sync: new Date().toISOString()
      }).eq("id", plaidAccount.id);
    }
    // Update last_sync for the connected account
    await supabaseAdmin.from("connected_accounts").update({
      last_sync: new Date().toISOString()
    }).eq("id", connectedAccountId);
    return new Response(JSON.stringify({
      success: true,
      count: totalTransactions
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
      error: error.message || "Failed to sync transactions"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
