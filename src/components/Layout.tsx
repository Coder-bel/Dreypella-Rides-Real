/**
 * Strict role-based access control implemented.
 * Single unified navbar across all pages. Role-aware title and navigation.
 */
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bus, Package, Home, User, Moon, Sun, LogIn, LogOut, MessageCircle, Shield, Bike } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { SUPPORT_WHATSAPP } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

interface ProfileInfo {
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  company_code?: string | null;
  plate_number?: string | null;
}

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { role } = useUserRole();
  const [dark, setDark] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileInfo, setProfileInfo] = useState<ProfileInfo>({});

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const isBiker = role === "biker";
  const isAdmin = role === "admin";
  const bikerEmail = localStorage.getItem("bikerEmail") || "";

  // Fetch role-specific profile when dropdown is opened
  useEffect(() => {
    if (!showProfile) return;
    const load = async () => {
      if (isBiker && user) {
        // Supabase biker — read from bikers table
        const { data } = await supabase
          .from("bikers")
          .select("full_name, whatsapp_number, company_code, plate_number, email")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) {
          setProfileInfo({
            full_name: data.full_name,
            phone: data.whatsapp_number,
            email: data.email,
            company_code: data.company_code,
            plate_number: data.plate_number,
          });
        }
      } else if (isBiker && !user) {
        // Legacy localStorage biker
        setProfileInfo({ email: bikerEmail, full_name: "Rider" });
      } else if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("user_id", user.id)
          .maybeSingle();
        setProfileInfo({
          full_name: data?.full_name,
          phone: data?.phone,
          email: user.email,
        });
      }
    };
    load();
  }, [showProfile, user, isBiker, bikerEmail]);

  const handleLogout = async () => {
    if (isBiker) {
      localStorage.removeItem("isBiker");
      localStorage.removeItem("bikerExpiry");
      localStorage.removeItem("bikerEmail");
      navigate("/bikers-login");
    } else {
      await signOut();
      navigate("/");
    }
  };

  // Clean navbar title — no role suffix
  const roleSuffix = "";

  // For bikers and admins: only show profile + logout (no navigation links)
  const showNavLinks = !isBiker && !isAdmin;

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/book-ride", label: "Book Ride", icon: Bus },
    { path: "/send-package", label: "Send", icon: Package },
    { path: user ? "/dashboard" : "/auth", label: user ? "Dashboard" : "Login", icon: user ? User : LogIn },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Single unified navbar */}
      <header className="bg-navy-gradient sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to={isBiker ? "/bikers" : isAdmin ? "/admin" : "/"} className="font-display font-bold text-lg text-primary-foreground tracking-tight">
            DREYPELLA<span className="text-red-brand"> RIDE</span>
            {roleSuffix && <span className="text-primary-foreground/60 text-sm ml-2">{roleSuffix}</span>}
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-lg text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Profile icon for logged-in users, admins, bikers */}
            {(user || isBiker) && (
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="p-2 rounded-lg text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                aria-label="Profile"
              >
                <User size={18} />
              </button>
            )}

            {/* Logout for logged-in users, admins, bikers */}
            {(user || isBiker) && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            )}

            {/* Desktop nav links — only for regular users */}
            {showNavLinks && (
              <nav className="hidden md:flex items-center gap-1 ml-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path + item.label}
                    to={item.path}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? "bg-primary-foreground/15 text-primary-foreground"
                        : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </div>
      </header>

      {/* Profile dropdown */}
      {showProfile && (
        <div className="container px-4 max-w-md mx-auto relative z-40">
          <div className="bg-card rounded-xl border p-4 mt-2 animate-fade-in-up shadow-lg">
            <h3 className="font-display font-semibold text-sm mb-2">Profile</h3>
            <div className="text-sm space-y-1">
              {isBiker ? (
                <>
                  <p><span className="text-muted-foreground">Email:</span> {bikerEmail}</p>
                  <p><span className="text-muted-foreground">Role:</span> Rider</p>
                </>
              ) : user ? (
                <>
                  <p><span className="text-muted-foreground">Email:</span> {user.email}</p>
                  <p><span className="text-muted-foreground">Role:</span> {isAdmin ? "Admin" : "User"}</p>
                </>
              ) : null}
            </div>
            <button
              onClick={() => setShowProfile(false)}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">{children}</main>

      {/* Footer with Support Contact */}
      <footer className="hidden md:block border-t bg-card py-6">
        <div className="container px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} DREYPELLA RIDE. All rights reserved.
          </p>
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent("Hello DREYPELLA support, I need help.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#25D366] hover:underline"
          >
            <MessageCircle size={14} fill="#25D366" />
            Support / Admin Contact
          </a>
        </div>
      </footer>

      {/* Mobile bottom nav — only for regular users */}
      {showNavLinks && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50">
          <div className="flex">
            {navItems.map((item) => (
              <Link
                key={item.path + item.label}
                to={item.path}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  location.pathname === item.path ? "text-accent" : "text-muted-foreground"
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {showNavLinks && <div className="md:hidden h-16" />}
    </div>
  );
};

export default Layout;
