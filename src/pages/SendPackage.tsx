/**
 * Package delivery uses pay-on-delivery model. Distance-based pricing is approximate/hardcoded for MVP.
 * Real distance API (Google Maps or similar) can be added later via admin or backend.
 */
import { useState } from "react";
import { Package, CheckCircle, MessageCircle, Calculator } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const packageTypes = ["Small Envelope", "Medium Box", "Large Box", "Electronics", "Documents", "Other"];

/** Hardcoded approximate distances (km) between cities for MVP */
const CITY_DISTANCES: Record<string, Record<string, number>> = {
  ogbomoso: { ibadan: 55, lagos: 140, iseyin: 45, oyo: 35 },
  ibadan: { ogbomoso: 55, lagos: 120, iseyin: 70, oyo: 60 },
  lagos: { ogbomoso: 140, ibadan: 120, iseyin: 180, oyo: 170 },
  iseyin: { ogbomoso: 45, ibadan: 70, lagos: 180, oyo: 80 },
  oyo: { ogbomoso: 35, ibadan: 60, lagos: 170, iseyin: 80 },
};

const OYO_STATE_CITIES = ["ogbomoso", "ibadan", "iseyin", "oyo"];

const KNOWN_CITIES = ["ogbomoso", "ibadan", "lagos", "iseyin", "oyo"];

/** Try to match free-text location to a known city */
const matchCity = (text: string): string | null => {
  const lower = text.toLowerCase();
  return KNOWN_CITIES.find((c) => lower.includes(c)) || null;
};

/** Calculate estimated price. Returns null if cities can't be matched. */
const calculatePrice = (pickup: string, dropoff: string): { price: number; distance: number; matched: boolean } | null => {
  const pickupCity = matchCity(pickup);
  const dropoffCity = matchCity(dropoff);
  if (!pickupCity || !dropoffCity) return null;
  if (pickupCity === dropoffCity) {
    const baseFee = 500;
    return { price: baseFee, distance: 0, matched: true };
  }
  const distance = CITY_DISTANCES[pickupCity]?.[dropoffCity];
  if (distance == null) return null;
  const isInterState = !(OYO_STATE_CITIES.includes(pickupCity) && OYO_STATE_CITIES.includes(dropoffCity));
  const baseFee = isInterState ? 1000 : 500;
  return { price: baseFee + distance * 100, distance, matched: true };
};

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
  const [priceInfo, setPriceInfo] = useState<{ price: number; distance: number } | null>(null);
  const [priceUnknown, setPriceUnknown] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [error, setError] = useState("");

  const handleChange = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleCalculatePrice = () => {
    if (!form.pickup.trim() || !form.dropoff.trim()) return;
    const result = calculatePrice(form.pickup, form.dropoff);
    if (result) {
      setPriceInfo(result);
      setPriceUnknown(false);
    } else {
      setPriceInfo(null);
      setPriceUnknown(true);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!priceInfo && !priceUnknown) {
      handleCalculatePrice();
      return;
    }
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
      price: priceInfo?.price ?? 0,
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
            {priceInfo && (
              <p className="font-semibold text-accent">Estimated Price: ₦{priceInfo.price.toLocaleString()}</p>
            )}
            <p className="font-semibold text-accent">Status: Pending Delivery & Payment</p>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-left mb-4 space-y-1">
            <p className="font-bold text-sm text-center">💰 Pay on Delivery</p>
            <p className="text-center text-muted-foreground">
              The receiver will pay the total amount{priceInfo ? ` (estimated ₦${priceInfo.price.toLocaleString()})` : ""} upon delivery.
            </p>
            <p className="text-center text-muted-foreground">Show this invoice when dropping off the package.</p>
          </div>
          <a
            href={`https://wa.me/2349039029914?text=${encodeURIComponent(`Hi, I booked a package dispatch ${trackingId}. Sender: ${form.senderName}. Please confirm pickup.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <MessageCircle size={18} fill="white" />
            Contact Us on WhatsApp
          </a>
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

        {/* Price calculation result */}
        {priceInfo && (
          <div className="bg-accent/10 rounded-xl p-4 text-center animate-fade-in-up">
            <p className="text-xs text-muted-foreground mb-1">Estimated Price ({priceInfo.distance} km)</p>
            <p className="text-2xl font-display font-bold text-accent">₦{priceInfo.price.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Pay on delivery – receiver pays upon receipt</p>
          </div>
        )}
        {priceUnknown && (
          <div className="bg-secondary rounded-xl p-4 text-center text-sm animate-fade-in-up">
            <p className="font-medium mb-1">Unable to estimate price automatically</p>
            <p className="text-muted-foreground text-xs">
              Please <a href="https://wa.me/2349039029914?text=Hi%2C%20I%20need%20a%20price%20quote%20for%20package%20delivery" target="_blank" rel="noopener noreferrer" className="text-accent underline">contact us on WhatsApp</a> for an exact quote. You can still submit your dispatch below.
            </p>
          </div>
        )}

        {!priceInfo && !priceUnknown && form.pickup.trim() && form.dropoff.trim() && (
          <button
            type="button"
            onClick={handleCalculatePrice}
            className="w-full bg-secondary hover:bg-secondary/80 text-foreground font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Calculator size={18} />
            Calculate Price
          </button>
        )}

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
              {priceInfo || priceUnknown ? "Submit Dispatch (Pay on Delivery)" : "Proceed"}
            </>
          )}
        </button>
      </form>

      <WhatsAppButton />
    </div>
  );
};

export default SendPackage;
