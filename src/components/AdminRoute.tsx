/**
 * Strict role-based access control implemented.
 * Admin-only route. Redirects bikers to /bikers, regular users to /dashboard,
 * unauthenticated visitors to /auth. Shows a clear "Access Denied" toast.
 */
import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading } = useUserRole();

  useEffect(() => {
    if (!loading && !authLoading && user && role !== "admin") {
      toast.error("Access Denied. You do not have permission to view this page.");
    }
  }, [loading, authLoading, user, role]);


  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Hard deny: admin route must never render for non-admin roles.
  if (role !== "admin") {
    if (role === "user") return <Navigate to="/dashboard" replace />;
    if (role === "biker") return <Navigate to="/bikers" replace />;
    return <Navigate to="/auth" replace />;
  }


  return <>{children}</>;
};

export default AdminRoute;
