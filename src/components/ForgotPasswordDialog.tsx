/**
 * Shared Forgot Password modal supporting all three roles.
 *  - user  → enters email
 *  - biker → enters Company Code + email
 *  - admin → enters email + phone (dual verification)
 * DEV MODE: OTP is returned by the edge function and shown on screen.
 */
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { isValidPhone, PASSWORD_REGEX, PASSWORD_ERROR } from "@/lib/constants";
import { AlertCircle, KeyRound, CheckCircle2 } from "lucide-react";

type Role = "user" | "biker" | "admin";
interface Props {
  open: boolean;
  onClose: () => void;
  role: Role;
}

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

const ForgotPasswordDialog = ({ open, onClose, role }: Props) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!open) {
      setStep(1); setPhone(""); setEmail(""); setCompanyCode(""); setOtp("");
      setNewPassword(""); setIdentifier(""); setDevOtp(""); setError(""); setCooldown(0);
    }
  }, [open]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendOtp = async () => {
    setError("");
    if (role === "user") {
      if (!EMAIL_REGEX.test(email.trim())) return setError("Enter a valid email address");
    }
    if (role === "biker") {
      if (!/^DPR-\d{4}$/.test(companyCode.trim().toUpperCase())) return setError("Company code format: DPR-XXXX");
      if (!EMAIL_REGEX.test(email.trim())) return setError("Enter a valid email address");
    }
    if (role === "admin") {
      if (!EMAIL_REGEX.test(email.trim())) return setError("Enter a valid email address");
      if (!isValidPhone(phone)) return setError("Phone must be exactly 11 digits");
    }
    setBusy(true);
    const body: any = { role };
    if (role === "user") body.email = email.trim();
    if (role === "biker") { body.company_code = companyCode.trim().toUpperCase(); body.email = email.trim(); }
    if (role === "admin") { body.email = email.trim(); body.phone = phone.trim(); }

    const { data, error: fnErr } = await supabase.functions.invoke("send-password-otp", { body });
    setBusy(false);
    if (fnErr || (data && data.error)) {
      return setError(data?.error || fnErr?.message || "Failed to send code");
    }
    let id = "";
    if (role === "user") id = email.trim().toLowerCase();
    if (role === "biker") id = companyCode.trim().toUpperCase();
    if (role === "admin") id = email.trim();
    setIdentifier(id);
    setDevOtp(data?.dev_otp || "");
    setStep(2);
    setCooldown(60);
  };

  const verifyAndReset = async () => {
    setError("");
    if (otp.length !== 6) return setError("Enter the 6-digit code");
    if (!PASSWORD_REGEX.test(newPassword)) return setError(PASSWORD_ERROR);
    setBusy(true);
    const { data, error: fnErr } = await supabase.functions.invoke("verify-password-otp", {
      body: { role, identifier, otp: otp.trim(), new_password: newPassword },
    });
    setBusy(false);
    if (fnErr || (data && data.error)) {
      return setError(data?.error || fnErr?.message || "Failed to reset");
    }
    setStep(3);
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
            {step === 1 && (role === "admin"
              ? "Enter your registered email and phone number. We'll verify both before sending a code."
              : role === "biker"
              ? "Enter your Company Code and registered email to receive a reset code."
              : "Enter your registered email to receive a reset code.")}
            {step === 2 && "Enter the 6-digit code and choose a new strong password."}
            {step === 3 && "Password reset successfully — you can now log in."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-lg flex items-start gap-2 animate-shake">
            <AlertCircle size={14} className="shrink-0 mt-0.5" /> <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            {role === "biker" && (
              <input className={inputCls + " font-mono uppercase"} placeholder="DPR-XXXX" value={companyCode} onChange={(e) => setCompanyCode(e.target.value.toUpperCase())} maxLength={8} />
            )}
            {(role === "user" || role === "biker" || role === "admin") && (
              <input className={inputCls} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            )}
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
              onClick={sendOtp}
              className="w-full bg-accent text-accent-foreground font-semibold py-2.5 rounded-xl disabled:opacity-60"
            >
              {busy ? "Sending..." : "Send Reset Code"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {devOtp && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400 text-xs p-3 rounded-lg">
                <p className="font-semibold mb-1">DEV MODE — your OTP:</p>
                <p className="font-mono text-lg tracking-widest">{devOtp}</p>
                <p className="mt-1 opacity-75">In production this is delivered to your email.</p>
              </div>
            )}
            <input
              className={inputCls + " font-mono text-center text-lg tracking-widest"}
              placeholder="6-digit code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <input
              className={inputCls}
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">{PASSWORD_ERROR}</p>
            <button
              disabled={busy}
              onClick={verifyAndReset}
              className="w-full bg-accent text-accent-foreground font-semibold py-2.5 rounded-xl disabled:opacity-60"
            >
              {busy ? "Resetting..." : "Reset Password"}
            </button>
            <button
              disabled={cooldown > 0 || busy}
              onClick={sendOtp}
              className="w-full text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-4">
            <CheckCircle2 size={48} className="mx-auto text-green-600 mb-3" />
            <p className="text-sm font-medium mb-4">Your password has been updated.</p>
            <button onClick={onClose} className="bg-accent text-accent-foreground font-semibold px-6 py-2.5 rounded-xl">
              Back to Login
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
