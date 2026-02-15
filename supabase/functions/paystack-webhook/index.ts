import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecret) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      return new Response("Server error", { status: 500 });
    }

    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify webhook signature
    const expectedSignature = createHmac("sha512", paystackSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);
    console.log("Paystack webhook event:", event.event);

    if (event.event === "charge.success") {
      const data = event.data;
      const amountNaira = data.amount / 100; // Paystack sends amount in kobo
      const customerEmail = data.customer?.email;

      if (!customerEmail || amountNaira < 100) {
        console.log("Skipping: no email or amount < ₦100");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Find user by email
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users?.users?.find((u) => u.email === customerEmail);

      if (!user) {
        console.error("User not found for email:", customerEmail);
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get current balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("user_id", user.id)
        .single();

      const currentBalance = profile?.wallet_balance || 0;
      const newBalance = currentBalance + amountNaira;

      // Update wallet balance
      await supabase
        .from("profiles")
        .update({ wallet_balance: newBalance })
        .eq("user_id", user.id);

      // Record transaction
      await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        amount: amountNaira,
        type: "dva_credit",
        reference: `Bank transfer via DVA (Ref: ${data.reference})`,
      });

      console.log(`Credited ₦${amountNaira} to ${customerEmail}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Server error", { status: 500 });
  }
});
