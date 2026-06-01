// Verify OTP and reset password for user/biker/admin.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sha256 = async (text: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { role, identifier, otp, new_password } = await req.json();
    if (!role || !identifier || !otp || !new_password) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: corsHeaders });
    }
    if (!PASSWORD_REGEX.test(new_password)) {
      return new Response(JSON.stringify({ error: "Password does not meet strength requirements" }), { status: 400, headers: corsHeaders });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const otpHash = await sha256(otp);
    const { data: rec } = await admin
      .from("password_reset_otps")
      .select("*")
      .eq("identifier", identifier)
      .eq("role", role)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!rec) return new Response(JSON.stringify({ error: "No active reset code. Please request a new one." }), { status: 400, headers: corsHeaders });
    if (new Date(rec.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Code has expired. Please request a new one." }), { status: 400, headers: corsHeaders });
    }
    if (rec.attempts >= 5) {
      return new Response(JSON.stringify({ error: "Too many attempts. Please request a new code." }), { status: 400, headers: corsHeaders });
    }
    if (rec.otp_hash !== otpHash) {
      await admin.from("password_reset_otps").update({ attempts: rec.attempts + 1 }).eq("id", rec.id);
      return new Response(JSON.stringify({ error: "Incorrect code" }), { status: 400, headers: corsHeaders });
    }

    if (!rec.user_id) {
      return new Response(JSON.stringify({ error: "Account not found" }), { status: 404, headers: corsHeaders });
    }

    const { error: updErr } = await admin.auth.admin.updateUserById(rec.user_id, { password: new_password });
    if (updErr) {
      return new Response(JSON.stringify({ error: updErr.message }), { status: 500, headers: corsHeaders });
    }

    await admin.from("password_reset_otps").update({ consumed_at: new Date().toISOString() }).eq("id", rec.id);

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: corsHeaders });
  }
});
