// Send password reset OTP. DEV MODE: returns the OTP in the response so the
// client can display it. Replace with a real email provider later.
//
// Identifier rules:
//   user  -> email
//   biker -> company_code + email (must match)
//   admin -> email + phone (must match)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const sha256 = async (text: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const gen6 = () => Math.floor(100000 + Math.random() * 900000).toString();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { role, phone, email, company_code } = await req.json();
    if (!role || !["user", "biker", "admin"].includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), { status: 400, headers: corsHeaders });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let identifier = "";
    let userId: string | null = null;

    if (role === "user") {
      if (!email) return new Response(JSON.stringify({ error: "Email required" }), { status: 400, headers: corsHeaders });
      const cleanEmail = String(email).trim().toLowerCase();
      const { data: usersList, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (listErr) return new Response(JSON.stringify({ error: listErr.message }), { status: 500, headers: corsHeaders });
      const match = usersList.users.find((u) => (u.email || "").toLowerCase() === cleanEmail);
      if (!match) return new Response(JSON.stringify({ error: "No account found with this email" }), { status: 404, headers: corsHeaders });
      identifier = cleanEmail;
      userId = match.id;
    } else if (role === "biker") {
      if (!company_code || !email) return new Response(JSON.stringify({ error: "Company code and email required" }), { status: 400, headers: corsHeaders });
      const cleanEmail = String(email).trim().toLowerCase();
      const { data: biker } = await admin
        .from("bikers")
        .select("user_id, email, company_code")
        .eq("company_code", String(company_code).trim().toUpperCase())
        .maybeSingle();
      if (!biker || (biker.email || "").toLowerCase() !== cleanEmail) {
        return new Response(JSON.stringify({ error: "Company code and email do not match" }), { status: 404, headers: corsHeaders });
      }
      identifier = biker.company_code!;
      userId = biker.user_id;
    } else {
      // admin: requires email AND phone
      if (!email || !phone) return new Response(JSON.stringify({ error: "Email and phone required" }), { status: 400, headers: corsHeaders });
      const { data: adminRow } = await admin
        .from("admins")
        .select("user_id, email, phone")
        .ilike("email", String(email).trim())
        .maybeSingle();
      if (!adminRow || adminRow.phone !== String(phone).trim()) {
        return new Response(JSON.stringify({ error: "Email and phone do not match an admin account" }), { status: 404, headers: corsHeaders });
      }
      identifier = adminRow.email;
      userId = adminRow.user_id;
    }

    const code = gen6();
    const otpHash = await sha256(code);
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await admin
      .from("password_reset_otps")
      .update({ consumed_at: new Date().toISOString() })
      .eq("identifier", identifier)
      .eq("role", role)
      .is("consumed_at", null);

    await admin
      .from("password_reset_otps")
      .insert({ identifier, role, user_id: userId, otp_hash: otpHash, expires_at });

    // DEV MODE: return code in response so the UI can display it. Replace with
    // a real email provider for production sends.
    return new Response(
      JSON.stringify({
        success: true,
        dev_otp: code,
        message: `Your DREYPELLA RIDE password reset code is: ${code}. Valid for 10 minutes. Do not share this code with anyone.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: corsHeaders });
  }
});
