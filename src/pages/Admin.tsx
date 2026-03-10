/**
 * Admin dashboard – only accessible to users with 'admin' role in user_roles table.
 * Security note: Client-side check for MVP. For production, move admin data fetches
 * to edge functions with service role key to prevent unauthorized access.
 *
 * Trips management uses hardcoded array for MVP – move to Supabase table later.
 */
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Package, Bus, ArrowLeft, LogOut, RefreshCw, MapPin, Clock, Users, CreditCard } from "lucide-react";
import TripsManager from "@/components/admin/TripsManager";
import PaymentsOverview from "@/components/admin/PaymentsOverview";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BookingStatus = "pending_payment" | "confirmed" | "completed" | "cancelled";

const STATUS_OPTIONS: BookingStatus[] = ["pending_payment", "confirmed", "completed", "cancelled"];

const statusColors: Record<string, string> = {
  pending_payment: "bg-yellow-500/15 text-yellow-600",
  confirmed: "bg-blue-500/15 text-blue-600",
  completed: "bg-green-500/15 text-green-600",
  cancelled: "bg-destructive/15 text-destructive",
  pending_delivery: "bg-yellow-500/15 text-yellow-600",
  pending: "bg-yellow-500/15 text-yellow-600",
};

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

  const updateBookingStatus = async (id: string, status: string) => {
    setUpdating(id);
    await supabase.from("bookings").update({ status }).eq("id", id);
    setUpdating(null);
  };

  const updateDispatchStatus = async (id: string, status: string) => {
    setUpdating(id);
    await supabase.from("dispatches").update({ status }).eq("id", id);
    setUpdating(null);
  };

  const pendingBookings = bookings.filter((b) => b.status === "pending_payment");
  const pendingDispatches = dispatches.filter((d) => d.status !== "completed");

  return (
    <div className="min-h-screen bg-[#001F3F] text-white">
      {/* Header */}
      <header className="bg-[#001a35] border-b border-white/10 sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14 px-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="font-display font-bold text-lg">
              DREYPELLA<span className="text-[#C8102E]"> RIDE</span> – Admin Panel
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Refresh">
              <RefreshCw size={18} />
            </button>
            <button onClick={async () => { await signOut(); navigate("/"); }} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="container px-4 py-6 max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Pending Rides", value: pendingBookings.length, icon: Bus, color: "text-yellow-400" },
            { label: "Total Rides", value: bookings.length, icon: Users, color: "text-blue-400" },
            { label: "Pending Packages", value: pendingDispatches.length, icon: Package, color: "text-yellow-400" },
            { label: "Total Packages", value: dispatches.length, icon: MapPin, color: "text-green-400" },
          ].map((s, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <s.icon size={20} className={`mx-auto mb-1 ${s.color}`} />
              <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-white/50">{s.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="bookings" className="data-[state=active]:bg-[#C8102E] data-[state=active]:text-white">
              <Bus size={16} className="mr-2" /> Bookings ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value="dispatches" className="data-[state=active]:bg-[#C8102E] data-[state=active]:text-white">
              <Package size={16} className="mr-2" /> Packages ({dispatches.length})
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-[#C8102E] data-[state=active]:text-white">
              <CreditCard size={16} className="mr-2" /> Payments
            </TabsTrigger>
            <TabsTrigger value="trips" className="data-[state=active]:bg-[#C8102E] data-[state=active]:text-white">
              <Clock size={16} className="mr-2" /> Trips
            </TabsTrigger>
          </TabsList>

          {/* === BOOKINGS TAB === */}
          <TabsContent value="bookings">
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h2 className="font-display font-semibold text-base flex items-center gap-2">
                  <Bus size={18} className="text-[#C8102E]" /> All Ride Bookings
                </h2>
              </div>
              {bookings.length === 0 ? (
                <p className="text-sm text-white/40 p-6 text-center">No bookings yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-white/60">Route</TableHead>
                        <TableHead className="text-white/60">Date</TableHead>
                        <TableHead className="text-white/60">Pickup</TableHead>
                        <TableHead className="text-white/60">Seats</TableHead>
                        <TableHead className="text-white/60">Amount</TableHead>
                        <TableHead className="text-white/60">Status</TableHead>
                        <TableHead className="text-white/60">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((b) => (
                        <TableRow key={b.id} className="border-white/10 hover:bg-white/5">
                          <TableCell className="text-white font-medium text-xs">{b.route}</TableCell>
                          <TableCell className="text-white/70 text-xs">{b.travel_date}</TableCell>
                          <TableCell className="text-white/70 text-xs">{b.pickup}</TableCell>
                          <TableCell className="text-white/70 text-xs">{b.passengers}</TableCell>
                          <TableCell className="text-white/70 text-xs">₦{Number(b.price).toLocaleString()}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[b.status] || "bg-white/10 text-white/60"}`}>
                              {b.status?.replace(/_/g, " ")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <select
                              value={b.status}
                              onChange={(e) => updateBookingStatus(b.id, e.target.value)}
                              disabled={updating === b.id}
                              className="bg-white/10 text-white text-xs rounded-lg px-2 py-1 border border-white/20 outline-none disabled:opacity-50"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s} className="bg-[#001F3F]">{s.replace(/_/g, " ")}</option>
                              ))}
                            </select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* === DISPATCHES TAB === */}
          <TabsContent value="dispatches">
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h2 className="font-display font-semibold text-base flex items-center gap-2">
                  <Package size={18} className="text-[#C8102E]" /> Package Deliveries
                </h2>
              </div>
              {dispatches.length === 0 ? (
                <p className="text-sm text-white/40 p-6 text-center">No dispatches yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-white/60">Tracking</TableHead>
                        <TableHead className="text-white/60">Route</TableHead>
                        <TableHead className="text-white/60">Package</TableHead>
                        <TableHead className="text-white/60">Phones</TableHead>
                        <TableHead className="text-white/60">Price</TableHead>
                        <TableHead className="text-white/60">Status</TableHead>
                        <TableHead className="text-white/60">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dispatches.map((d) => (
                        <TableRow key={d.id} className="border-white/10 hover:bg-white/5">
                          <TableCell className="text-[#C8102E] font-mono font-bold text-xs">{d.tracking_id}</TableCell>
                          <TableCell className="text-white/70 text-xs">{d.pickup} → {d.dropoff}</TableCell>
                          <TableCell className="text-white/70 text-xs">{d.package_type} • {d.delivery_type}</TableCell>
                          <TableCell className="text-white/70 text-xs">S: {d.sender_phone}<br/>R: {d.receiver_phone}</TableCell>
                          <TableCell className="text-white/70 text-xs">₦{Number(d.price).toLocaleString()}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[d.status] || "bg-white/10 text-white/60"}`}>
                              {d.status?.replace(/_/g, " ")}
                            </span>
                          </TableCell>
                          <TableCell>
                            {d.status !== "completed" ? (
                              <button
                                onClick={() => updateDispatchStatus(d.id, "completed")}
                                disabled={updating === d.id}
                                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                              >
                                <CheckCircle size={14} />
                                {updating === d.id ? "..." : "Delivered"}
                              </button>
                            ) : (
                              <span className="text-green-400 text-xs flex items-center gap-1"><CheckCircle size={14} /> Done</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* === PAYMENTS TAB === */}
          <TabsContent value="payments">
            <PaymentsOverview />
          </TabsContent>

          {/* === TRIPS TAB === */}
          <TabsContent value="trips">
            <TripsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
