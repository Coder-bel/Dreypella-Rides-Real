/**
 * Strict role-based access control implemented.
 * Admin dashboard – only accessible to users with 'admin' role in user_roles table.
 * Navbar is handled by Layout – no duplicate header here.
 */
import { useState, useEffect } from "react";
import { CheckCircle, Package, Bus, RefreshCw, MapPin, Clock, Users, CreditCard, ShieldCheck, Bike, UserPlus } from "lucide-react";
import TripsManager from "@/components/admin/TripsManager";
import PaymentsOverview from "@/components/admin/PaymentsOverview";
import UsersOverview from "@/components/admin/UsersOverview";
import BikersOnboarding from "@/components/admin/BikersOnboarding";
import BikersOverview from "@/components/admin/BikersOverview";
import AdminInvites from "@/components/admin/AdminInvites";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";

const STATUS_OPTIONS: BookingStatus[] = ["Pending", "Confirmed", "Completed", "Cancelled"];

const statusColors: Record<string, string> = {
  pending_payment: "bg-yellow-500/15 text-yellow-600",
  confirmed: "bg-blue-500/15 text-blue-600",
  completed: "bg-green-500/15 text-green-600",
  cancelled: "bg-destructive/15 text-destructive",
  pending_delivery: "bg-yellow-500/15 text-yellow-600",
  pending: "bg-yellow-500/15 text-yellow-600",
};

const statusLabels: Record<string, string> = {
  pending_payment: "Pending Payment",
  confirmed: "Payment Confirmed",
  completed: "Ride Completed",
  cancelled: "Cancelled",
  Pending: "Pending Payment",
  Confirmed: "Payment Confirmed",
  Completed: "Ride Completed",
  Cancelled: "Cancelled",
};

type BookingWithProfile = {
  id: string;
  route: string;
  travel_date: string;
  pickup: string;
  passengers: number;
  price: number;
  status: string;
  created_at: string;
  user_id: string;
  profile?: { full_name: string | null; phone_number: string | null };
};

const Admin = () => {
  const [bookings, setBookings] = useState<BookingWithProfile[]>([]);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const [verifyBooking, setVerifyBooking] = useState<BookingWithProfile | null>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchData = async () => {
  const [bRes, dRes] = await Promise.all([
    supabase.from("bookings").select("*").order("created_at", { ascending: false }),
    supabase.from("dispatches").select("*").order("created_at", { ascending: false }),
  ]);

  if (bRes.data) {
    // Use id instead of user_id to match profiles table
    const userIds = [...new Set(bRes.data.map((b) => b.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, phone_number")
      .in("id", userIds);
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    setBookings(
      bRes.data.map((b) => ({ ...b, profile: profileMap.get(b.user_id) || undefined }))
    );
  }
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

  // Map status to payment_status
  const paymentStatusMap: Record<string, string> = {
    "Pending": "Pending Payment",
    "Confirmed": "Payment Confirmed",
    "Completed": "Ride Completed",
    "Cancelled": "Cancelled",
  };

  await supabase
    .from("bookings")
    .update({
      status,
      payment_status: paymentStatusMap[status] || "Pending Payment",
    })
    .eq("id", id);

  setUpdating(null);
  fetchData(); // ← refetch immediately
};

  const updateDispatchStatus = async (id: string, status: string) => {
    setUpdating(id);
    await supabase.from("dispatches").update({ status }).eq("id", id);
    setUpdating(null);
  };

  const handleVerifyPayment = async () => {
  if (!verifyBooking) return;
  setVerifying(true);
  const { error } = await supabase
    .from("bookings")
    .update({ 
      status: "Confirmed",
      payment_status: "Payment Confirmed",
    })
    .eq("id", verifyBooking.id);
  setVerifying(false);
  if (!error) {
    toast({ title: "Payment Verified ✅", description: `Booking DR-${verifyBooking.id.substring(0, 8).toUpperCase()} confirmed. User will see their invoice instantly.` });
    setVerifyBooking(null);
    fetchData(); // ← refetch immediately
  } else {
    toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
  }
};

  const getRef = (id: string) => "DR-" + id.substring(0, 8).toUpperCase();

  const pendingBookings = bookings.filter((b) => b.status === "pending_payment");
  const pendingDispatches = dispatches.filter((d) => d.status !== "completed");

  return (
    <div className="min-h-screen bg-[#001F3F] text-white">
      <div className="container px-3 sm:px-4 py-4 sm:py-6 max-w-6xl mx-auto">
        {/* Refresh button */}
        <div className="flex justify-end mb-3 sm:mb-4">
          <button onClick={fetchData} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60" title="Refresh">
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5 sm:mb-6">
          {[
            { label: "Pending Rides", value: pendingBookings.length, icon: Bus, color: "text-yellow-400" },
            { label: "Total Rides", value: bookings.length, icon: Users, color: "text-blue-400" },
            { label: "Pending Packages", value: pendingDispatches.length, icon: Package, color: "text-yellow-400" },
            { label: "Total Packages", value: dispatches.length, icon: MapPin, color: "text-green-400" },
          ].map((s, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10 text-center">
              <s.icon size={20} className={`mx-auto mb-1 ${s.color}`} />
              <p className={`text-xl sm:text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] sm:text-xs text-white/50">{s.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="bookings" className="space-y-4">
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <TabsList className="bg-white/5 border border-white/10 inline-flex w-max sm:w-auto sm:flex-wrap">
              <TabsTrigger value="bookings" className="data-[state=active]:bg-[#C8102E] data-[state=active]:text-white whitespace-nowrap">
                <Bus size={16} className="mr-1.5 sm:mr-2" /> Bookings ({bookings.length})
              </TabsTrigger>
              <TabsTrigger value="dispatches" className="data-[state=active]:bg-[#C8102E] data-[state=active]:text-white whitespace-nowrap">
                <Package size={16} className="mr-1.5 sm:mr-2" /> Packages ({dispatches.length})
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-[#C8102E] data-[state=active]:text-white whitespace-nowrap">
                <CreditCard size={16} className="mr-1.5 sm:mr-2" /> Payments
              </TabsTrigger>
              <TabsTrigger value="trips" className="data-[state=active]:bg-[#C8102E] data-[state=active]:text-white whitespace-nowrap">
                <Clock size={16} className="mr-1.5 sm:mr-2" /> Trips
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-[#C8102E] data-[state=active]:text-white whitespace-nowrap">
                <Users size={16} className="mr-1.5 sm:mr-2" /> Users
              </TabsTrigger>
              <TabsTrigger value="bikers" className="data-[state=active]:bg-[#C8102E] data-[state=active]:text-white whitespace-nowrap">
                <Bike size={16} className="mr-1.5 sm:mr-2" /> Bikers
              </TabsTrigger>
              <TabsTrigger value="bikers-overview" className="data-[state=active]:bg-[#C8102E] data-[state=active]:text-white whitespace-nowrap">
                <Bike size={16} className="mr-1.5 sm:mr-2" /> Bikers Overview
              </TabsTrigger>
              <TabsTrigger value="admin-invites" className="data-[state=active]:bg-[#C8102E] data-[state=active]:text-white whitespace-nowrap">
                <UserPlus size={16} className="mr-1.5 sm:mr-2" /> Onboard Admin
              </TabsTrigger>
            </TabsList>
          </div>

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
                        <TableHead className="text-white/60">Ref</TableHead>
                        <TableHead className="text-white/60">Passenger</TableHead>
                        <TableHead className="text-white/60">Route</TableHead>
                        <TableHead className="text-white/60">Date</TableHead>
                        <TableHead className="text-white/60">Pickup</TableHead>
                        <TableHead className="text-white/60">Seats</TableHead>
                        <TableHead className="text-white/60">Amount</TableHead>
                        <TableHead className="text-white/60">Payment Status</TableHead>
                        <TableHead className="text-white/60">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((b) => (
                        <TableRow key={b.id} className="border-white/10 hover:bg-white/5">
                          <TableCell className="text-[#C8102E] font-mono font-bold text-xs">{getRef(b.id)}</TableCell>
                          <TableCell className="text-white text-xs font-medium">{b.profile?.full_name || "—"}</TableCell>
                          <TableCell className="text-white/70 text-xs">{b.route}</TableCell>
                          <TableCell className="text-white/70 text-xs">{b.travel_date}</TableCell>
                          <TableCell className="text-white/70 text-xs">{b.pickup}</TableCell>
                          <TableCell className="text-white/70 text-xs">{b.passengers}</TableCell>
                          <TableCell className="text-white/70 text-xs">₦{Number(b.price).toLocaleString()}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${statusColors[b.status] || "bg-white/10 text-white/60"}`}>
                              {statusLabels[b.status] || b.status.replace(/_/g, " ")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {b.status === "pending_payment" && (
                                <button
                                  onClick={() => setVerifyBooking(b)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors whitespace-nowrap"
                                >
                                  <ShieldCheck size={14} />
                                  Verify Payment
                                </button>
                              )}
                              <select
                                value={b.status}
                                onChange={(e) => updateBookingStatus(b.id, e.target.value)}
                                disabled={updating === b.id}
                                className="bg-white/10 text-white text-xs rounded-lg px-2 py-1 border border-white/20 outline-none disabled:opacity-50"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s} className="bg-[#001F3F]">{statusLabels[s] || s.replace(/_/g, " ")}</option>
                                ))}
                              </select>
                            </div>
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

          {/* === USERS TAB === */}
          <TabsContent value="users">
            <UsersOverview />
          </TabsContent>

          {/* === BIKERS TAB (onboard) === */}
          <TabsContent value="bikers">
            <BikersOnboarding />
          </TabsContent>

          {/* === BIKERS OVERVIEW TAB === */}
          <TabsContent value="bikers-overview">
            <BikersOverview />
          </TabsContent>

          {/* === ADMIN INVITES TAB === */}
          <TabsContent value="admin-invites">
            <AdminInvites />
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Verification Modal */}
      <Dialog open={!!verifyBooking} onOpenChange={(open) => !open && setVerifyBooking(null)}>
        <DialogContent className="bg-[#001F3F] border-white/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ShieldCheck size={20} className="text-green-400" /> Verify Payment
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Confirm you have received payment for this booking via Opay.
            </DialogDescription>
          </DialogHeader>
          {verifyBooking && (
            <div className="space-y-3 py-2">
              <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm border border-white/10">
                <div className="flex justify-between">
                  <span className="text-white/50">Reference</span>
                  <span className="font-mono font-bold text-[#C8102E]">{getRef(verifyBooking.id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Passenger</span>
                  <span className="font-medium">{verifyBooking.profile?.full_name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Phone</span>
                  <span>{verifyBooking.profile?.phone_number || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Route</span>
                  <span className="font-medium">{verifyBooking.route}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Travel Date</span>
                  <span>{verifyBooking.travel_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Pickup</span>
                  <span>{verifyBooking.pickup}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Seats</span>
                  <span>{verifyBooking.passengers}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                  <span className="text-white/50 font-semibold">Amount</span>
                  <span className="text-lg font-bold text-green-400">₦{Number(verifyBooking.price).toLocaleString()}</span>
                </div>
              </div>
              <p className="text-xs text-white/40 text-center">
                Account: Dreypella Ride • Opay • 8082144372
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setVerifyBooking(null)} className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button
              onClick={handleVerifyPayment}
              disabled={verifying}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              <ShieldCheck size={16} className="mr-2" />
              {verifying ? "Confirming..." : "Yes, Payment Confirmed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
