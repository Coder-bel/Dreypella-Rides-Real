/**
 * Strict role-based access control implemented.
 * Wraps regular-user-only pages (Book Ride, Send Package, Dashboard).
 * Admins are redirected to /admin, bikers to /bikers, guests to /auth.
 */
import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

const UserRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading } = useUserRole();

  useEffect(() => {
    if (!loading && !authLoading && user && (role === "admin" || role === "biker")) {
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

  // Hard deny: users must never render when they are actually admin/biker.
  if (!user) return <Navigate to="/auth" replace />;
  if (role !== "user") {
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "biker") return <Navigate to="/bikers" replace />;
    return <Navigate to="/auth" replace />;
  }


  return <>{children}</>;
};

export default UserRoute;
