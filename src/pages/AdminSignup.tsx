/**
 * Hidden /admin-signup — only reachable by direct URL.
 * First admin can sign up without an invite code.
 * Additional admins may use an ADPR-XXXX invite code.
 * Uses a backend function to create confirmed admin accounts and sign in automatically.
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!fullName.trim()) return setError("Full name is required");
    if (!email.trim()) return setError("Email is required");
    if (!isValidPhone(phone)) return setError("Phone must be exactly 11 digits");
    if (code.trim() && !/^ADPR-\d{4}$/.test(code.trim().toUpperCase())) return setError("Invalid invite code format (ADPR-XXXX)");
    if (!isValidPassword(password)) return setError(PASSWORD_ERROR);

    setBusy(true);

    const normalizedEmail = email.trim().toLowerCase();
    const payload = {
      full_name: fullName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      invite_code: code.trim().toUpperCase(),
    };

    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-signup`;
    let result: any;
    try {
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        setBusy(false);
        return setError(
          `Admin signup failed: ${response.status} ${response.statusText} - ${text}`,
        );
      }

      result = await response.json();
    } catch (invokeError: any) {
      setBusy(false);
      return setError(
        `Failed to send a request to the Edge Function: ${invokeError?.message || invokeError}. ` +
          "Make sure your Supabase Functions are deployed or running locally, and that VITE_SUPABASE_URL is configured correctly."
      );
    }

    if (!result.success) {
      setBusy(false);
      return setError(result.error || "Admin signup failed.");
    }

    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (signInErr) {
      setBusy(false);
      return setError(signInErr.message || "Account created, but automatic sign-in failed. Please sign in manually.");
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
            <p className="text-xs text-muted-foreground mt-3">
              Already signed up? <Link to="/auth" className="font-semibold text-accent hover:underline">Sign in</Link> instead.
            </p>
          </div>
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg mb-3 flex items-start gap-2 animate-shake">
              <AlertCircle size={14} className="shrink-0 mt-0.5" /> <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="bg-emerald-100 text-emerald-900 text-sm px-3 py-2 rounded-lg mb-3 border border-emerald-200">
              {info}
            </div>
          )}
          <form onSubmit={submit} className="space-y-3">
            <input className={inputCls} placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <input className={inputCls} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className={inputCls} type="tel" placeholder="Phone (11 digits)" maxLength={11} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} />
            <input className={inputCls + " font-mono uppercase"} placeholder="ADPR-XXXX" maxLength={9} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            <p className="text-[11px] text-muted-foreground">If this is the first admin account, you can leave the invite code blank.</p>
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
