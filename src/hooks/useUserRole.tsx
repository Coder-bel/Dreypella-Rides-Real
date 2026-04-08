/**
 * Strict role-based access control implemented.
 * Determines the current user's role: 'admin', 'biker', or 'user'.
 * Biker role is detected via localStorage (separate auth flow).
 * Admin role is checked via user_roles table.
 */
import { useAdmin } from "@/hooks/useAdmin";

export type UserRole = "admin" | "biker" | "user" | "guest";

export const useUserRole = (): { role: UserRole; loading: boolean } => {
  const { isAdmin, loading: adminLoading } = useAdmin();

  const isBiker = localStorage.getItem("isBiker") === "true";
  const bikerExpiry = localStorage.getItem("bikerExpiry");
  const bikerValid = isBiker && bikerExpiry && Date.now() <= Number(bikerExpiry);

  if (bikerValid) return { role: "biker", loading: false };
  if (adminLoading) return { role: "guest", loading: true };
  if (isAdmin) return { role: "admin", loading: false };
  return { role: "user", loading: false };
};
