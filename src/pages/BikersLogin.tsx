/**
 * Biker auth is separate for MVP. In production use proper role-based auth with Supabase metadata or Edge Functions.
 * No links to this page from main site or admin.
 * If biker email is not yet registered → show signup form with WhatsApp number.
 * If already registered → show login form (password only).
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bike, AlertCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ALLOWED_BIKER_EMAILS, BIKER_PASSWORD } from "@/lib/constants";

type Step = "email" | "signup" | "login";

const BikersLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateNigerianPhone = (phone: string) => {
    const cleaned = phone.trim().replace(/\s+/g, "");
    return /^(\+234|0)\d{10}$/.test(cleaned);
  };

  const normalizePhone = (phone: string) => {
    const cleaned = phone.trim().replace(/\s+/g, "");
    if (cleaned.startsWith("0")) return "+234" + cleaned.slice(1);
    return cleaned;
  };

  const setSession = (normalizedEmail: string) => {
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem("isBiker", "true");
    localStorage.setItem("bikerExpiry", String(expiry));
    localStorage.setItem("bikerEmail", normalizedEmail);
    navigate("/bikers");
  };

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();

    if (!ALLOWED_BIKERS.includes(normalizedEmail)) {
      setError("This email is not authorized as a biker");
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from("bikers")
      .select("email")
      .eq("email", normalizedEmail)
      .maybeSingle();
    setLoading(false);

    if (data) {
      setStep("login");
    } else {
      setStep("signup");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== BIKER_PASSWORD) {
      setError("Invalid password");
      return;
    }
    setSession(email.trim().toLowerCase());
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== BIKER_PASSWORD) {
      setError("Invalid biker password");
      return;
    }

    if (!validateNigerianPhone(whatsapp)) {
      setError("Enter a valid Nigerian phone number (+234xxxxxxxxxx or 0xxxxxxxxxx)");
      return;
    }

    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizePhone(whatsapp);

    const { error: insertError } = await supabase
      .from("bikers")
      .insert({ email: normalizedEmail, whatsapp_number: normalizedPhone });

    setLoading(false);

    if (insertError) {
      setError("Registration failed. Please try again.");
      return;
    }

    setSession(normalizedEmail);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-navy-gradient sticky top-0 z-50">
        <div className="container flex items-center justify-center h-14 px-4">
          <span className="font-display font-bold text-lg text-primary-foreground tracking-tight">
            DREYPELLA<span className="text-red-brand"> RIDE</span>
            <span className="text-primary-foreground/60 text-sm ml-2">– Bikers</span>
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-card rounded-2xl border p-8 w-full max-w-sm animate-fade-in-up">
          <div className="text-center mb-6">
            <Bike size={40} className="mx-auto text-accent mb-3" />
            <h1 className="font-display font-bold text-xl">Bikers Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {step === "email" && "Enter your email to continue"}
              {step === "login" && "Welcome back – sign in"}
              {step === "signup" && "Register as a new rider"}
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-xl mb-4 flex items-center gap-2 animate-shake">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Step 1: Email check */}
          {step === "email" && (
            <form onSubmit={handleEmailCheck} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-60"
              >
                {loading ? "Checking..." : "Continue"}
              </button>
            </form>
          )}

          {/* Step 2a: Login (existing biker) */}
          {step === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <button type="button" onClick={() => { setStep("email"); setError(""); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
                <ArrowLeft size={12} /> Change email
              </button>
              <p className="text-sm text-muted-foreground mb-2">Signing in as <span className="font-medium text-foreground">{email}</span></p>
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-60"
              >
                Sign In
              </button>
            </form>
          )}

          {/* Step 2b: Signup (new biker) */}
          {step === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <button type="button" onClick={() => { setStep("email"); setError(""); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
                <ArrowLeft size={12} /> Change email
              </button>
              <p className="text-sm text-muted-foreground mb-2">Registering as <span className="font-medium text-foreground">{email}</span></p>
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">WhatsApp Number</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  required
                  placeholder="+234XXXXXXXXXX or 0XXXXXXXXXX"
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                />
                <p className="text-xs text-muted-foreground mt-1">This number will be shared with senders when you accept a delivery</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-60"
              >
                {loading ? "Registering..." : "Register & Sign In"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default BikersLogin;
