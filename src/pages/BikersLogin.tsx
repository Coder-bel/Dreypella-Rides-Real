/**
 * Biker login — Company Code (DPR-XXXX) + Password only.
 * Internally signs in via the synthetic email derived from the code.
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bike, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ForgotPasswordDialog from "@/components/ForgotPasswordDialog";

const BikersLogin = () => {
  const navigate = useNavigate();
  const [companyCode, setCompanyCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [info, setInfo] = useState("");

  const handleResend = async (loginEmail: string) => {
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: loginEmail,
      options: { emailRedirectTo: `${window.location.origin}/bikers-login` },
    });
    setResending(false);
    if (error) setError(error.message);
    else setInfo("Verification email resent! Check your inbox and spam folder.");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setInfo(""); setNeedsVerification(false);

    const code = companyCode.trim().toUpperCase();
    if (!/^DPR-\d{4}$/.test(code)) {
      return setError("Invalid Company Code format. Expected: DPR-XXXX");
    }
    if (!password) {
      return setError("Password is required");
    }

    setLoading(true);
    const { data: emailLookup, error: lookupErr } = await supabase.rpc(
      "get_biker_login_email" as any,
      { _company_code: code }
    );

    if (lookupErr || !emailLookup) {
      setLoading(false);
      return setError("Invalid Company Code or password.");
    }

    const loginEmail = String(emailLookup);
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (signInErr) {
      setLoading(false);
      const msg = signInErr.message?.toLowerCase() || "";
      if (msg.includes("confirm") || msg.includes("not confirmed") || msg.includes("verify")) {
        setNeedsVerification(true);
        return setError("Please verify your email address before logging in. Check your inbox for the verification link.");
      }
      return setError("Invalid Company Code or password.");
    }

    // Claim pending biker code on first verified sign-in (post email-verification flow)
    const pending = localStorage.getItem("pendingBikerCode");
    if (pending) {
      const { data: claimed } = await supabase.rpc("claim_biker_code", { _company_code: pending });
      if (claimed) localStorage.removeItem("pendingBikerCode");
    }

    setLoading(false);
    localStorage.setItem("bikerEmail", loginEmail);
    navigate("/bikers");
  };

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
          <div className="text-center mb-6">
            <Bike size={40} className="mx-auto text-accent mb-3" />
            <h1 className="font-display font-bold text-xl">Bikers Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in with your Company Code and password
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-xl mb-4 flex items-start gap-2 animate-shake">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="bg-green-500/10 text-green-700 text-sm px-4 py-2 rounded-xl mb-3 animate-fade-in-up">
              {info}
            </div>
          )}
          {needsVerification && companyCode && (
            <button
              type="button"
              onClick={async () => {
                const code = companyCode.trim().toUpperCase();
                const { data } = await supabase.rpc("get_biker_login_email" as any, { _company_code: code });
                if (data) handleResend(String(data));
              }}
              disabled={resending}
              className="w-full text-sm text-accent font-medium hover:underline mb-4 disabled:opacity-60"
            >
              {resending ? "Resending..." : "Resend Verification Email"}
            </button>
          )}


          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Company Code</label>
              <input
                type="text"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                required
                placeholder="DPR-XXXX"
                className="w-full rounded-xl border bg-background px-3 py-3 text-base font-mono uppercase tracking-wider focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border bg-background px-3 py-3 text-base focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="text-xs text-center pt-1">
              <button type="button" onClick={() => setShowForgot(true)} className="text-accent font-medium hover:underline">
                Forgot Password?
              </button>
            </p>

            <p className="text-xs text-center text-muted-foreground pt-2">
              No account yet?{" "}
              <Link to="/bikers-signup" className="text-accent font-semibold hover:underline">
                Sign up here
              </Link>
            </p>
          </form>
        </div>
      </main>

      <ForgotPasswordDialog open={showForgot} onClose={() => setShowForgot(false)} role="biker" />
    </div>
  );
};

export default BikersLogin;
