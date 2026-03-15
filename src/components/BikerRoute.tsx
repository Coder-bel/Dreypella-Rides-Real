/**
 * Biker auth is separate for MVP. In production use proper role-based auth with Supabase metadata or Edge Functions.
 * Bikers can ONLY access /bikers and /bikers-login. No access to /admin or user routes.
 */
import { Navigate } from "react-router-dom";

const isBikerAuthenticated = () => {
  const flag = localStorage.getItem("isBiker");
  const expiry = localStorage.getItem("bikerExpiry");
  if (flag !== "true" || !expiry) return false;
  if (Date.now() > Number(expiry)) {
    localStorage.removeItem("isBiker");
    localStorage.removeItem("bikerExpiry");
    localStorage.removeItem("bikerEmail");
    return false;
  }
  return true;
};

const BikerRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isBikerAuthenticated()) {
    return <Navigate to="/bikers-login" replace />;
  }
  return <>{children}</>;
};

export default BikerRoute;
