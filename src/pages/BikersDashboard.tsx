/**
 * Strict role-based access control implemented.
 * Biker dashboard - view pending dispatches, accept/complete deliveries.
 * No access to ride booking or package sending features.
 * Navbar is handled by Layout — no duplicate navbar here.
 */
import { useState, useEffect } from "react";
import { Bike, CheckCircle, Package, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const BikersDashboard = () => {
  const { toast } = useToast();
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bikerWhatsapp, setBikerWhatsapp] = useState("");
  const bikerEmail = localStorage.getItem("bikerEmail") || "";

  const fetchBikerWhatsapp = async () => {
    const { data } = await supabase
      .from("bikers")
      .select("whatsapp_number")
      .eq("email", bikerEmail)
      .maybeSingle();
    if (data) setBikerWhatsapp(data.whatsapp_number);
  };

  const fetchDispatches = async () => {
    const { data } = await supabase
      .from("dispatches")
      .select("*")
      .in("status", ["pending_delivery", "assigned", "completed"])
      .order("created_at", { ascending: false });
    if (data) setDispatches(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBikerWhatsapp();
    fetchDispatches();
    const channel = supabase
      .channel("biker-dispatches")
      .on("postgres_changes", { event: "*", schema: "public", table: "dispatches" }, () => fetchDispatches())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAccept = async (dispatch: any) => {
    if (!bikerWhatsapp) {
      toast({ title: "Error", description: "WhatsApp number not found. Please re-register.", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("dispatches")
      .update({ status: "assigned", biker_assigned: bikerEmail, biker_phone: bikerWhatsapp })
      .eq("id", dispatch.id);
    if (error) {
      toast({ title: "Error", description: "Failed to accept delivery", variant: "destructive" });
    } else {
      toast({ title: "✅ Delivery Accepted!", description: `Package ${dispatch.tracking_id} assigned to you.` });
    }
  };

  const handleMarkDelivered = async (dispatch: any) => {
    const { error } = await supabase
      .from("dispatches")
      .update({ status: "completed" })
      .eq("id", dispatch.id);
    if (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } else {
      toast({ title: "Delivered!", description: `Package ${dispatch.tracking_id} marked as completed` });
    }
  };

  const pendingDispatches = dispatches.filter((d) => d.status === "pending_delivery");
  const assignedDispatches = dispatches.filter((d) => d.status === "assigned" && d.biker_assigned === bikerEmail);
  const completedDispatches = dispatches.filter((d) => d.status === "completed" && d.biker_assigned === bikerEmail);

  return (
    <div className="container px-4 py-6 max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-xl mb-1 animate-fade-in-up">Welcome, Rider</h1>
      <p className="text-sm text-muted-foreground mb-6 animate-fade-in-up">{bikerEmail}</p>

      {/* My Assigned Deliveries */}
      {assignedDispatches.length > 0 && (
        <div className="mb-8 animate-fade-in-up">
          <h2 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
            <Truck size={16} className="text-accent" /> My Assigned Deliveries
          </h2>
          <div className="space-y-4">
            {assignedDispatches.map((d) => (
              <div key={d.id} className="bg-card rounded-xl border p-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-3 flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-600 shrink-0" />
                  <p className="text-sm font-semibold text-green-700">You have accepted this delivery</p>
                </div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-accent text-xs font-bold">{d.tracking_id}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">Assigned</span>
                </div>
                <div className="text-sm space-y-1 mb-3">
                  <p><span className="text-muted-foreground">Pickup:</span> {d.pickup}</p>
                  <p><span className="text-muted-foreground">Delivery:</span> {d.dropoff}</p>
                  <p><span className="text-muted-foreground">Sender:</span> {d.sender_name || "N/A"} ({d.sender_phone})</p>
                  <p><span className="text-muted-foreground">Receiver:</span> {d.receiver_name || "N/A"} ({d.receiver_phone})</p>
                  <p><span className="text-muted-foreground">Package:</span> {d.package_type} • {d.delivery_type === "same-day" ? "Same Day" : "Next Day"}</p>
                  <p><span className="text-muted-foreground">Price:</span> ₦{Number(d.price).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleMarkDelivered(d)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 text-sm"
                >
                  <CheckCircle size={16} /> Mark as Delivered
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Deliveries */}
      <div className="animate-fade-in-up">
        <h2 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
          <Package size={16} className="text-accent" /> Pending Package Deliveries
        </h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : pendingDispatches.length === 0 ? (
          <div className="bg-card rounded-xl border p-8 text-center">
            <Bike size={40} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No pending deliveries right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingDispatches.map((d) => (
              <div key={d.id} className="bg-card rounded-xl border p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-accent text-xs font-bold">{d.tracking_id}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600">Pending</span>
                </div>
                <div className="text-sm space-y-1 mb-3">
                  <p><span className="text-muted-foreground">Pickup:</span> {d.pickup}</p>
                  <p><span className="text-muted-foreground">Delivery:</span> {d.dropoff}</p>
                  <p><span className="text-muted-foreground">Sender:</span> {d.sender_name || "N/A"} ({d.sender_phone})</p>
                  <p><span className="text-muted-foreground">Receiver:</span> {d.receiver_name || "N/A"} ({d.receiver_phone})</p>
                  <p><span className="text-muted-foreground">Package:</span> {d.package_type} • {d.delivery_type === "same-day" ? "Same Day" : "Next Day"}</p>
                  <p><span className="text-muted-foreground">Price:</span> ₦{Number(d.price).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleAccept(d)}
                  className="w-full bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold py-2.5 rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 text-sm"
                >
                  <Truck size={16} /> Accept Delivery
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Deliveries */}
      {completedDispatches.length > 0 && (
        <div className="mt-8 animate-fade-in-up">
          <h2 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" /> Past Deliveries
          </h2>
          <div className="space-y-3">
            {completedDispatches.map((d) => (
              <div key={d.id} className="bg-card rounded-xl border p-4 opacity-80">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-accent text-xs font-bold">{d.tracking_id}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">Completed</span>
                </div>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Pickup:</span> {d.pickup}</p>
                  <p><span className="text-muted-foreground">Delivery:</span> {d.dropoff}</p>
                  <p><span className="text-muted-foreground">Package:</span> {d.package_type}</p>
                  <p><span className="text-muted-foreground">Price:</span> ₦{Number(d.price).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BikersDashboard;
