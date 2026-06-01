/**
 * Payments Overview shows bookings requiring pre-payment.
 * Status changes are real-time for user visibility.
 * Packages are pay-on-delivery and not listed here.
 */
import { useState, useEffect } from "react";
import { CreditCard, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

type BookingStatus = "pending_payment" | "confirmed" | "completed" | "cancelled";

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "pending_payment", label: "Pending Payment" },
  { value: "confirmed", label: "Payment Confirmed" },
  { value: "completed", label: "Ride Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const statusColors: Record<string, string> = {
  pending_payment: "bg-yellow-500/15 text-yellow-600",
  confirmed: "bg-blue-500/15 text-blue-600",
  completed: "bg-green-500/15 text-green-600",
  cancelled: "bg-red-500/15 text-red-500",
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
  profile?: {
    full_name: string | null;
    phone: string | null;
  };
  email?: string;
};

const PaymentsOverview = () => {
  const [bookings, setBookings] = useState<BookingWithProfile[]>([]);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchBookings = async () => {
    // Fetch bookings
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (!bookingsData) return;

    // Fetch profiles for all user_ids
    const userIds = [...new Set(bookingsData.map((b) => b.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, phone")
      .in("user_id", userIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.user_id, p])
    );

    const enriched: BookingWithProfile[] = bookingsData.map((b) => ({
      ...b,
      profile: profileMap.get(b.user_id) || undefined,
    }));

    setBookings(enriched);
  };

  useEffect(() => { fetchBookings(); }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("payments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => fetchBookings())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    setUpdating(null);
    if (!error) {
      toast({ title: "Status updated", description: `Booking status changed to ${status.replace(/_/g, " ")}` });
    }
  };

  // Generate a display reference from booking id
  const getRef = (id: string) => "DR-" + id.substring(0, 8).toUpperCase();

  // Filter by search
  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (b.profile?.full_name || "").toLowerCase().includes(q) ||
      getRef(b.id).toLowerCase().includes(q) ||
      b.status.toLowerCase().includes(q) ||
      b.route.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="font-display font-semibold text-base flex items-center gap-2">
          <CreditCard size={18} className="text-[#C8102E]" /> Payments Overview
        </h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, ref, status..."
            className="bg-white/10 text-white text-xs rounded-lg pl-8 pr-3 py-2 border border-white/20 outline-none w-full sm:w-64 placeholder:text-white/30"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-white/40 p-6 text-center">
          {search ? "No results found." : "No bookings yet."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Full Name</TableHead>
                <TableHead className="text-white/60">Phone</TableHead>
                <TableHead className="text-white/60">Reference</TableHead>
                <TableHead className="text-white/60">Route</TableHead>
                <TableHead className="text-white/60">Amount</TableHead>
                <TableHead className="text-white/60">Payment Status</TableHead>
                <TableHead className="text-white/60">Date</TableHead>
                <TableHead className="text-white/60">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
                <TableRow key={b.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white font-medium text-xs">
                    {b.profile?.full_name || "—"}
                  </TableCell>
                  <TableCell className="text-white/70 text-xs">
                    {b.profile?.phone || "—"}
                  </TableCell>
                  <TableCell className="text-[#C8102E] font-mono font-bold text-xs">
                    {getRef(b.id)}
                  </TableCell>
                  <TableCell className="text-white/70 text-xs">{b.route}</TableCell>
                  <TableCell className="text-white/70 text-xs">₦{Number(b.price).toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${statusColors[b.status] || "bg-white/10 text-white/60"}`}>
                      {STATUS_OPTIONS.find((s) => s.value === b.status)?.label || b.status.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-white/70 text-xs whitespace-nowrap">
                    {new Date(b.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </TableCell>
                  <TableCell>
                    <select
                      value={b.status}
                      onChange={(e) => updateStatus(b.id, e.target.value)}
                      disabled={updating === b.id}
                      className="bg-white/10 text-white text-xs rounded-lg px-2 py-1 border border-white/20 outline-none disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value} className="bg-[#001F3F]">
                          {s.label}
                        </option>
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
  );
};

export default PaymentsOverview;
