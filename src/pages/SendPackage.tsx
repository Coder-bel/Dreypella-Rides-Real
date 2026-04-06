/**
 * Package delivery uses pay-on-delivery model.
 * Within Ogbomoso: base ₦500 + ₦100/km estimate.
 * Outside Ogbomoso: contact support for pricing.
 */
import { useState } from "react";
import { Package, CheckCircle, MessageCircle, Clock } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORT_WHATSAPP } from "@/lib/constants";

const packageTypes = ["Small Envelope", "Medium Box", "Large Box", "Electronics", "Documents", "Other"];

const generateTrackingId = () =>
  "DRP-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();

type DeliveryRegion = "" | "within" | "outside";

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
  const [deliveryRegion, setDeliveryRegion] = useState<DeliveryRegion>("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [error, setError] = useState("");

  const handleChange = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  /** Simple within-Ogbomoso price: ₦500 base + ₦100 × estimated km (fixed 5km for MVP) */
  const estimatedPrice = deliveryRegion === "within" ? 500 + 5 * 100 : 0;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!deliveryRegion) return;
    if (deliveryRegion === "outside") return;

    setLoading(true);
    setError("");

    const id = generateTrackingId();

    const { error: dbError } = await supabase.from("dispatches").insert({
      user_id: user.id,
      tracking_id: id,
      package_type: form.packageType,
      pickup: form.pickup,
      dropoff: form.dropoff,
      sender_name: form.senderName,
      sender_phone: form.senderPhone,
      receiver_name: form.receiverName,
      receiver_phone: form.receiverPhone,
      delivery_type: form.delivery,
      price: estimatedPrice,
      status: "pending_delivery",
    });

    if (dbError) {
      setError("Failed to save dispatch. Please try again.");
      setLoading(false);
      return;
    }

    setTrackingId(id);
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="container px-4 py-12 text-center animate-fade-in-up">
        <div className="bg-card rounded-2xl p-8 border max-w-md mx-auto">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="font-display font-bold text-xl mb-2">Package Dispatch Confirmed!</h2>
          <p className="text-sm text-muted-foreground mb-4">Status: Pending Delivery & Payment</p>
          <div className="bg-accent/10 rounded-xl p-4 text-center mb-4">
            <p className="text-xs text-muted-foreground mb-1">Your Tracking ID</p>
            <p className="text-2xl font-mono font-bold text-accent">{trackingId}</p>
          </div>
          <div className="bg-secondary rounded-lg p-4 text-left text-sm space-y-1 mb-4">
            <p><span className="font-medium">Package:</span> {form.packageType}</p>
            <p><span className="font-medium">From:</span> {form.pickup}</p>
            <p><span className="font-medium">To:</span> {form.dropoff}</p>
            <p><span className="font-medium">Sender:</span> {form.senderName} ({form.senderPhone})</p>
            <p><span className="font-medium">Receiver:</span> {form.receiverName} ({form.receiverPhone})</p>
            <p><span className="font-medium">Delivery:</span> {form.delivery === "same-day" ? "Same Day" : "Next Day"}</p>
            <p className="font-semibold text-accent">Estimated Price: ₦{estimatedPrice.toLocaleString()}</p>
            <p className="font-semibold text-accent">Status: Pending Delivery & Payment</p>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-left mb-4 space-y-1">
            <p className="font-bold text-sm text-center">💰 Pay on Delivery</p>
            <p className="text-center text-muted-foreground">
              The receiver will pay ₦{estimatedPrice.toLocaleString()} upon delivery.
            </p>
          </div>
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-center">
            <Clock size={24} className="mx-auto text-blue-500 mb-2" />
            <p className="text-sm font-semibold text-blue-600">Waiting for a rider to accept your order</p>
            <p className="text-xs text-muted-foreground mt-1">Once a rider accepts, their WhatsApp number will appear on your dashboard so you can coordinate the pickup.</p>
          </div>
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
          <input type="text" value={form.dropoff} onChange={(e) => handleChange("dropoff", e.target.value)} required placeholder="e.g. Arada, Ogbomoso" className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
        </div>

        {/* Delivery region question */}
        {form.pickup.trim() && form.dropoff.trim() && (
          <div className="animate-fade-in-up">
            <label className="block text-sm font-medium mb-2">Is the delivery within Ogbomoso or outside the region?</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  deliveryRegion === "within" ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"
                }`}
              >
                <input type="radio" name="deliveryRegion" value="within" checked={deliveryRegion === "within"} onChange={() => setDeliveryRegion("within")} className="sr-only" />
                <span className="text-sm font-semibold">Within Ogbomoso</span>
              </label>
              <label
                className={`flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  deliveryRegion === "outside" ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"
                }`}
              >
                <input type="radio" name="deliveryRegion" value="outside" checked={deliveryRegion === "outside"} onChange={() => setDeliveryRegion("outside")} className="sr-only" />
                <span className="text-sm font-semibold">Outside Ogbomoso</span>
              </label>
            </div>
          </div>
        )}

        {/* Outside Ogbomoso → contact support */}
        {deliveryRegion === "outside" && (
          <div className="bg-secondary rounded-xl p-5 text-center animate-fade-in-up">
            <p className="font-semibold text-sm mb-2">Deliveries outside Ogbomoso</p>
            <p className="text-xs text-muted-foreground mb-4">
              For deliveries outside Ogbomoso, please contact support for pricing and details.
            </p>
            <a
              href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent("Hello DREYPELLA support, I want to send a package outside Ogbomoso")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
            >
              <MessageCircle size={16} fill="#25D366" />
              Contact Support on WhatsApp
            </a>
            <p className="text-xs text-muted-foreground mt-3">+234 808 214 4372</p>
          </div>
        )}

        {/* Within Ogbomoso → show price & continue */}
        {deliveryRegion === "within" && (
          <>
            <div className="bg-accent/10 rounded-xl p-4 text-center animate-fade-in-up">
              <p className="text-xs text-muted-foreground mb-1">Estimated Price</p>
              <p className="text-2xl font-display font-bold text-accent">₦{estimatedPrice.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Pay on delivery – receiver pays upon receipt</p>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Package size={18} />
                  Submit Dispatch (Pay on Delivery)
                </>
              )}
            </button>
          </>
        )}
      </form>

      <WhatsAppButton />
    </div>
  );
};

export default SendPackage;
