/**
 * Admin role check hook. Uses server-side user_roles table via has_role() security definer function.
 * Security note for MVP: Client-side check. For production, move admin data fetches
 * to edge functions with service role key to prevent unauthorized access.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("admin_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      setIsAdmin(!!data && !error);
      setLoading(false);
    };

    if (!authLoading) checkAdmin();
  }, [user, authLoading]);

  return { isAdmin, loading: loading || authLoading };
};
