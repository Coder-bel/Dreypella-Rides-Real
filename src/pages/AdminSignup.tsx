/**
 * Hidden /admin-signup — only reachable by direct URL.
 * Requires ADPR-XXXX invite code, then signs up via Supabase Auth and claims invite.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isValidPhone, isValidPassword, PASSWORD_ERROR } from "@/lib/constants";

const AdminSignup = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) return setError("Full name is required");
    if (!email.trim()) return setError("Email is required");
    if (!isValidPhone(phone)) return setError("Phone must be exactly 11 digits");
    if (!/^ADPR-\d{4}$/.test(code.trim().toUpperCase())) return setError("Invalid invite code format (ADPR-XXXX)");
    if (!isValidPassword(password)) return setError(PASSWORD_ERROR);

    setBusy(true);

    const { data: signUp, error: suErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim(), phone: phone.trim() },
      },
    });
    if (suErr || !signUp.user) {
      setBusy(false);
      return setError(suErr?.message || "Signup failed");
    }

    // If email confirmation is required there is no session yet — sign in to get one
    if (!signUp.session) {
      const { error: siErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (siErr) {
        setBusy(false);
        return setError("Account created but auto sign-in failed. Try logging in.");
      }
    }

    const { data: claim, error: claimErr } = await supabase.rpc("claim_admin_invite" as any, {
      _invite_code: code.trim().toUpperCase(),
      _full_name: fullName.trim(),
      _email: email.trim(),
      _phone: phone.trim(),
    });

    setBusy(false);
    if (claimErr) return setError(claimErr.message);
    const res: any = claim;
    if (!res?.success) {
      const map: Record<string, string> = {
        invalid_code: "Invalid invite code.",
        expired_or_used: "Invalid or expired invite code. Please contact the main admin.",
        email_mismatch: "Email does not match the invite.",
        not_authenticated: "Not signed in.",
      };
      return setError(map[res?.error] || "Could not redeem invite.");
    }

    navigate("/admin");
  };

  const inputCls = "w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-navy-gradient sticky top-0 z-50">
        <div className="container flex items-center justify-center h-14 px-4">
          <span className="font-display font-bold text-lg text-primary-foreground tracking-tight">
            DREYPELLA<span className="text-red-brand"> RIDE</span>
          </span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-card rounded-2xl border p-6 sm:p-8 w-full max-w-md animate-fade-in-up">
          <div className="text-center mb-5">
            <ShieldCheck size={36} className="mx-auto text-accent mb-2" />
            <h1 className="font-display font-bold text-xl">Admin Signup</h1>
            <p className="text-xs text-muted-foreground mt-1">Use the invite code shared by an existing admin.</p>
          </div>
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg mb-3 flex items-start gap-2 animate-shake">
              <AlertCircle size={14} className="shrink-0 mt-0.5" /> <span>{error}</span>
            </div>
          )}
          <form onSubmit={submit} className="space-y-3">
            <input className={inputCls} placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <input className={inputCls} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className={inputCls} type="tel" placeholder="Phone (11 digits)" maxLength={11} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} />
            <input className={inputCls + " font-mono uppercase"} placeholder="ADPR-XXXX" maxLength={9} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            <input className={inputCls} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-[11px] text-muted-foreground">{PASSWORD_ERROR}</p>
            <button disabled={busy} className="w-full bg-accent text-accent-foreground font-semibold py-3 rounded-xl disabled:opacity-60">
              {busy ? "Creating..." : "Create Admin Account"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AdminSignup;
