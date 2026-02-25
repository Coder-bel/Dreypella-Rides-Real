/**
 * Admin dashboard - only accessible to users with 'admin' role in user_roles table.
 * Security note: Client-side check for MVP. For production, move admin data fetches
 * to edge functions with service role key to prevent unauthorized access.
 * 
 * Available pickup points, dates & times, and exact prices are placeholders/hardcoded for MVP.
 * These will be managed dynamically from this admin page later.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Package, Bus, ArrowLeft, LogOut, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchData = async () => {
    const [bRes, dRes] = await Promise.all([
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("dispatches").select("*").order("created_at", { ascending: false }),
    ]);
    if (bRes.data) setBookings(bRes.data);
    if (dRes.data) setDispatches(dRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "dispatches" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const confirmBooking = async (id: string) => {
    setUpdating(id);
    await supabase.from("bookings").update({ status: "confirmed" }).eq("id", id);
    setUpdating(null);
  };

  const markDelivered = async (id: string) => {
    setUpdating(id);
    await supabase.from("dispatches").update({ status: "completed" }).eq("id", id);
    setUpdating(null);
  };

  const pendingBookings = bookings.filter((b) => b.status !== "confirmed");
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const pendingDispatches = dispatches.filter((d) => d.status !== "completed");
  const completedDispatches = dispatches.filter((d) => d.status === "completed");

  return (
    <div className="container px-4 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-display font-bold text-xl">Admin Panel</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Refresh">
            <RefreshCw size={18} />
          </button>
          <button onClick={async () => { await signOut(); navigate("/"); }} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-fade-in-up-delay-1">
        {[
          { label: "Pending Rides", value: pendingBookings.length, color: "text-accent" },
          { label: "Confirmed Rides", value: confirmedBookings.length, color: "text-green-600" },
          { label: "Pending Packages", value: pendingDispatches.length, color: "text-accent" },
          { label: "Completed Packages", value: completedDispatches.length, color: "text-green-600" },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl p-4 border text-center">
            <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending Bookings */}
      <section className="mb-8 animate-fade-in-up-delay-2">
        <h2 className="font-display font-semibold text-base mb-3 flex items-center gap-2">
          <Bus size={18} className="text-accent" /> Pending Ride Bookings
        </h2>
        {pendingBookings.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-card rounded-xl p-4 border">No pending bookings.</p>
        ) : (
          <div className="space-y-2">
            {pendingBookings.map((b) => (
              <div key={b.id} className="bg-card rounded-xl p-4 border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold">{b.route}</p>
                    <p className="text-muted-foreground">{b.travel_date} • {b.pickup} • {b.passengers} seat(s)</p>
                    <p className="text-muted-foreground">₦{Number(b.price).toLocaleString()}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent capitalize">{b.status?.replace(/_/g, " ")}</span>
                  </div>
                  <button
                    onClick={() => confirmBooking(b.id)}
                    disabled={updating === b.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    <CheckCircle size={16} />
                    {updating === b.id ? "Updating..." : "Confirm Payment"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending Dispatches */}
      <section className="mb-8">
        <h2 className="font-display font-semibold text-base mb-3 flex items-center gap-2">
          <Package size={18} className="text-accent" /> Pending Package Deliveries
        </h2>
        {pendingDispatches.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-card rounded-xl p-4 border">No pending deliveries.</p>
        ) : (
          <div className="space-y-2">
            {pendingDispatches.map((d) => (
              <div key={d.id} className="bg-card rounded-xl p-4 border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 text-sm">
                    <p className="font-mono text-accent font-bold">{d.tracking_id}</p>
                    <p className="font-semibold">{d.pickup} → {d.dropoff}</p>
                    <p className="text-muted-foreground">{d.package_type} • {d.delivery_type}</p>
                    <p className="text-muted-foreground">₦{Number(d.price).toLocaleString()}</p>
                    <p className="text-muted-foreground text-xs">Sender: {d.sender_phone} • Receiver: {d.receiver_phone}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent capitalize">{d.status?.replace(/_/g, " ")}</span>
                  </div>
                  <button
                    onClick={() => markDelivered(d.id)}
                    disabled={updating === d.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    <CheckCircle size={16} />
                    {updating === d.id ? "Updating..." : "Mark Delivered"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Future placeholders */}
      <section className="bg-card rounded-xl p-6 border text-center text-sm text-muted-foreground">
        <p className="font-display font-semibold mb-1">Coming Soon</p>
        <p>Manage trips (add/edit dates, times, pickup points), view all users, analytics.</p>
      </section>
    </div>
  );
};

export default Admin;
