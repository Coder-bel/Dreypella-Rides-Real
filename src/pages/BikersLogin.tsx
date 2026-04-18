/**
 * Biker login — Company Code (DPR-XXXX) + Password only.
 * Internally signs in via the synthetic email derived from the code.
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bike, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { bikerCodeToEmail } from "@/lib/constants";

const BikersLogin = () => {
  const navigate = useNavigate();
  const [companyCode, setCompanyCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const code = companyCode.trim().toUpperCase();
    if (!/^DPR-\d{4}$/.test(code)) {
      return setError("Invalid Company Code format. Expected: DPR-XXXX");
    }
    if (!password) {
      return setError("Password is required");
    }

    setLoading(true);
    const syntheticEmail = bikerCodeToEmail(code);

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password,
    });

    setLoading(false);

    if (signInErr) {
      return setError("Invalid Company Code or password.");
    }

    localStorage.setItem("bikerEmail", syntheticEmail);
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

            <p className="text-xs text-center text-muted-foreground pt-2">
              No account yet?{" "}
              <Link to="/bikers-signup" className="text-accent font-semibold hover:underline">
                Sign up here
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default BikersLogin;
