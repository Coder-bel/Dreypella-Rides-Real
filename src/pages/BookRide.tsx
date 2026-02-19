/**
 * Payments are manual via Opay transfer. Admin verifies manually and updates booking status to 'Confirmed'.
 */
import { useState, useEffect } from "react";
import { Bus, CheckCircle } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";
import PaymentModal from "@/components/PaymentModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const cities = ["Lagos", "Ibadan", "Ogbomoso", "Iseyin", "Oyo"];
const routeOptions = cities.flatMap((from) =>
  cities.filter((to) => to !== from).map((to) => `${from} → ${to}`)
);

const generateRef = () =>
  "DR-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();

const BookRide = () => {
  const { user } = useAuth();
  const [route, setRoute] = useState("");
  const [date, setDate] = useState("");
  const [pickup, setPickup] = useState("");
  const [seats, setSeats] = useState(1);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingRef, setBookingRef] = useState("");

  // Pre-fill from profile
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone").eq("user_id", user.id).single().then(({ data }) => {
      if (data?.full_name) setFullName(data.full_name);
      if (data?.phone) setPhone(data.phone);
    });
  }, [user]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPayment(true);
  };

  const handleConfirmPaid = async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    const ref = generateRef();

    const { error: dbError } = await supabase.from("bookings").insert({
      user_id: user.id,
      route,
      travel_date: date,
      pickup,
      passengers: seats,
      price: 0,
      status: "pending_payment",
    });

    if (dbError) {
      setError("Failed to save booking. Please try again.");
      setLoading(false);
      return;
    }

    setBookingRef(ref);
    setShowPayment(false);
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="container px-4 py-12 text-center animate-fade-in-up">
        <div className="bg-card rounded-2xl p-8 border max-w-md mx-auto">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="font-display font-bold text-xl mb-2">Booking Submitted!</h2>
          <p className="text-sm text-muted-foreground mb-4">Payment status: Pending Verification</p>
          <div className="bg-secondary rounded-lg p-4 text-left text-sm space-y-1 mb-4">
            <p><span className="font-medium">Booking Ref:</span> <span className="font-mono text-accent font-bold">{bookingRef}</span></p>
            <p><span className="font-medium">Name:</span> {fullName}</p>
            <p><span className="font-medium">Phone:</span> {phone}</p>
            <p><span className="font-medium">Route:</span> {route}</p>
            <p><span className="font-medium">Date:</span> {date}</p>
            <p><span className="font-medium">Pickup:</span> {pickup}</p>
            <p><span className="font-medium">Seats:</span> {seats}</p>
            <p className="font-semibold text-accent">Status: Pending Verification</p>
          </div>
          <p className="text-xs text-muted-foreground">🎟️ Show this at the bus for boarding. You'll be confirmed on WhatsApp shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 max-w-lg mx-auto">
      <h1 className="font-display font-bold text-xl mb-1 animate-fade-in-up">Book a Ride</h1>
      <p className="text-sm text-muted-foreground mb-6 animate-fade-in-up-delay-1">Select your route and travel date</p>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-xl mb-4 animate-shake">
          {error}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-4 animate-fade-in-up-delay-2">
        <div>
          <label className="block text-sm font-medium mb-1.5">Route</label>
          <select value={route} onChange={(e) => setRoute(e.target.value)} required className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all">
            <option value="">Select route</option>
            {routeOptions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Travel Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required min={new Date().toISOString().split("T")[0]} className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Pickup Location</label>
          <input type="text" value={pickup} onChange={(e) => setPickup(e.target.value)} required placeholder="e.g. LAUTECH Gate, Under G, Iseyin Market" className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Number of Seats</label>
          <select value={seats} onChange={(e) => setSeats(Number(e.target.value))} className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all">
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? "seat" : "seats"}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Full Name</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Your full name" className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Phone Number</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="080..." className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
        </div>

        <button type="submit" className="w-full bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2">
          <Bus size={18} />
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

export default BookRide;
