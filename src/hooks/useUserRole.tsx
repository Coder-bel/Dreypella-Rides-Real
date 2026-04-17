/**
 * Strict role-based access control implemented.
 * Determines the current user's role: 'admin', 'biker', or 'user'.
 * Biker role is detected via Supabase user_roles table (preferred) OR legacy localStorage flow.
 */
import { useEffect, useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "biker" | "user" | "guest";

export const useUserRole = (): { role: UserRole; loading: boolean } => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [isBikerSupabase, setIsBikerSupabase] = useState(false);
  const [bikerChecked, setBikerChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!user) {
        if (!cancelled) {
          setIsBikerSupabase(false);
          setBikerChecked(true);
        }
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "biker")
        .maybeSingle();
      if (!cancelled) {
        setIsBikerSupabase(!!data);
        setBikerChecked(true);
      }
    };
    if (!authLoading) check();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  // Legacy localStorage biker (kept for the existing whitelisted login flow)
  const legacyBiker = localStorage.getItem("isBiker") === "true";
  const bikerExpiry = localStorage.getItem("bikerExpiry");
  const legacyBikerValid =
    legacyBiker && bikerExpiry && Date.now() <= Number(bikerExpiry);

  if (legacyBikerValid) return { role: "biker", loading: false };
  if (authLoading || adminLoading || (user && !bikerChecked)) {
    return { role: "guest", loading: true };
  }
  if (isBikerSupabase) return { role: "biker", loading: false };
  if (isAdmin) return { role: "admin", loading: false };
  if (user) return { role: "user", loading: false };
  return { role: "guest", loading: false };
};
