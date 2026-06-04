/**
 * /reset-password — handles Supabase's password recovery redirect.
 *
 * NOTE: After deployment, add the deployed domain (e.g. https://yourdomain.com/reset-password)
 * to Supabase → Authentication → URL Configuration → Redirect URLs so the recovery
 * email link works on production as well.
 */
import PasswordInput from "@/components/PasswordInput";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PASSWORD_REGEX, PASSWORD_ERROR } from "@/lib/constants";
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Lock } from "lucide-react";

const calcStrength = (pw: string) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0-5
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Detect Supabase recovery session from URL
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setValidLink(true);
      }
    });
    // Fallback: if a session already exists OR hash contains recovery token
    (async () => {
      const hash = window.location.hash || "";
      const hasRecovery = hash.includes("type=recovery") || hash.includes("access_token");
      const { data } = await supabase.auth.getSession();
      if (data.session || hasRecovery) setValidLink(true);
      setReady(true);
    })();
    return () => sub.subscription.unsubscribe();
  }, []);

  const strength = useMemo(() => calcStrength(pw), [pw]);
  const strengthLabel = ["Too weak", "Weak", "Fair", "Good", "Strong", "Excellent"][strength];
  const strengthColor = [
    "bg-red-500", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-green-600",
  ][strength];

  const detectRoleAndRedirect = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    let target = "/auth";
    if (uid) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      const list = (roles || []).map((r: any) => r.role);
      if (list.includes("biker")) target = "/bikers-login";
      else if (list.includes("admin")) target = "/auth";
      else target = "/auth";
    }
    await supabase.auth.signOut();
    setTimeout(() => navigate(target, { replace: true }), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pw !== confirm) return setError("Passwords do not match. Please try again.");
    if (!PASSWORD_REGEX.test(pw)) return setError(PASSWORD_ERROR);
    setBusy(true);
    const { error: updErr } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (updErr) {
      const msg = updErr.message?.toLowerCase() || "";
      if (msg.includes("expired") || msg.includes("invalid") || msg.includes("token")) {
        return setError("This reset link is invalid or has expired. Please request a new password reset.");
      }
      return setError(updErr.message);
    }
    setSuccess(true);
    detectRoleAndRedirect();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <h1 className="font-display font-bold text-2xl tracking-tight">
            <span className="text-[#001F3F] dark:text-white">DREYPELLA</span>{" "}
            <span className="text-[#C8102E]">RIDE</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Reset your password</p>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8">
          {!ready ? (
            <div className="flex flex-col items-center py-10 text-muted-foreground">
              <Loader2 className="animate-spin mb-3" />
              <p className="text-sm">Verifying reset link…</p>
            </div>
          ) : success ? (
            <div className="text-center py-6 animate-scale-in">
              <CheckCircle2 size={56} className="mx-auto text-green-600 mb-3" />
              <h2 className="font-semibold text-lg mb-1">Password changed successfully!</h2>
              <p className="text-sm text-muted-foreground">Redirecting you to login…</p>
            </div>
          ) : !validLink ? (
            <div className="text-center py-4">
              <AlertCircle size={48} className="mx-auto text-destructive mb-3" />
              <h2 className="font-semibold mb-2">Invalid or expired link</h2>
              <p className="text-sm text-muted-foreground mb-5">
                This reset link is invalid or has expired. Please request a new password reset.
              </p>
              <button
                onClick={() => navigate("/auth")}
                className="bg-[#C8102E] hover:bg-[#a30d25] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#001F3F]/10 dark:bg-white/10 mx-auto mb-2">
                <KeyRound className="text-[#C8102E]" size={22} />
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg flex items-start gap-2 animate-shake">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">New Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Enter new password" className="w-full rounded-xl border border-border bg-background pl-9 py-2.5 text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none" required />
                </div>
                {pw && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : "bg-muted"}`}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Strength: {strengthLabel}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Confirm New Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter new password" className="w-full rounded-xl border border-border bg-background pl-9 py-2.5 text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none" required />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">{PASSWORD_ERROR}</p>

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-[#C8102E] hover:bg-[#a30d25] text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {busy ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : "Save New Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
