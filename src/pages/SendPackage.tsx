import { useState } from "react";
import { Package, CheckCircle } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";

const packageTypes = ["Small Envelope", "Medium Box", "Large Box", "Electronics", "Documents"];
const locations = ["LAUTECH Gate", "Under G", "General Hospital Area", "Sabo Area", "Iwo Road (Ibadan)", "Bodija (Ibadan)", "Berger (Lagos)", "Yaba (Lagos)", "Ikeja (Lagos)", "Ojota (Lagos)"];

const SendPackage = () => {
  const [form, setForm] = useState({
    packageType: "",
    pickup: "",
    dropoff: "",
    senderPhone: "",
    receiverPhone: "",
    delivery: "next-day",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState("");

  const price = form.delivery === "same-day" ? 3500 : 2000;

  const handleChange = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const generateTrackingId = () => {
    return "DRP-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const id = generateTrackingId();
      setTrackingId(id);
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="container px-4 py-12 text-center animate-fade-in-up">
        <div className="bg-card rounded-2xl p-8 border max-w-md mx-auto">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="font-display font-bold text-xl mb-2">Package Booked!</h2>
          <p className="text-sm text-muted-foreground mb-4">Your dispatch has been scheduled.</p>
          <div className="bg-secondary rounded-lg p-4 text-left text-sm space-y-1 mb-4">
            <p><span className="font-medium">Tracking ID:</span> <span className="font-mono text-accent font-bold">{trackingId}</span></p>
            <p><span className="font-medium">Package:</span> {form.packageType}</p>
            <p><span className="font-medium">From:</span> {form.pickup}</p>
            <p><span className="font-medium">To:</span> {form.dropoff}</p>
            <p><span className="font-medium">Delivery:</span> {form.delivery === "same-day" ? "Same Day" : "Next Day"}</p>
            <p className="font-bold text-accent">Price: ₦{price.toLocaleString()}</p>
          </div>
          <p className="text-xs text-muted-foreground">Save your tracking ID. We'll notify you on WhatsApp.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 max-w-lg mx-auto">
      <h1 className="font-display font-bold text-xl mb-1 animate-fade-in-up">Send a Package</h1>
      <p className="text-sm text-muted-foreground mb-6 animate-fade-in-up-delay-1">Fast & affordable dispatch across routes</p>

      <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up-delay-2">
        <div>
          <label className="block text-sm font-medium mb-1.5">Package Type</label>
          <select value={form.packageType} onChange={(e) => handleChange("packageType", e.target.value)} required className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all">
            <option value="">Select type</option>
            {packageTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Pickup Location</label>
          <select value={form.pickup} onChange={(e) => handleChange("pickup", e.target.value)} required className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all">
            <option value="">Select pickup</option>
            {locations.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Dropoff Location</label>
          <select value={form.dropoff} onChange={(e) => handleChange("dropoff", e.target.value)} required className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all">
            <option value="">Select dropoff</option>
            {locations.filter((l) => l !== form.pickup).map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Sender Phone</label>
            <input type="tel" value={form.senderPhone} onChange={(e) => handleChange("senderPhone", e.target.value)} required placeholder="080..." className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Receiver Phone</label>
            <input type="tel" value={form.receiverPhone} onChange={(e) => handleChange("receiverPhone", e.target.value)} required placeholder="080..." className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
          </div>
        </div>

        {/* Delivery speed */}
        <div>
          <label className="block text-sm font-medium mb-2">Delivery Speed</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "next-day", label: "Next Day", price: "₦2,000" },
              { value: "same-day", label: "Same Day", price: "₦3,500" },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  form.delivery === opt.value
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/30"
                }`}
              >
                <input
                  type="radio"
                  name="delivery"
                  value={opt.value}
                  checked={form.delivery === opt.value}
                  onChange={(e) => handleChange("delivery", e.target.value)}
                  className="sr-only"
                />
                <span className="text-sm font-semibold">{opt.label}</span>
                <span className="text-xs text-accent font-bold">{opt.price}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="bg-secondary rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Estimated Price</p>
          <p className="text-2xl font-display font-bold text-accent">₦{price.toLocaleString()}</p>
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
              Send Package
            </>
          )}
        </button>
      </form>

      <WhatsAppButton />
    </div>
  );
};

export default SendPackage;
