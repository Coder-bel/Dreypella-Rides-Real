import { useState } from "react";
import { Bus, AlertTriangle, CheckCircle } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const routeOptions = [
  "Ogbomoso → Lagos",
  "Ogbomoso → Ibadan",
  "Ibadan → Lagos",
  "Lagos → Ogbomoso",
  "Lagos → Ibadan",
  "Ibadan → Ogbomoso",
];

const pickupLocations: Record<string, string[]> = {
  "Ogbomoso": ["LAUTECH Gate", "Under G", "General Hospital Area", "Sabo Area", "Oke Ado Hostel", "Adeta Hostel", "Aanuoluwapo Area"],
  "Lagos": ["Berger", "Ojota", "Maryland", "Yaba", "Ikeja"],
  "Ibadan": ["Iwo Road", "Gate (UI)", "Bodija", "Challenge", "Ojoo"],
};

const getPickups = (route: string) => {
  const from = route.split(" → ")[0];
  return pickupLocations[from] || [];
};

const prices: Record<string, number> = {
  "Ogbomoso → Lagos": 4000,
  "Ogbomoso → Ibadan": 2500,
  "Ibadan → Lagos": 3000,
  "Lagos → Ogbomoso": 4000,
  "Lagos → Ibadan": 3000,
  "Ibadan → Ogbomoso": 2500,
};

const BookRide = () => {
  const { user } = useAuth();
  const [route, setRoute] = useState("");
  const [date, setDate] = useState("");
  const [pickup, setPickup] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const seatsLeft = 7;
  const price = route ? (prices[route] || 0) * passengers : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");

    // Save booking to database
    const { error: dbError } = await supabase.from("bookings").insert({
      user_id: user.id,
      route,
      travel_date: date,
      pickup,
      passengers,
      price,
      status: "confirmed",
    });

    if (dbError) {
      setError("Failed to save booking. Please try again.");
      setLoading(false);
      return;
    }

    // Add 10% cashback to wallet
    const cashback = Math.round(price * 0.1);
    await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      amount: cashback,
      type: "cashback",
      reference: `Cashback for ${route}`,
    });

    // Update wallet balance
    const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", user.id).single();
    if (profile) {
      await supabase.from("profiles").update({ wallet_balance: (profile.wallet_balance || 0) + cashback }).eq("user_id", user.id);
    }

    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    const cashback = Math.round(price * 0.1);
    return (
      <div className="container px-4 py-12 text-center animate-fade-in-up">
        <div className="bg-card rounded-2xl p-8 border max-w-md mx-auto">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="font-display font-bold text-xl mb-2">Booking Confirmed!</h2>
          <p className="text-sm text-muted-foreground mb-4">Your seat has been reserved.</p>
          <div className="bg-secondary rounded-lg p-4 text-left text-sm space-y-1 mb-4">
            <p><span className="font-medium">Route:</span> {route}</p>
            <p><span className="font-medium">Date:</span> {date}</p>
            <p><span className="font-medium">Pickup:</span> {pickup}</p>
            <p><span className="font-medium">Passengers:</span> {passengers}</p>
            <p className="font-bold text-accent">Total: ₦{price.toLocaleString()}</p>
            <p className="text-green-600 font-medium">🎁 ₦{cashback.toLocaleString()} cashback added to wallet!</p>
          </div>
          <p className="text-xs text-muted-foreground">You'll receive a confirmation on WhatsApp shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 max-w-lg mx-auto">
      <h1 className="font-display font-bold text-xl mb-1 animate-fade-in-up">Book a Ride</h1>
      <p className="text-sm text-muted-foreground mb-6 animate-fade-in-up-delay-1">Select your route and travel date</p>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-xl mb-4 animate-shake">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in-up-delay-2">
        <div>
          <label className="block text-sm font-medium mb-1.5">Route</label>
          <select value={route} onChange={(e) => { setRoute(e.target.value); setPickup(""); }} required className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all">
            <option value="">Select route</option>
            {routeOptions.map((r) => (
              <option key={r} value={r}>{r} — ₦{prices[r]?.toLocaleString()}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Travel Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required min={new Date().toISOString().split("T")[0]} className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
        </div>

        {route && (
          <div className="animate-fade-in-up">
            <label className="block text-sm font-medium mb-1.5">Pickup Location</label>
            <select value={pickup} onChange={(e) => setPickup(e.target.value)} required className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all">
              <option value="">Select pickup</option>
              {getPickups(route).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">Passengers</label>
          <select value={passengers} onChange={(e) => setPassengers(Number(e.target.value))} className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all">
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? "passenger" : "passengers"}</option>
            ))}
          </select>
        </div>

        {seatsLeft < 8 && (
          <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${seatsLeft < 5 ? "bg-accent/10 text-accent" : "bg-secondary text-foreground"}`}>
            <AlertTriangle size={14} />
            <span className="font-medium">Only {seatsLeft} seats left – book now!</span>
          </div>
        )}

        {price > 0 && (
          <div className="bg-secondary rounded-xl p-4 text-center animate-fade-in-up">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Price</p>
            <p className="text-2xl font-display font-bold text-accent">₦{price.toLocaleString()}</p>
            <p className="text-xs text-green-600 mt-1">🎁 ₦{Math.round(price * 0.1).toLocaleString()} cashback to wallet</p>
          </div>
        )}

        <button type="submit" disabled={loading} className="w-full bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? (
            <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
          ) : (
            <>
              <Bus size={18} />
              Confirm Booking
            </>
          )}
        </button>
      </form>

      <WhatsAppButton />
    </div>
  );
};

export default BookRide;
