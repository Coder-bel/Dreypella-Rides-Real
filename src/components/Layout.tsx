import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bus, Package, Home, User, Menu, X, Moon, Sun, LogIn, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const navItems = [
    { path: "/", label: "Home", icon: Home, requiresAuth: false },
    { path: "/book-ride", label: "Book Ride", icon: Bus, requiresAuth: true },
    { path: "/send-package", label: "Send", icon: Package, requiresAuth: true },
    { path: user ? "/dashboard" : "/auth", label: user ? "Dashboard" : "Login", icon: user ? User : LogIn, requiresAuth: false },
    ...(isAdmin ? [{ path: "/admin", label: "Admin", icon: Shield, requiresAuth: true }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navbar */}
      <header className="bg-navy-gradient sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="font-display font-bold text-lg text-primary-foreground tracking-tight">
            DREYPELLA<span className="text-red-brand"> RIDE</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-lg text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              aria-label="Toggle dark mode"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <nav className="hidden md:flex items-center gap-1">
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
          </div>
        </div>

        {menuOpen && (
          <nav className="md:hidden border-t border-primary-foreground/10 animate-fade-in-up">
            {navItems.map((item) => (
              <Link
                key={item.path + item.label}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary-foreground/10 text-primary-foreground"
                    : "text-primary-foreground/60 hover:bg-primary-foreground/5"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* Mobile bottom nav */}
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

      <div className="md:hidden h-16" />
    </div>
  );
};

export default Layout;
