/**
 * Strict role-based access control implemented.
 * Determines the current user's role: 'admin', 'biker', or 'user'.
 * Biker role is detected via Supabase user_roles table.
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
      // Detect biker via public.bikers.status column.
      // App convention: status === 'Active' means the biker can access biker routes.
      const { data } = await supabase
        .from("bikers")
        .select("id, status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setIsBikerSupabase(!!data && data.status === "Active");
        setBikerChecked(true);
      }

    };
    if (!authLoading) check();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  if (authLoading || adminLoading || (user && !bikerChecked)) {
    return { role: "guest", loading: true };
  }
  if (isBikerSupabase) return { role: "biker", loading: false };
  if (isAdmin) return { role: "admin", loading: false };
  if (user) return { role: "user", loading: false };
  return { role: "guest", loading: false };
};
