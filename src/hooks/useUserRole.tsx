/**
 * Strict role-based access control implemented.
 * Determines the current user's role: 'admin', 'biker', or 'user'.
 * Biker role is detected via Supabase user_roles table.
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "biker" | "user";

export const useUserRole = (): { role: UserRole | null; loading: boolean } => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRole = async () => {
      if (!user) {
        if (!cancelled) {
          setRole("null");
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        if (error || !data) {
          setRole("user"); // default to user if no role found
        } else {
          setRole(data.role as UserRole);
        }
        setLoading(false);
      }
    };

    if (!authLoading) fetchRole();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  if (authLoading) return { role: "null", loading: true };

  return { role, loading };
};








