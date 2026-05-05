/**
 * Payments are manual via Opay transfer. Admin verifies manually and updates booking status to 'Confirmed'.
 * Friendly status messages update in real-time when admin changes payment status.
 * Invoice / Boarding Pass shown for confirmed bookings.
 */
import { useState, useEffect, useRef } from "react";
import { Bus, Package, Clock, LogOut, X, MessageCircle, Printer, CheckCircle2, Ticket } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import SupportWhatsApp from "@/components/SupportWhatsApp";
import { SUPPORT_WHATSAPP } from "@/lib/constants";

const friendlyStatus: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "Awaiting payment confirmation", color: "bg-yellow-500/10 text-yellow-600" },
  confirmed: { label: "Payment Confirmed – Ready for Boarding", color: "bg-green-500/10 text-green-600" },
  completed: { label: "Trip completed – thank you!", color: "bg-blue-500/10 text-blue-600" },
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
  const [profile, setProfile] = useState<{ full_name: string | null; phone: string | null } | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    if (!user) return;
    // Row Level Security: Only fetch data belonging to current user
    // This prevents data leakage between accounts
    const [bookingsRes, dispatchRes, profileRes] = await Promise.all([
      supabase.from("bookings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("dispatches").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("profiles").select("full_name, phone").eq("user_id", user.id).maybeSingle(),
    ]);
    if (bookingsRes.data) setBookings(bookingsRes.data);
    if (dispatchRes.data) setDispatches(dispatchRes.data);
    if (profileRes.data) setProfile(profileRes.data);
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

  const handlePrint = () => {
    if (invoiceRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html><head><title>DREYPELLA RIDE - Boarding Pass</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; color: #1a1a1a; }
            .invoice { max-width: 400px; margin: auto; border: 2px solid #001F3F; border-radius: 12px; padding: 24px; }
            .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 16px; margin-bottom: 16px; }
            .header h1 { font-size: 20px; color: #001F3F; margin: 0; }
            .header p { font-size: 12px; color: #666; margin: 4px 0 0; }
            .ref { font-size: 28px; font-weight: bold; color: #C8102E; text-align: center; margin: 16px 0; font-family: monospace; letter-spacing: 2px; }
            .status { text-align: center; background: #dcfce7; color: #166534; padding: 8px; border-radius: 8px; font-weight: 600; font-size: 13px; margin-bottom: 16px; }
            .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
            .row .label { color: #666; }
            .row .value { font-weight: 600; }
            .note { text-align: center; font-size: 11px; color: #888; margin-top: 16px; border-top: 2px dashed #ccc; padding-top: 12px; }
            .support { text-align: center; font-size: 11px; color: #888; margin-top: 8px; }
          </style></head><body>
          ${invoiceRef.current.innerHTML}
          <script>window.print();</script>
          </body></html>
        `);
        printWindow.document.close();
      }
    }
  };

  const getRef = (id: string) => "DR-" + id.substring(0, 8).toUpperCase();

  const upcomingBookings = bookings.filter((b) => new Date(b.travel_date) >= new Date());

  const stats = [
    { icon: Bus, label: "Rides", value: String(bookings.length), color: "text-accent" },
    { icon: Package, label: "Dispatches", value: String(dispatches.length), color: "text-accent" },
    { icon: Clock, label: "Upcoming", value: String(upcomingBookings.length), color: "text-accent" },
  ];

  // Check if selected booking is confirmed (show invoice)
  const showInvoice = selectedBooking && selectedBooking.status === "confirmed";

  return (
    <div className="container px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-1 animate-fade-in-up">
        <h1 className="font-display font-bold text-xl">Dashboard</h1>
        <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors p-2">
          <LogOut size={18} />
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-6 animate-fade-in-up-delay-1">
        Welcome, {profile?.full_name || user?.email}
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
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{b.route}</p>
                      <p className="text-xs text-muted-foreground">{b.travel_date} • {b.pickup}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {b.status === "confirmed" ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-600 font-semibold">
                          <CheckCircle2 size={12} /> Confirmed
                        </span>
                      ) : (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${friendlyStatus[b.status]?.color || "bg-accent/10 text-accent"}`}>
                          {friendlyStatus[b.status]?.label || b.status.replace(/_/g, " ")}
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{daysLeft > 0 ? `${daysLeft}d left` : "Today"}</p>
                    </div>
                  </div>
                  {b.status === "confirmed" && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 font-medium">
                      <Ticket size={14} /> Tap to view Boarding Pass
                    </div>
                  )}
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
              <div key={b.id} onClick={() => setSelectedBooking(b)} className="bg-card rounded-xl p-3 border text-sm cursor-pointer hover-lift">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{b.route}</p>
                    <p className="text-xs text-muted-foreground">{b.travel_date} • {b.pickup}</p>
                  </div>
                  <div className="shrink-0">
                    {b.status === "confirmed" ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-600 font-semibold">
                        <CheckCircle2 size={12} /> Confirmed
                      </span>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${friendlyStatus[b.status]?.color || "bg-accent/10 text-accent"}`}>
                        {friendlyStatus[b.status]?.label || b.status.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                </div>
                {b.status === "confirmed" && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <Ticket size={14} /> Tap to view Boarding Pass
                  </div>
                )}
                <div className="mt-2">
                  <a
                    href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Hello DREYPELLA support, regarding my ride booking ${b.route} on ${b.travel_date}. I need help.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#25D366] transition-colors"
                  >
                    <MessageCircle size={12} />
                    Contact Support
                  </a>
                </div>
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

                  {d.status === "completed" && (
                    <p className="mt-2 text-xs text-green-600 font-medium">✅ Package delivered successfully – thank you!</p>
                  )}

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

      {/* Booking Details / Invoice Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedBooking(null)}>
          <div className="bg-card rounded-2xl p-6 border max-w-sm w-full animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-lg">
                {showInvoice ? "🎫 Boarding Pass" : "Ride Details"}
              </h3>
              <button onClick={() => setSelectedBooking(null)} className="p-1 hover:bg-secondary rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {showInvoice ? (
              <>
                {/* Invoice / Boarding Pass */}
                <div ref={invoiceRef}>
                  <div className="invoice">
                    <div className="header" style={{ textAlign: "center", borderBottom: "2px dashed #e5e7eb", paddingBottom: "12px", marginBottom: "12px" }}>
                      <h1 style={{ fontSize: "18px", fontWeight: "bold", color: "#001F3F", margin: 0 }}>DREYPELLA RIDE</h1>
                      <p style={{ fontSize: "11px", color: "#888", margin: "4px 0 0" }}>Official Boarding Pass</p>
                    </div>

                    <div className="ref" style={{ textAlign: "center", margin: "12px 0" }}>
                      <p className="text-3xl font-mono font-black tracking-widest text-[#C8102E]">
                        {getRef(selectedBooking.id)}
                      </p>
                    </div>

                    <div className="status" style={{ textAlign: "center", marginBottom: "12px" }}>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 bg-green-100 px-4 py-2 rounded-lg">
                        <CheckCircle2 size={16} /> Payment Confirmed – Ready for Boarding
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="row flex justify-between py-1.5 border-b">
                        <span className="label text-muted-foreground">Full Name</span>
                        <span className="value font-semibold">{profile?.full_name || user?.email}</span>
                      </div>
                      <div className="row flex justify-between py-1.5 border-b">
                        <span className="label text-muted-foreground">Route</span>
                        <span className="value font-semibold">{selectedBooking.route}</span>
                      </div>
                      <div className="row flex justify-between py-1.5 border-b">
                        <span className="label text-muted-foreground">Travel Date</span>
                        <span className="value font-semibold">{selectedBooking.travel_date}</span>
                      </div>
                      <div className="row flex justify-between py-1.5 border-b">
                        <span className="label text-muted-foreground">Pickup Point</span>
                        <span className="value font-semibold">{selectedBooking.pickup}</span>
                      </div>
                      <div className="row flex justify-between py-1.5 border-b">
                        <span className="label text-muted-foreground">Number of Seats</span>
                        <span className="value font-semibold">{selectedBooking.passengers}</span>
                      </div>
                      <div className="row flex justify-between py-1.5 border-b">
                        <span className="label text-muted-foreground">Amount Paid</span>
                        <span className="value font-bold text-green-600">₦{Number(selectedBooking.price).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="note" style={{ textAlign: "center", borderTop: "2px dashed #e5e7eb", paddingTop: "12px", marginTop: "12px" }}>
                      <p className="text-xs text-muted-foreground font-medium">
                        📋 Show this boarding pass to the driver/conductor when boarding
                      </p>
                    </div>
                    <div className="support" style={{ textAlign: "center", marginTop: "8px" }}>
                      <p className="text-xs text-muted-foreground">Support: +234 808 214 4372</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePrint}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-[#001F3F] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#001F3F]/90 transition-colors"
                >
                  <Printer size={16} /> Print / Save Boarding Pass
                </button>
              </>
            ) : (
              <>
                {/* Standard booking details */}
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Reference:</span> <span className="font-mono font-bold text-[#C8102E]">{getRef(selectedBooking.id)}</span></p>
                  <p><span className="text-muted-foreground">Route:</span> <span className="font-semibold">{selectedBooking.route}</span></p>
                  <p><span className="text-muted-foreground">Date:</span> <span className="font-semibold">{selectedBooking.travel_date}</span></p>
                  <p><span className="text-muted-foreground">Pickup:</span> <span className="font-semibold">{selectedBooking.pickup}</span></p>
                  <p><span className="text-muted-foreground">Passengers:</span> <span className="font-semibold">{selectedBooking.passengers}</span></p>
                  <p><span className="text-muted-foreground">Amount:</span> <span className="font-semibold">₦{Number(selectedBooking.price).toLocaleString()}</span></p>
                  <p>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <span className={`font-semibold ${friendlyStatus[selectedBooking.status]?.color?.split(" ")[1] || ""}`}>
                      {friendlyStatus[selectedBooking.status]?.label || selectedBooking.status.replace(/_/g, " ")}
                    </span>
                  </p>
                </div>

                {selectedBooking.status === "pending_payment" && (
                  <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                    <p className="text-xs font-semibold text-yellow-700 mb-1">💳 Payment Instructions</p>
                    <p className="text-xs text-muted-foreground">
                      Transfer ₦{Number(selectedBooking.price).toLocaleString()} to:
                    </p>
                    <div className="mt-1 text-xs font-mono bg-background/50 rounded-lg p-2">
                      <p>Bank: Opay</p>
                      <p>Account: 8082144372</p>
                      <p>Name: Beloved Okikioluwa Isiak</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      After transfer, contact support for verification.
                    </p>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t">
                  <SupportWhatsApp context={`booking ${getRef(selectedBooking.id)} - ${selectedBooking.route} on ${selectedBooking.travel_date}`} label="Contact Support" className="w-full justify-center text-xs" />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
