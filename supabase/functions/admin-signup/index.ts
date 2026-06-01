import { createClient } from "npm:@supabase/supabase-js";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "");
    const inviteCode = String(body.invite_code || "").trim().toUpperCase();

    if (!fullName) return new Response(JSON.stringify({ error: "Full name is required." }), { status: 400, headers: corsHeaders });
    if (!email) return new Response(JSON.stringify({ error: "Email is required." }), { status: 400, headers: corsHeaders });
    if (!phone) return new Response(JSON.stringify({ error: "Phone number is required." }), { status: 400, headers: corsHeaders });
    if (!password) return new Response(JSON.stringify({ error: "Password is required." }), { status: 400, headers: corsHeaders });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existingAdmin } = await admin.from("admins").select("id").limit(1).maybeSingle();
    const isFirstAdmin = !existingAdmin;

    let invite: any = null;
    if (inviteCode) {
      if (!/^ADPR-\d{4}$/.test(inviteCode)) {
        return new Response(JSON.stringify({ error: "Invalid invite code format. Use ADPR-XXXX." }), { status: 400, headers: corsHeaders });
      }
      const { data: row, error: rowErr } = await admin
        .from("admin_invites")
        .select("id,email,phone,status,expires_at")
        .eq("invite_code", inviteCode)
        .maybeSingle();
      if (rowErr) {
        return new Response(JSON.stringify({ error: rowErr.message }), { status: 500, headers: corsHeaders });
      }
      if (!row) {
        return new Response(JSON.stringify({ error: "Invalid invite code." }), { status: 400, headers: corsHeaders });
      }
      if (row.status !== "pending" || new Date(row.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "Invalid or expired invite code." }), { status: 400, headers: corsHeaders });
      }
      if (String(row.email).trim().toLowerCase() !== email) {
        return new Response(JSON.stringify({ error: "Email does not match the invite." }), { status: 400, headers: corsHeaders });
      }
      if (String(row.phone).trim() !== phone) {
        return new Response(JSON.stringify({ error: "Phone number does not match the invite." }), { status: 400, headers: corsHeaders });
      }
      invite = row;
    } else if (!isFirstAdmin) {
      return new Response(JSON.stringify({ error: "Invite code required unless you are creating the first admin." }), { status: 400, headers: corsHeaders });
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name: fullName, phone },
    } as any);

    if (createErr) {
      return new Response(JSON.stringify({ error: createErr.message }), { status: 400, headers: corsHeaders });
    }

    const userId = created?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Failed to create admin user." }), { status: 500, headers: corsHeaders });
    }

    await admin.auth.admin.updateUserById(userId, { email_confirmed: true, email_confirm: true } as any);

    await admin.from("admins").insert({
      user_id: userId,
      full_name: fullName,
      email,
      phone,
    });

    await admin.from("user_roles").insert({
      user_id: userId,
      role: "admin",
    });

    if (invite) {
      await admin
        .from("admin_invites")
        .update({ status: "used", used_by: userId, used_at: new Date().toISOString() })
        .eq("id", invite.id);
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: String(error?.message || error) }), { status: 500, headers: corsHeaders });
  }
});
