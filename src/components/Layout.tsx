/**
 * Strict role-based access control implemented.
 * Single unified navbar across all pages. Role-aware title and navigation.
 */
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bus, Package, Chrome as Home, User, Moon, Sun, LogIn, LogOut, MessageCircle, Shield, Bike, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { isValidPhone, PHONE_ERROR } from "@/lib/constants";
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
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPlate, setEditPlate] = useState("");
  const [editBusy, setEditBusy] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const isBiker = role === "biker";
  const isAdmin = role === "admin";

  // Fetch role-specific profile when dropdown is opened
  useEffect(() => {
    if (!showProfile) return;
    const load = async () => {
      if (isBiker && user) {
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
      } else if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, phone_number")
          .eq("id", user.id)
          .maybeSingle();
        setProfileInfo({
          full_name: data?.full_name,
          phone: data?.phone_number,
          email: user.email,
        });
      }
    };
    load();
  }, [showProfile, user, isBiker]);

  const handleLogout = async () => {
    await signOut();
    navigate(isBiker ? "/bikers-login" : "/");
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

      {/* Profile dropdown — role-specific */}
      {showProfile && (
        <div className="container px-4 max-w-md mx-auto relative z-40">
          <div className="bg-card rounded-xl border p-4 mt-2 animate-fade-in-up shadow-lg">
            <div className="flex items-center gap-3 mb-3 pb-3 border-b">
              <div className={`p-2.5 rounded-full ${isAdmin ? "bg-accent/15" : isBiker ? "bg-blue-500/15" : "bg-secondary"}`}>
                {isAdmin ? <Shield size={20} className="text-accent" /> : isBiker ? <Bike size={20} className="text-blue-600" /> : <User size={20} className="text-accent" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm truncate">{profileInfo.full_name || (isAdmin ? "Administrator" : isBiker ? "Rider" : "User")}</p>
                <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                  isAdmin ? "bg-accent/15 text-accent" : isBiker ? "bg-blue-500/15 text-blue-600" : "bg-secondary text-foreground"
                }`}>
                  {isAdmin ? "Admin" : isBiker ? "Biker" : "User"}
                </span>
              </div>
            </div>
            <div className="text-sm space-y-1.5">
              {isAdmin ? (
                <p><span className="text-muted-foreground">Email:</span> {user?.email}</p>
              ) : isBiker ? (
                <>
                  {profileInfo.email && <p className="break-all"><span className="text-muted-foreground">Email:</span> {profileInfo.email}</p>}
                  {profileInfo.phone && <p><span className="text-muted-foreground">Phone:</span> {profileInfo.phone}</p>}
                  {profileInfo.company_code && <p><span className="text-muted-foreground">Company Code:</span> <span className="font-mono font-bold text-accent">{profileInfo.company_code}</span></p>}
                  {profileInfo.plate_number && <p><span className="text-muted-foreground">Bike / Plate:</span> {profileInfo.plate_number}</p>}
                </>
              ) : (
                <>
                  {profileInfo.full_name && <p><span className="text-muted-foreground">Name:</span> {profileInfo.full_name}</p>}
                  {profileInfo.phone && <p><span className="text-muted-foreground">Phone:</span> {profileInfo.phone}</p>}
                  <p><span className="text-muted-foreground">Email:</span> {user?.email}</p>
                </>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3">
              {isBiker && user && (
                <button
                  onClick={() => {
                    setEditName(profileInfo.full_name || "");
                    setEditPhone(profileInfo.phone || "");
                    setEditPlate(profileInfo.plate_number || "");
                    setEditOpen(true);
                    setShowProfile(false);
                  }}
                  className="text-xs flex items-center gap-1 text-accent font-medium hover:underline"
                >
                  <Pencil size={12} /> Edit Profile
                </button>
              )}
              <button
                onClick={() => setShowProfile(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Biker Edit Profile Modal */}
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil size={16} /> Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <input
              className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
              placeholder="Full Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <input
              className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
              placeholder="Phone (11 digits)"
              maxLength={11}
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
            />
            <input
              className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
              placeholder="Bike Model / Plate"
              value={editPlate}
              onChange={(e) => setEditPlate(e.target.value)}
            />
            <button
              disabled={editBusy}
              onClick={async () => {
                if (!editName.trim()) return toast({ title: "Name required", variant: "destructive" });
                if (!isValidPhone(editPhone)) return toast({ title: PHONE_ERROR, variant: "destructive" });
                setEditBusy(true);
                const { error } = await supabase
                  .from("bikers")
                  .update({ full_name: editName.trim(), whatsapp_number: editPhone.trim(), plate_number: editPlate.trim() || null })
                  .eq("user_id", user!.id);
                setEditBusy(false);
                if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
                toast({ title: "Profile updated" });
                setProfileInfo({ ...profileInfo, full_name: editName.trim(), phone: editPhone.trim(), plate_number: editPlate.trim() });
                setEditOpen(false);
              }}
              className="w-full bg-accent text-accent-foreground font-semibold py-2.5 rounded-xl disabled:opacity-60"
            >
              {editBusy ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

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
