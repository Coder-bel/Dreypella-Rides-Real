/**
 * Package delivery uses pay-on-delivery model with distance-based pricing.
 * Short Distance (0-6km): ₦900 base + ₦120/km
 * Long Distance (7km+): ₦1,000 base + ₦150/km
 * Large Package: +₦500
 */
import { useState } from "react";
import { Package, CheckCircle, MessageCircle, Clock, Calculator } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORT_WHATSAPP } from "@/lib/constants";

const packageTypes = ["Small Envelope", "Medium Box", "Large Box", "Electronics", "Documents", "Other"];
const LARGE_PACKAGE_TYPES = ["Large Box"];

const generateTrackingId = () =>
  "DRP-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();

/** Approximate distances (km) between major cities */
const CITY_DISTANCES: Record<string, Record<string, number>> = {
  lagos:    { lagos: 0, ibadan: 128, ogbomoso: 220, oyo: 168, iseyin: 200 },
  ibadan:   { lagos: 128, ibadan: 0, ogbomoso: 100, oyo: 42, iseyin: 75 },
  ogbomoso: { lagos: 220, ibadan: 100, ogbomoso: 0, oyo: 58, iseyin: 90 },
  oyo:      { lagos: 168, ibadan: 42, ogbomoso: 58, oyo: 0, iseyin: 48 },
  iseyin:   { lagos: 200, ibadan: 75, ogbomoso: 90, oyo: 48, iseyin: 0 },
};

const CITY_KEYWORDS = Object.keys(CITY_DISTANCES);

/** Try to detect which city a location string refers to */
const detectCity = (text: string): string | null => {
  const lower = text.toLowerCase();
  for (const city of CITY_KEYWORDS) {
    if (lower.includes(city)) return city;
  }
  // Common aliases
  if (lower.includes("lautech") || lower.includes("arada") || lower.includes("takie")) return "ogbomoso";
  if (lower.includes("ui ") || lower.includes("bodija") || lower.includes("challenge") || lower.includes("mokola")) return "ibadan";
  if (lower.includes("lekki") || lower.includes("ikeja") || lower.includes("yaba") || lower.includes("surulere") || lower.includes("ajah")) return "lagos";
  if (lower.includes("akesan") || lower.includes("atiba")) return "oyo";
  return null;
};

/** Estimate distance between two location strings */
const estimateDistance = (pickup: string, dropoff: string): number | null => {
  const cityA = detectCity(pickup);
  const cityB = detectCity(dropoff);
  if (!cityA || !cityB) return null;
  if (cityA === cityB) return 5; // same city default ~5km
  return CITY_DISTANCES[cityA]?.[cityB] ?? null;
};

type PriceBreakdown = {
  distance: number;
  isLongDistance: boolean;
  baseFee: number;
  ratePerKm: number;
  perKmCharge: number;
  largePackageFee: number;
  total: number;
};

const calculatePrice = (distanceKm: number, isLargePackage: boolean): PriceBreakdown => {
  const isLongDistance = distanceKm >= 7;
  const baseFee = isLongDistance ? 1000 : 900;
  const ratePerKm = isLongDistance ? 150 : 120;
  const perKmCharge = distanceKm * ratePerKm;
  const largePackageFee = isLargePackage ? 500 : 0;
  const total = baseFee + perKmCharge + largePackageFee;
  return { distance: distanceKm, isLongDistance, baseFee, ratePerKm, perKmCharge, largePackageFee, total };
};

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
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [cantEstimate, setCantEstimate] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [error, setError] = useState("");

  const handleChange = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    // Reset price when locations change
    if (field === "pickup" || field === "dropoff" || field === "packageType") {
      setPriceBreakdown(null);
      setCantEstimate(false);
    }
  };

  const isLargePackage = LARGE_PACKAGE_TYPES.includes(form.packageType);

  const handleCalculatePrice = () => {
    const dist = estimateDistance(form.pickup, form.dropoff);
    if (dist === null) {
      setCantEstimate(true);
      setPriceBreakdown(null);
      return;
    }
    setCantEstimate(false);
    setPriceBreakdown(calculatePrice(dist, isLargePackage));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !priceBreakdown) return;

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
      price: priceBreakdown.total,
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
            {priceBreakdown && (
              <>
                <p><span className="font-medium">Distance:</span> ~{priceBreakdown.distance} km</p>
                <p className="font-semibold text-accent">Total Price: ₦{priceBreakdown.total.toLocaleString()}</p>
              </>
            )}
            <p className="font-semibold text-accent">Status: Pending Delivery & Payment</p>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-left mb-4 space-y-1">
            <p className="font-bold text-sm text-center">💰 Pay on Delivery</p>
            <p className="text-center text-muted-foreground">
              The receiver will pay ₦{priceBreakdown?.total.toLocaleString()} upon delivery.
            </p>
            <p className="text-center text-muted-foreground mt-2">
              For reference — Account: Beloved Okikioluwa Isiak, Opay, 8082144372
            </p>
          </div>
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-center mb-4">
            <Clock size={24} className="mx-auto text-blue-500 mb-2" />
            <p className="text-sm font-semibold text-blue-600">Waiting for a rider to accept your order</p>
            <p className="text-xs text-muted-foreground mt-1">Once a rider accepts, their WhatsApp number will appear on your dashboard so you can coordinate the pickup.</p>
          </div>
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Hello DREYPELLA support, regarding my package ${trackingId}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <MessageCircle size={18} fill="white" />
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  const canCalculate = form.pickup.trim() && form.dropoff.trim() && form.packageType;

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
          {isLargePackage && (
            <p className="text-xs text-muted-foreground mt-1">⚠️ Large package surcharge of ₦500 applies</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Pickup Location</label>
          <input type="text" value={form.pickup} onChange={(e) => handleChange("pickup", e.target.value)} required placeholder="e.g. LAUTECH Gate, Ogbomoso" className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Delivery Location</label>
          <input type="text" value={form.dropoff} onChange={(e) => handleChange("dropoff", e.target.value)} required placeholder="e.g. Arada, Ogbomoso" className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
        </div>

        {/* Calculate Price button */}
        {canCalculate && !priceBreakdown && (
          <button
            type="button"
            onClick={handleCalculatePrice}
            className="w-full bg-secondary hover:bg-secondary/80 text-foreground font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Calculator size={18} />
            Calculate Price
          </button>
        )}

        {/* Can't estimate → contact support */}
        {cantEstimate && (
          <div className="bg-secondary rounded-xl p-5 text-center animate-fade-in-up">
            <p className="font-semibold text-sm mb-2">Unable to estimate distance</p>
            <p className="text-xs text-muted-foreground mb-4">
              Please include a city name (Lagos, Ibadan, Ogbomoso, Oyo, Iseyin) in your locations, or contact support for a quote.
            </p>
            <a
              href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent("Hello DREYPELLA support, I need a delivery price quote. Pickup: " + form.pickup + " → Delivery: " + form.dropoff)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
            >
              <MessageCircle size={16} fill="#25D366" />
              Contact Support for Quote
            </a>
          </div>
        )}

        {/* Price breakdown */}
        {priceBreakdown && (
          <div className="bg-accent/10 rounded-xl p-4 animate-fade-in-up space-y-2">
            <p className="font-semibold text-sm text-center mb-2">Price Breakdown</p>
            <div className="bg-card rounded-lg p-3 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distance</span>
                <span className="font-medium">~{priceBreakdown.distance} km ({priceBreakdown.isLongDistance ? "Long Distance" : "Short Distance"})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Fee</span>
                <span className="font-medium">₦{priceBreakdown.baseFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Per km ({priceBreakdown.distance} × ₦{priceBreakdown.ratePerKm})</span>
                <span className="font-medium">₦{priceBreakdown.perKmCharge.toLocaleString()}</span>
              </div>
              {priceBreakdown.largePackageFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Large Package Fee</span>
                  <span className="font-medium">₦{priceBreakdown.largePackageFee.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t pt-1.5 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-accent">₦{priceBreakdown.total.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">Pay on delivery – receiver pays upon receipt</p>
          </div>
        )}

        {/* Rest of form after price calculated */}
        {priceBreakdown && (
          <>
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
