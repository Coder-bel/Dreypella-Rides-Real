/**
 * Biker signup — NO email field, NO email verification.
 * The biker enters: Full Name, Phone, Company Code (DPR-XXXX), Password.
 * We derive a synthetic email from the company code so Supabase auth still works
 * (e.g. "dpr7821@bikers.dreypella.local"). Email confirmation is disabled.
 * After successful signup, the biker is signed in immediately and redirected to /bikers.
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bike, AlertCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  isValidPhone,
  PHONE_ERROR,
  isValidPassword,
  PASSWORD_ERROR,
  bikerCodeToEmail,
} from "@/lib/constants";

const BikersSignup = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) return setError("Full Name is required");
    if (!isValidPhone(phone)) return setError(PHONE_ERROR);
    const code = companyCode.trim().toUpperCase();
    if (!/^DPR-\d{4}$/.test(code))
      return setError("Invalid Company Code format. Expected: DPR-XXXX");
    if (!isValidPassword(password)) return setError(PASSWORD_ERROR);

    setLoading(true);

    // Synthetic email tied to the company code (never user-visible).
    const syntheticEmail = bikerCodeToEmail(code);

    // Step 1: create the Supabase auth account.
    const { data: signupData, error: signupErr } = await supabase.auth.signUp({
      email: syntheticEmail,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/bikers",
        data: { full_name: fullName.trim(), phone: phone.trim() },
      },
    });

    if (signupErr) {
      setLoading(false);
      // If account already exists, surface a friendly message.
      if (signupErr.message.toLowerCase().includes("already")) {
        return setError(
          "An account already exists for this Company Code. Please sign in instead."
        );
      }
      return setError(signupErr.message);
    }

    // Step 2: ensure we have an active session (auto-confirm is on, so this should work).
    if (!signupData.session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: syntheticEmail,
        password,
      });
      if (signInErr) {
        setLoading(false);
        return setError("Account created, but sign-in failed. Please try logging in.");
      }
    }

    // Step 3: claim the company code via secure RPC (assigns 'biker' role + links biker row).
    const { data: claimed, error: claimErr } = await supabase.rpc(
      "claim_biker_code",
      { _company_code: code }
    );

    if (claimErr || !claimed) {
      setLoading(false);
      return setError(
        "Invalid or already-used Company Code. Contact support if you believe this is an error."
      );
    }

    // Step 4: persist the biker email in localStorage so the dashboard can identify the rider.
    localStorage.setItem("bikerEmail", syntheticEmail);

    setLoading(false);
    navigate("/bikers");
  };

  const inputClass =
    "w-full rounded-xl border bg-background px-3 py-3 text-base focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-navy-gradient sticky top-0 z-50">
        <div className="container flex items-center justify-center h-14 px-4">
          <span className="font-display font-bold text-lg text-primary-foreground tracking-tight">
            DREYPELLA<span className="text-red-brand"> RIDE</span>
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="bg-card rounded-2xl border p-6 sm:p-8 w-full max-w-sm animate-fade-in-up">
          <Link
            to="/bikers-login"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3"
          >
            <ArrowLeft size={12} /> Back to login
          </Link>

          <div className="text-center mb-6">
            <Bike size={40} className="mx-auto text-accent mb-3" />
            <h1 className="font-display font-bold text-xl">Biker Signup</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Use the company code you received on WhatsApp
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-xl mb-4 flex items-start gap-2 animate-shake">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className={inputClass}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone Number</label>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
                }
                required
                className={inputClass}
                placeholder="08012345678"
                maxLength={11}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Company Code</label>
              <input
                type="text"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                required
                className={`${inputClass} font-mono uppercase tracking-wider`}
                placeholder="DPR-XXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClass}
                placeholder="Min 8 chars (Aa1!)"
              />
              <p className="text-[11px] text-muted-foreground mt-1">{PASSWORD_ERROR}</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Sign Up as Biker"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default BikersSignup;
