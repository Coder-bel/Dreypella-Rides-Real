/**
 * Payments are manual via Opay transfer. Admin verifies manually and updates booking status to 'Confirmed'.
 * Friendly status messages update in real-time when admin changes payment status.
 */
import { useState, useEffect } from "react";
import { Bus, Package, Clock, LogOut, X, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import SupportWhatsApp from "@/components/SupportWhatsApp";
import { SUPPORT_WHATSAPP } from "@/lib/constants";

const friendlyStatus: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "Awaiting payment confirmation", color: "bg-yellow-500/10 text-yellow-600" },
  confirmed: { label: "Payment confirmed – ready for your trip", color: "bg-blue-500/10 text-blue-600" },
  completed: { label: "Trip completed – thank you!", color: "bg-green-500/10 text-green-600" },
  cancelled: { label: "Booking cancelled", color: "bg-red-500/10 text-red-500" },
};

const dispatchStatusLabel: Record<string, { label: string; color: string }> = {
  pending_delivery: { label: "Pending Delivery & Payment", color: "bg-yellow-500/10 text-yellow-600" },
  assigned: { label: "Rider assigned – on the way!", color: "bg-blue-500/10 text-blue-600" },
  completed: { label: "Package delivered successfully – thank you!", color: "bg-green-500/10 text-green-600" },
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const fetchData = async () => {
    if (!user) return;
    const [bookingsRes, dispatchRes] = await Promise.all([
      supabase.from("bookings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("dispatches").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    if (bookingsRes.data) setBookings(bookingsRes.data);
    if (dispatchRes.data) setDispatches(dispatchRes.data);
  };

  useEffect(() => { fetchData(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "dispatches", filter: `user_id=eq.${user.id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const upcomingBookings = bookings.filter((b) => new Date(b.travel_date) >= new Date());

  const stats = [
    { icon: Bus, label: "Rides", value: String(bookings.length), color: "text-accent" },
    { icon: Package, label: "Dispatches", value: String(dispatches.length), color: "text-accent" },
    { icon: Clock, label: "Upcoming", value: String(upcomingBookings.length), color: "text-accent" },
  ];

  return (
    <div className="container px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-1 animate-fade-in-up">
        <h1 className="font-display font-bold text-xl">Dashboard</h1>
        <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors p-2">
          <LogOut size={18} />
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-6 animate-fade-in-up-delay-1">
        Welcome, {user?.email}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-in-up-delay-2">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card rounded-xl p-4 border text-center hover-lift">
            <stat.icon size={20} className={`mx-auto mb-2 ${stat.color}`} />
            <p className="text-lg font-display font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Support Contact */}
      <div className="mb-4 animate-fade-in-up-delay-2">
        <SupportWhatsApp label="Contact Support" className="w-full justify-center" />
      </div>

      {/* Upcoming Trips */}
      {upcomingBookings.length > 0 && (
        <div className="mb-4">
          <h3 className="font-display font-semibold text-sm mb-2">Upcoming Trips</h3>
          <div className="space-y-2">
            {upcomingBookings.map((b) => {
              const daysLeft = Math.ceil((new Date(b.travel_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <div key={b.id} onClick={() => setSelectedBooking(b)} className="bg-card rounded-xl p-3 border text-sm cursor-pointer hover-lift transition-all">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{b.route}</p>
                      <p className="text-xs text-muted-foreground">{b.travel_date} • {b.pickup}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${friendlyStatus[b.status]?.color || "bg-accent/10 text-accent"}`}>
                        {friendlyStatus[b.status]?.label || b.status.replace(/_/g, " ")}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{daysLeft > 0 ? `${daysLeft}d left` : "Today"}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ride History */}
      {bookings.length > 0 && (
        <div className="mb-4">
          <h3 className="font-display font-semibold text-sm mb-2">Ride History</h3>
          <div className="space-y-2">
            {bookings.slice(0, 5).map((b) => (
              <div key={b.id} className="bg-card rounded-xl p-3 border text-sm flex justify-between items-center">
                <div>
                  <p className="font-medium">{b.route}</p>
                  <p className="text-xs text-muted-foreground">{b.travel_date} • {b.pickup}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${friendlyStatus[b.status]?.color || "bg-accent/10 text-accent"}`}>
                  {friendlyStatus[b.status]?.label || b.status.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dispatch History */}
      {dispatches.length > 0 && (
        <div className="mb-4">
          <h3 className="font-display font-semibold text-sm mb-2">My Packages</h3>
          <div className="space-y-2">
            {dispatches.slice(0, 5).map((d) => {
              const st = dispatchStatusLabel[d.status] || { label: d.status.replace(/_/g, " "), color: "bg-accent/10 text-accent" };
              return (
                <div key={d.id} className="bg-card rounded-xl p-3 border text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-accent text-xs font-bold">{d.tracking_id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{d.pickup} → {d.dropoff}</p>

                  {/* Rider WhatsApp – only shown when status is "assigned" */}
                  {d.status === "assigned" && d.biker_phone && (
                    <div className="mt-2 bg-blue-500/5 border border-blue-500/20 rounded-lg p-2.5">
                      <p className="text-xs font-semibold text-blue-600 mb-1">🏍️ Your Delivery Rider</p>
                      <p className="text-xs text-muted-foreground mb-1.5">Your package has been assigned to a rider</p>
                      <a
                        href={`https://wa.me/${d.biker_phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello, regarding my package ${d.tracking_id}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs bg-[#25D366]/10 text-[#25D366] px-3 py-1.5 rounded-lg font-medium hover:bg-[#25D366]/20 transition-colors"
                      >
                        <MessageCircle size={14} fill="#25D366" />
                        Contact Rider: {d.biker_phone}
                      </a>
                    </div>
                  )}

                  {/* Completed status message */}
                  {d.status === "completed" && (
                    <p className="mt-2 text-xs text-green-600 font-medium">✅ Package delivered successfully – thank you!</p>
                  )}

                  {/* Support contact for pending packages */}
                  {d.status === "pending_delivery" && (
                    <div className="mt-2">
                      <a
                        href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Hello DREYPELLA support, regarding my package ${d.tracking_id}. I need help.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#25D366] transition-colors"
                      >
                        <MessageCircle size={12} />
                        Contact Support about this package
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedBooking(null)}>
          <div className="bg-card rounded-2xl p-6 border max-w-sm w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-lg">Ride Details</h3>
              <button onClick={() => setSelectedBooking(null)} className="p-1 hover:bg-secondary rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Route:</span> <span className="font-semibold">{selectedBooking.route}</span></p>
              <p><span className="text-muted-foreground">Date:</span> <span className="font-semibold">{selectedBooking.travel_date}</span></p>
              <p><span className="text-muted-foreground">Pickup:</span> <span className="font-semibold">{selectedBooking.pickup}</span></p>
              <p><span className="text-muted-foreground">Passengers:</span> <span className="font-semibold">{selectedBooking.passengers}</span></p>
              <p><span className="text-muted-foreground">Status:</span> <span className={`font-semibold ${friendlyStatus[selectedBooking.status]?.color?.split(" ")[1] || ""}`}>{friendlyStatus[selectedBooking.status]?.label || selectedBooking.status.replace(/_/g, " ")}</span></p>
            </div>
            <div className="mt-4 pt-3 border-t">
              <SupportWhatsApp context={`booking ${selectedBooking.route} on ${selectedBooking.travel_date}`} label="Contact Support" className="w-full justify-center text-xs" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
