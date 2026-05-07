/**
 * Strict role-based access control implemented.
 * Biker-only route. Accepts only Supabase 'biker' role.
 * Redirects admins to /admin, regular users to /dashboard, guests to /bikers-login.
 */
import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

const BikerRoute = ({ children }: { children: React.ReactNode }) => {
  const { role, loading } = useUserRole();

  useEffect(() => {
    if (!loading && role !== "biker" && role !== "guest") {
      toast.error("Access Denied. You do not have permission to view this page.");
    }
  }, [loading, role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (role === "biker") return <>{children}</>;
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "user") return <Navigate to="/dashboard" replace />;
  return <Navigate to="/bikers-login" replace />;
};

export default BikerRoute;
