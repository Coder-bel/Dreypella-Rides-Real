import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck } from "lucide-react";
import { UserRole } from "@/hooks/useUserRole";

interface Props {
  open: boolean;
  role: UserRole | null;
}

const loginRoute: Record<string, string> = {
  admin: "/admin-login",
  biker: "/bikers-login",
  user: "/auth",
};

const SessionExpiredModal = ({ open, role }: Props) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!open) return;
    setCountdown(10);

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          handleLogout();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("last_activity");
    const route = loginRoute[role || "user"] || "/auth";
    navigate(route, { replace: true });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border p-6 max-w-sm w-full text-center animate-fade-in-up">
        <ShieldCheck size={40} className="mx-auto text-accent mb-3" />
        <h2 className="font-display font-bold text-lg mb-2">Session Expired</h2>
        <p className="text-sm text-muted-foreground mb-4">
          You've been inactive for too long. For your security, you'll be logged out automatically.
        </p>
        <div className="bg-accent/10 rounded-xl p-3 mb-4">
          <p className="text-2xl font-bold text-accent">{countdown}s</p>
          <p className="text-xs text-muted-foreground">Redirecting to login...</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full bg-accent text-accent-foreground font-semibold py-2.5 rounded-xl"
        >
          Log Out Now
        </button>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
