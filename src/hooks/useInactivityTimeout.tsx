import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/hooks/useUserRole";

const TIMEOUT_MS: Record<string, number> = {
  admin: 15 * 60 * 1000,   // 15 minutes
  biker: 30 * 60 * 1000,   // 30 minutes
  user: 30 * 60 * 1000,    // 30 minutes
};

const STORAGE_KEY = "last_activity";

export const useInactivityTimeout = (
  role: UserRole | null,
  onTimeout: () => void
) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!role) return;
    const timeout = TIMEOUT_MS[role] || TIMEOUT_MS.user;
    timerRef.current = setTimeout(() => {
      onTimeout();
    }, timeout);
  }, [role, onTimeout]);

  // Check on mount if already timed out
  useEffect(() => {
    if (!role) return;
    const last = localStorage.getItem(STORAGE_KEY);
    if (last) {
      const elapsed = Date.now() - parseInt(last);
      const timeout = TIMEOUT_MS[role] || TIMEOUT_MS.user;
      if (elapsed > timeout) {
        onTimeout();
        return;
      }
    }
    resetTimer();
  }, [role]);

  // Listen for user activity
  useEffect(() => {
    if (!role) return;
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [role, resetTimer]);
};
