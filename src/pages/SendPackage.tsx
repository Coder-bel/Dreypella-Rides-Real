/**
 * Payments are manual via Opay transfer. Admin verifies manually and updates booking status to 'Confirmed'.
 */
import { useState } from "react";
import { Package, CheckCircle } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";
import PaymentModal from "@/components/PaymentModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const packageTypes = ["Small Envelope", "Medium Box", "Large Box", "Electronics", "Documents", "Other"];

const generateTrackingId = () =>
  "DRP-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();

const SendPackage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    packageType: "",
    pickup: "",
    dropoff: "",
    senderName: "",
    senderPhone: "",
    receiverName: "",
    receiverPhone: "",
    delivery: "next-day",
  });
  const [showPayment, setShowPayment] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [error, setError] = useState("");

  const handleChange = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPayment(true);
  };

  const handleConfirmPaid = async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    const id = generateTrackingId();

    const { error: dbError } = await supabase.from("dispatches").insert({
      user_id: user.id,
      tracking_id: id,
      package_type: form.packageType,
      pickup: form.pickup,
      dropoff: form.dropoff,
      sender_phone: form.senderPhone,
      receiver_phone: form.receiverPhone,
      delivery_type: form.delivery,
      price: 0,
      status: "pending_payment",
    });

    if (dbError) {
      setError("Failed to save dispatch. Please try again.");
      setLoading(false);
      return;
    }

    setTrackingId(id);
    setShowPayment(false);
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="container px-4 py-12 text-center animate-fade-in-up">
        <div className="bg-card rounded-2xl p-8 border max-w-md mx-auto">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="font-display font-bold text-xl mb-2">Package Booked!</h2>
          <p className="text-sm text-muted-foreground mb-4">Payment status: Pending Verification</p>
          <div className="bg-secondary rounded-lg p-4 text-left text-sm space-y-1 mb-4">
            <p><span className="font-medium">Tracking ID:</span> <span className="font-mono text-accent font-bold">{trackingId}</span></p>
            <p><span className="font-medium">Package:</span> {form.packageType}</p>
            <p><span className="font-medium">From:</span> {form.pickup}</p>
            <p><span className="font-medium">To:</span> {form.dropoff}</p>
            <p><span className="font-medium">Sender:</span> {form.senderName} ({form.senderPhone})</p>
            <p><span className="font-medium">Receiver:</span> {form.receiverName} ({form.receiverPhone})</p>
            <p><span className="font-medium">Delivery:</span> {form.delivery === "same-day" ? "Same Day" : "Next Day"}</p>
            <p className="font-semibold text-accent">Status: Pending Verification</p>
          </div>
          <p className="text-xs text-muted-foreground">📦 Show this invoice when dropping off package. We'll notify you on WhatsApp.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 max-w-lg mx-auto">
      <h1 className="font-display font-bold text-xl mb-1 animate-fade-in-up">Send a Package</h1>
      <p className="text-sm text-muted-foreground mb-6 animate-fade-in-up-delay-1">Fast & affordable dispatch across routes</p>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-xl mb-4 animate-shake">
          {error}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-4 animate-fade-in-up-delay-2">
        <div>
          <label className="block text-sm font-medium mb-1.5">Package Type</label>
          <select value={form.packageType} onChange={(e) => handleChange("packageType", e.target.value)} required className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all">
            <option value="">Select type</option>
            {packageTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Pickup Location</label>
          <input type="text" value={form.pickup} onChange={(e) => handleChange("pickup", e.target.value)} required placeholder="e.g. LAUTECH Gate, Ogbomoso" className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Delivery Location</label>
          <input type="text" value={form.dropoff} onChange={(e) => handleChange("dropoff", e.target.value)} required placeholder="e.g. Iwo Road, Ibadan" className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Sender Name</label>
            <input type="text" value={form.senderName} onChange={(e) => handleChange("senderName", e.target.value)} required placeholder="Full name" className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Sender Phone</label>
            <input type="tel" value={form.senderPhone} onChange={(e) => handleChange("senderPhone", e.target.value)} required placeholder="080..." className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Receiver Name</label>
            <input type="text" value={form.receiverName} onChange={(e) => handleChange("receiverName", e.target.value)} required placeholder="Full name" className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Receiver Phone</label>
            <input type="tel" value={form.receiverPhone} onChange={(e) => handleChange("receiverPhone", e.target.value)} required placeholder="080..." className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Delivery Speed</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "next-day", label: "Next Day" },
              { value: "same-day", label: "Same Day" },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  form.delivery === opt.value ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"
                }`}
              >
                <input type="radio" name="delivery" value={opt.value} checked={form.delivery === opt.value} onChange={(e) => handleChange("delivery", e.target.value)} className="sr-only" />
                <span className="text-sm font-semibold">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="w-full bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2">
          <Package size={18} />
          Proceed to Payment
        </button>
      </form>

      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onConfirmPaid={handleConfirmPaid}
        loading={loading}
      />

      <WhatsAppButton />
    </div>
  );
};

export default SendPackage;
