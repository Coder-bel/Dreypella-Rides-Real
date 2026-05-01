/**
 * Strict role-based access control implemented.
 * Biker dashboard - welcome header, assigned trips/dispatches, today's schedule,
 * earnings overview, quick actions. Real-time updates via Supabase channel.
 * Navbar (with role-aware profile) is handled by Layout.
 */
import { useState, useEffect } from "react";
import { Bike, CheckCircle, Package, Truck, Calendar, Wallet, Phone, MapPin, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { SUPPORT_WHATSAPP } from "@/lib/constants";

interface BikerProfile {
  full_name: string | null;
  whatsapp_number: string;
  company_code: string | null;
  email: string | null;
}

const BikersDashboard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [biker, setBiker] = useState<BikerProfile | null>(null);

  const legacyEmail = localStorage.getItem("bikerEmail") || "";
  const bikerIdentifier = biker?.email || legacyEmail;

  const fetchBiker = async () => {
    if (user) {
      const { data } = await supabase
        .from("bikers")
        .select("full_name, whatsapp_number, company_code, email")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setBiker(data);
    } else if (legacyEmail) {
      const { data } = await supabase
        .from("bikers")
        .select("full_name, whatsapp_number, company_code, email")
        .eq("email", legacyEmail)
        .maybeSingle();
      if (data) setBiker(data);
    }
  };

  const fetchDispatches = async () => {
    // RLS now restricts what each biker sees: pending pool + own assigned/completed
    const { data } = await supabase
      .from("dispatches")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setDispatches(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBiker();
    fetchDispatches();
    const channel = supabase
      .channel("biker-dispatches")
      .on("postgres_changes", { event: "*", schema: "public", table: "dispatches" }, () => fetchDispatches())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAccept = async (dispatch: any) => {
    const { data, error } = await supabase.rpc("claim_dispatch" as any, { _dispatch_id: dispatch.id });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    const res: any = data;
    if (!res?.success) {
      const msg = res?.error === "already_taken"
        ? "This delivery was just accepted by another biker."
        : res?.error === "biker_inactive"
        ? "Your account is inactive. Contact admin."
        : "Failed to accept delivery.";
      toast({ title: "Could not accept", description: msg, variant: "destructive" });
      fetchDispatches();
      return;
    }
    toast({ title: "✅ Delivery Accepted!", description: `Package ${dispatch.tracking_id} assigned to you.` });
  };

  const handleDecline = async (dispatch: any) => {
    // Decline = release back to pending pool (only own assigned dispatches are updatable per RLS)
    const { error } = await supabase
      .from("dispatches")
      .update({ status: "pending_delivery", biker_assigned: null, biker_phone: null, assigned_biker_id: null })
      .eq("id", dispatch.id);
    if (error) {
      toast({ title: "Error", description: "Failed to decline", variant: "destructive" });
    } else {
      toast({ title: "Trip Released", description: `Package ${dispatch.tracking_id} returned to pool.` });
    }
  };

  const handleMarkDelivered = async (dispatch: any) => {
    const { data, error } = await supabase.rpc("mark_dispatch_delivered" as any, { _dispatch_id: dispatch.id });
    if (error || !data) {
      toast({ title: "Error", description: "Failed to mark delivered", variant: "destructive" });
    } else {
      toast({ title: "Delivered!", description: `Package ${dispatch.tracking_id} marked as completed` });
    }
  };

  // RLS already restricts visibility to: pending pool (unassigned) OR own assigned/completed.
  const pendingDispatches = dispatches.filter((d) => d.status === "pending_delivery");
  const assignedDispatches = dispatches.filter((d) => d.status === "assigned");
  const completedDispatches = dispatches.filter((d) => d.status === "completed");

  // Today's schedule: assigned + completed today
  const today = new Date().toDateString();
  const todaysSchedule = [...assignedDispatches, ...completedDispatches].filter(
    (d) => new Date(d.created_at).toDateString() === today
  );

  // Earnings: sum of completed deliveries for this biker (placeholder calc — 20% commission)
  const totalCompleted = completedDispatches.length;
  const totalEarnings = completedDispatches.reduce((sum, d) => sum + Number(d.price) * 0.2, 0);

  const bikerName = biker?.full_name || "Rider";

  return (
    <div className="container px-3 sm:px-4 py-5 sm:py-6 max-w-3xl mx-auto pb-24 md:pb-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-[#001F3F] to-[#003366] rounded-2xl p-5 sm:p-6 mb-5 text-white animate-fade-in-up shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-[#C8102E] p-2.5 rounded-full">
            <Bike size={20} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/60 uppercase tracking-wide">Welcome back</p>
            <h1 className="font-display font-bold text-lg sm:text-xl truncate">{bikerName}</h1>
          </div>
        </div>
        {biker?.company_code && (
          <p className="text-xs text-white/70">
            Company Code: <span className="font-mono font-bold text-white">{biker.company_code}</span>
          </p>
        )}
      </div>

      {/* Quick Stats — Today + Earnings */}
      <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-in-up">
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-[#C8102E]" />
            <p className="text-xs text-muted-foreground">Today's Trips</p>
          </div>
          <p className="font-display font-bold text-2xl">{todaysSchedule.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {assignedDispatches.length} active • {todaysSchedule.filter(d => d.status === "completed").length} done
          </p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className="text-green-600" />
            <p className="text-xs text-muted-foreground">Earnings</p>
          </div>
          <p className="font-display font-bold text-2xl text-green-600">₦{totalEarnings.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{totalCompleted} completed deliveries</p>
        </div>
      </div>

      {/* My Assigned Trips */}
      {assignedDispatches.length > 0 && (
        <div className="mb-6 animate-fade-in-up">
          <h2 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
            <Truck size={16} className="text-[#C8102E]" /> My Active Trips ({assignedDispatches.length})
          </h2>
          <div className="space-y-3">
            {assignedDispatches.map((d) => (
              <div key={d.id} className="bg-card rounded-xl border-2 border-blue-500/30 p-4">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <span className="font-mono text-[#C8102E] text-xs font-bold">{d.tracking_id}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 whitespace-nowrap">Assigned</span>
                </div>
                <div className="text-sm space-y-1.5 mb-3">
                  <p className="flex items-start gap-1.5"><MapPin size={14} className="text-muted-foreground mt-0.5 shrink-0" /> <span><span className="text-muted-foreground">From:</span> {d.pickup}</span></p>
                  <p className="flex items-start gap-1.5"><MapPin size={14} className="text-[#C8102E] mt-0.5 shrink-0" /> <span><span className="text-muted-foreground">To:</span> {d.dropoff}</span></p>
                  <p><span className="text-muted-foreground">Sender:</span> {d.sender_name || "N/A"} ({d.sender_phone})</p>
                  <p><span className="text-muted-foreground">Receiver:</span> {d.receiver_name || "N/A"} ({d.receiver_phone})</p>
                  <p><span className="text-muted-foreground">Package:</span> {d.package_type} • {d.delivery_type === "same-day" ? "Same Day" : "Next Day"}</p>
                  <p className="font-semibold text-base">Price: ₦{Number(d.price).toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleMarkDelivered(d)}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm min-h-[44px]"
                  >
                    <CheckCircle size={16} /> Delivered
                  </button>
                  <button
                    onClick={() => handleDecline(d)}
                    className="border border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm min-h-[44px]"
                  >
                    <X size={16} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Trips */}
      <div className="animate-fade-in-up mb-6">
        <h2 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
          <Package size={16} className="text-[#C8102E]" /> Available Trips ({pendingDispatches.length})
        </h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : pendingDispatches.length === 0 ? (
          <div className="bg-card rounded-xl border p-8 text-center">
            <Bike size={40} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No available trips right now.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">New deliveries will appear here in real time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingDispatches.map((d) => (
              <div key={d.id} className="bg-card rounded-xl border p-4">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <span className="font-mono text-[#C8102E] text-xs font-bold">{d.tracking_id}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-600 whitespace-nowrap">Pending</span>
                </div>
                <div className="text-sm space-y-1.5 mb-3">
                  <p className="flex items-start gap-1.5"><MapPin size={14} className="text-muted-foreground mt-0.5 shrink-0" /> <span><span className="text-muted-foreground">From:</span> {d.pickup}</span></p>
                  <p className="flex items-start gap-1.5"><MapPin size={14} className="text-[#C8102E] mt-0.5 shrink-0" /> <span><span className="text-muted-foreground">To:</span> {d.dropoff}</span></p>
                  <p><span className="text-muted-foreground">Package:</span> {d.package_type} • {d.delivery_type === "same-day" ? "Same Day" : "Next Day"}</p>
                  <p className="font-semibold text-base">Price: ₦{Number(d.price).toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAccept(d)}
                    className="bg-[#C8102E] hover:bg-[#a30d25] text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm min-h-[44px]"
                  >
                    <Truck size={16} /> Accept Trip
                  </button>
                  <button
                    onClick={() => toast({ title: "Trip skipped", description: "It will remain available for other riders." })}
                    className="border text-muted-foreground hover:bg-secondary font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm min-h-[44px]"
                  >
                    <X size={16} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in-up mb-6">
        <h2 className="font-display font-semibold text-sm mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Hello DREYPELLA, this is ${bikerName} (${biker?.company_code || ""}).`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card border rounded-xl p-4 hover-lift flex flex-col items-center text-center gap-2 min-h-[88px] justify-center"
          >
            <Phone size={20} className="text-green-600" />
            <span className="text-xs font-semibold">Contact Support</span>
          </a>
          <button
            onClick={() => { fetchDispatches(); toast({ title: "Refreshed", description: "Trips updated." }); }}
            className="bg-card border rounded-xl p-4 hover-lift flex flex-col items-center text-center gap-2 min-h-[88px] justify-center"
          >
            <Truck size={20} className="text-[#C8102E]" />
            <span className="text-xs font-semibold">Refresh Trips</span>
          </button>
        </div>
      </div>

      {/* Past Deliveries */}
      {completedDispatches.length > 0 && (
        <div className="animate-fade-in-up">
          <h2 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" /> Past Deliveries ({completedDispatches.length})
          </h2>
          <div className="space-y-2">
            {completedDispatches.slice(0, 5).map((d) => (
              <div key={d.id} className="bg-card rounded-xl border p-3 opacity-90">
                <div className="flex justify-between items-center mb-1 gap-2">
                  <span className="font-mono text-[#C8102E] text-xs font-bold">{d.tracking_id}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-600">Completed</span>
                </div>
                <p className="text-xs text-muted-foreground">{d.pickup} → {d.dropoff}</p>
                <p className="text-xs font-semibold mt-1">₦{Number(d.price).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BikersDashboard;
