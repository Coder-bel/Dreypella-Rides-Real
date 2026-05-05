import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  isValidPhone,
  PHONE_ERROR,
  isValidPassword,
  PASSWORD_ERROR,
} from "@/lib/constants";
import ForgotPasswordDialog from "@/components/ForgotPasswordDialog";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgot, setShowForgot] = useState<null | "user" | "admin">(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleResend = async () => {
    if (!email.trim()) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setResending(false);
    if (error) setError(error.message);
    else setSuccess("Verification email resent! Check your inbox and spam folder.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setNeedsVerification(false);

    if (!isLogin) {
      if (!fullName.trim()) return setError("Full Name is required");
      if (!isValidPhone(phone)) return setError(PHONE_ERROR);
      if (!isValidPassword(password)) return setError(PASSWORD_ERROR);
    }

    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        const msg = error.message?.toLowerCase() || "";
        if (msg.includes("confirm") || msg.includes("not confirmed") || msg.includes("verify")) {
          setError("Please verify your email address before logging in. Check your inbox for the verification link.");
          setNeedsVerification(true);
        } else {
          setError(error.message);
        }
      } else {
        navigate("/dashboard");
      }
    } else {
      const { error } = await signUp(email, password, {
        full_name: fullName,
        phone,
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Registration successful! Please check your email inbox and click the verification link to activate your account. Didn't receive the email? Check your spam folder.");
        setNeedsVerification(true);
      }
    }
    setLoading(false);
  };

  const inputClass = "w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all";

  return (
    <div className="container px-4 py-8 max-w-md mx-auto">
      <h1 className="font-display font-bold text-xl mb-1 animate-fade-in-up text-center">
        {isLogin ? "Welcome Back" : "Create Account"}
      </h1>
      <p className="text-sm text-muted-foreground mb-6 animate-fade-in-up-delay-1 text-center">
        {isLogin ? "Sign in to book rides & manage your wallet" : "Join DREYPELLA RIDE today"}
      </p>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-xl mb-4 animate-shake">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 text-green-600 text-sm px-4 py-2 rounded-xl mb-4 animate-fade-in-up">
          {success}
        </div>
      )}
      {needsVerification && email.trim() && (
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="w-full text-sm text-accent font-medium hover:underline mb-4 disabled:opacity-60"
        >
          {resending ? "Resending..." : "Resend Verification Email"}
        </button>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up-delay-2">
        {!isLogin && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputClass} placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                required
                maxLength={11}
                className={inputClass}
                placeholder="08012345678"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputClass} placeholder={isLogin ? "Your password" : "8+ chars, letters + numbers + special"} />
          {!isLogin && (
            <p className="text-[11px] text-muted-foreground mt-1">{PASSWORD_ERROR}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
          ) : isLogin ? (
            <>
              <LogIn size={18} />
              Sign In
            </>
          ) : (
            <>
              <UserPlus size={18} />
              Create Account
            </>
          )}
        </button>
      </form>

      {isLogin && (
        <div className="text-center text-xs mt-3">
          <button onClick={() => setShowForgot("user")} className="text-accent hover:underline font-medium">
            Forgot Password?
          </button>
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground mt-6">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }}
          className="text-accent font-semibold hover:underline"
        >
          {isLogin ? "Sign Up" : "Sign In"}
        </button>
      </p>

      <ForgotPasswordDialog open={!!showForgot} onClose={() => setShowForgot(null)} role={showForgot || "user"} />
    </div>
  );
};

export default Auth;
