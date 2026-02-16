import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email;

    // Check if user already has DVA
    const { data: profile } = await supabase
      .from("profiles")
      .select("dva_details")
      .eq("user_id", userId)
      .single();

    if (profile?.dva_details) {
      return new Response(JSON.stringify({ dva: profile.dva_details }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create DVA via Paystack
    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecret) {
      return new Response(JSON.stringify({ error: "Payment service not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // First, create or get customer on Paystack
    const customerRes = await fetch("https://api.paystack.co/customer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userEmail,
        metadata: { user_id: userId },
      }),
    });

    const customerData = await customerRes.json();
    if (!customerData.status) {
      console.error("Paystack customer creation failed:", customerData);
      return new Response(JSON.stringify({ error: "Failed to create payment profile" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const customerCode = customerData.data.customer_code;

    // Create Dedicated Virtual Account
    const dvaRes = await fetch("https://api.paystack.co/dedicated_account", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer: customerCode,
        preferred_bank: "test-bank",
      }),
    });

    const dvaData = await dvaRes.json();
    if (!dvaData.status) {
      console.error("Paystack DVA creation failed:", dvaData);
      return new Response(JSON.stringify({ error: "Failed to create virtual account. " + (dvaData.message || "") }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const dva = {
      bank_name: dvaData.data.bank?.name || dvaData.data.bank?.slug || "Wema Bank",
      account_number: dvaData.data.account_number,
      account_name: dvaData.data.account_name,
      customer_code: customerCode,
    };

    // Save DVA details to profile
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await adminClient
      .from("profiles")
      .update({ dva_details: dva })
      .eq("user_id", userId);

    return new Response(JSON.stringify({ dva }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("DVA creation error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
