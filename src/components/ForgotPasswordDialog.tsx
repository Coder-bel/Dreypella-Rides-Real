/**
 * Shared Forgot Password modal — uses Supabase's built-in password reset email
 * (resetPasswordForEmail) with redirectTo /reset-password.
 *
 *  - user  → enters email
 *  - biker → enters Company Code (DPR-XXXX) + email; verifies they match the bikers row
 *  - admin → enters email + phone; verifies both match an admins row
 */
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { isValidPhone } from "@/lib/constants";
import { AlertCircle, KeyRound, CheckCircle2 } from "lucide-react";

type Role = "user" | "biker" | "admin";
interface Props {
  open: boolean;
  onClose: () => void;
  role: Role;
}

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

const ForgotPasswordDialog = ({ open, onClose, role }: Props) => {
  const [email, setEmail] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmail(""); setCompanyCode(""); setPhone("");
      setError(""); setBusy(false); setDone(false);
    }
  }, [open]);

  const sendResetLink = async () => {
    setError("");
    const targetEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(targetEmail)) return setError("Enter a valid email address");

    if (role === "biker") {
      const code = companyCode.trim().toUpperCase();
      if (!/^DPR-\d{4}$/.test(code)) return setError("Company code format: DPR-XXXX");
    }
    if (role === "admin" && !isValidPhone(phone)) {
      return setError("Phone must be exactly 11 digits");
    }

    setBusy(true);

    // Verify identity on the role-specific table BEFORE sending the reset email.
    if (role === "biker") {
      const code = companyCode.trim().toUpperCase();
      const { data } = await supabase
        .from("bikers")
        .select("email")
        .eq("company_code", code)
        .maybeSingle();
      if (!data || (data.email || "").toLowerCase() !== targetEmail) {
        setBusy(false);
        return setError("Company Code and email do not match our records.");
      }
    }
    if (role === "admin") {
      const { data } = await supabase
        .from("admins")
        .select("email, phone")
        .eq("email", targetEmail)
        .maybeSingle();
      if (!data || (data.phone || "").trim() !== phone.trim()) {
        setBusy(false);
        return setError("Email and phone do not match our admin records.");
      }
    }

    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (resetErr) return setError(resetErr.message);
    setDone(true);
  };

  const inputCls = "w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound size={18} className="text-accent" /> Reset {role === "admin" ? "Admin" : role === "biker" ? "Biker" : "Account"} Password
          </DialogTitle>
          <DialogDescription>
            {!done && (role === "admin"
              ? "Enter your registered email and phone number. We'll verify both before emailing a reset link."
              : role === "biker"
              ? "Enter your Company Code and registered email to receive a password reset link."
              : "Enter your registered email to receive a password reset link.")}
            {done && "Reset link sent — check your inbox."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg flex items-start gap-2 animate-shake">
            <AlertCircle size={14} className="shrink-0 mt-0.5" /> <span>{error}</span>
          </div>
        )}

        {!done ? (
          <div className="space-y-3">
            {role === "biker" && (
              <input className={inputCls + " font-mono uppercase"} placeholder="DPR-XXXX" value={companyCode} onChange={(e) => setCompanyCode(e.target.value.toUpperCase())} maxLength={8} />
            )}
            <input className={inputCls} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            {role === "admin" && (
              <input
                className={inputCls}
                type="tel"
                placeholder="Phone (11 digits)"
                value={phone}
                maxLength={11}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              />
            )}
            <button
              disabled={busy}
              onClick={sendResetLink}
              className="w-full bg-accent text-accent-foreground font-semibold py-2.5 rounded-xl disabled:opacity-60"
            >
              {busy ? "Sending..." : "Send Reset Link"}
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <CheckCircle2 size={48} className="mx-auto text-green-600 mb-3" />
            <p className="text-sm font-medium mb-2">Password reset link sent!</p>
            <p className="text-xs text-muted-foreground mb-4">
              Check your email inbox (and spam folder). Click the link to set a new password.
            </p>
            <button onClick={onClose} className="bg-accent text-accent-foreground font-semibold px-6 py-2.5 rounded-xl">
              Close
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
