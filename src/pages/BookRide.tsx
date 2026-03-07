/**
 * Payments are manual via Opay transfer. Admin verifies manually and updates booking status to 'Confirmed'.
 * Trip schedules, pickup points, and pricing are loaded dynamically from the trips table.
 */
import { useState, useEffect } from "react";
import { Bus, CheckCircle, MessageCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import WhatsAppButton from "@/components/WhatsAppButton";
import PaymentModal from "@/components/PaymentModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Trip = {
  id: string;
  route: string;
  travel_date: string;
  departure_time: string;
  price: number;
  available_seats: number;
  pickup_points: string[];
  is_active: boolean;
};

const generateRef = () =>
  "DR-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();

const BookRide = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [pickup, setPickup] = useState("");
  const [seats, setSeats] = useState(1);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingRef, setBookingRef] = useState("");

  // Fetch active trips
  const fetchTrips = async () => {
    const { data } = await supabase
      .from("trips")
      .select("*")
      .eq("is_active", true)
      .order("travel_date", { ascending: true });
    if (data) setTrips(data as Trip[]);
  };

  useEffect(() => { fetchTrips(); }, []);

  // Real-time subscription for trips
  useEffect(() => {
    const channel = supabase
      .channel("user-trips-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, () => fetchTrips())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Pre-fill from profile
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone").eq("user_id", user.id).single().then(({ data }) => {
      if (data?.full_name) setFullName(data.full_name);
      if (data?.phone) setPhone(data.phone);
    });
  }, [user]);

  // Get unique routes from trips
  const routes = [...new Set(trips.map((t) => t.route))];

  // Get trips for the selected route
  const [selectedRoute, setSelectedRoute] = useState("");
  const tripsForRoute = trips.filter((t) => t.route === selectedRoute);

  const handleTripSelect = (tripId: string) => {
    const trip = trips.find((t) => t.id === tripId) || null;
    setSelectedTrip(trip);
    setPickup("");
    if (trip && seats > trip.available_seats) {
      setSeats(Math.min(seats, trip.available_seats));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;
    setShowPayment(true);
  };

  const handleConfirmPaid = async () => {
    if (!user || !selectedTrip) return;
    setLoading(true);
    setError("");

    const ref = generateRef();
    const totalPrice = selectedTrip.price * seats;
    const tripLabel = `${selectedTrip.travel_date} - ${selectedTrip.departure_time}`;

    const { error: dbError } = await supabase.from("bookings").insert({
      user_id: user.id,
      route: selectedTrip.route,
      travel_date: tripLabel,
      pickup,
      passengers: seats,
      price: totalPrice,
      status: "pending_payment",
    });

    if (dbError) {
      setError("Failed to save booking. Please try again.");
      setLoading(false);
      return;
    }

    // Decrement available seats; auto-deactivate if fully booked
    const newSeats = selectedTrip.available_seats - seats;
    await supabase
      .from("trips")
      .update({
        available_seats: newSeats,
        is_active: newSeats > 0,
      })
      .eq("id", selectedTrip.id);

    setBookingRef(ref);
    setShowPayment(false);
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    const tripLabel = selectedTrip
      ? `${selectedTrip.travel_date} - ${selectedTrip.departure_time}`
      : "";
    return (
      <div className="container px-4 py-12 text-center animate-fade-in-up">
        <div className="bg-card rounded-2xl p-8 border max-w-md mx-auto">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="font-display font-bold text-xl mb-2">Booking Submitted!</h2>
          <p className="text-sm text-muted-foreground mb-4">Payment status: Pending Verification</p>
          <div className="bg-accent/10 rounded-xl p-4 text-center mb-4">
            <p className="text-xs text-muted-foreground mb-1">Your Booking Reference</p>
            <p className="text-2xl font-mono font-bold text-accent">{bookingRef}</p>
          </div>
          <div className="bg-secondary rounded-lg p-4 text-left text-sm space-y-1 mb-4">
            <p><span className="font-medium">Name:</span> {fullName}</p>
            <p><span className="font-medium">Phone:</span> {phone}</p>
            <p><span className="font-medium">Route:</span> {selectedTrip?.route}</p>
            <p><span className="font-medium">Date/Time:</span> {tripLabel}</p>
            <p><span className="font-medium">Pickup:</span> {pickup}</p>
            <p><span className="font-medium">Seats:</span> {seats}</p>
            <p className="font-semibold text-accent">Status: Pending Verification</p>
          </div>
          <p className="text-xs text-muted-foreground mb-4">🎟️ Show this at the bus for boarding. Payment verification may take up to 1 hour.</p>
          <a
            href={`https://wa.me/2349039029914?text=${encodeURIComponent(`Hi, I just made payment for booking ${bookingRef}. Name: ${fullName}. Please confirm.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <MessageCircle size={18} fill="white" />
            Send Payment Proof → WhatsApp
          </a>
        </div>
      </div>
    );
  }

  const maxSeats = selectedTrip ? Math.min(selectedTrip.available_seats, 5) : 5;

  return (
    <div className="container px-4 py-6 max-w-lg mx-auto">
      <h1 className="font-display font-bold text-xl mb-1 animate-fade-in-up">Book a Ride</h1>
      <p className="text-sm text-muted-foreground mb-6 animate-fade-in-up-delay-1">Select your route and travel date</p>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-xl mb-4 animate-shake">
          {error}
        </div>
      )}

      {trips.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 border text-center">
          <Bus size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">No trips available right now. Check back later or contact us on WhatsApp.</p>
          <a
            href="https://wa.me/2349039029914?text=Hi%2C%20I%20want%20to%20know%20about%20available%20trips"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] text-white text-sm font-medium hover:bg-[#20BD5A] transition-colors"
          >
            <MessageCircle size={16} fill="white" /> Contact on WhatsApp
          </a>
        </div>
      ) : (
        <form onSubmit={handleFormSubmit} className="space-y-4 animate-fade-in-up-delay-2">
          <div>
            <label className="block text-sm font-medium mb-1.5">Route</label>
            <select
              value={selectedRoute}
              onChange={(e) => { setSelectedRoute(e.target.value); setSelectedTrip(null); setPickup(""); }}
              required
              className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
            >
              <option value="">Select route</option>
              {routes.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {selectedRoute && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Travel Date & Time</label>
              <select
                value={selectedTrip?.id || ""}
                onChange={(e) => handleTripSelect(e.target.value)}
                required
                className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
              >
                <option value="">Select date & time</option>
                {tripsForRoute.map((t) => {
                  const dateLabel = format(parseISO(t.travel_date), "EEEE dd MMM yyyy");
                  return (
                    <option key={t.id} value={t.id}>
                      {dateLabel} - {t.departure_time} ({t.available_seats} seats left • ₦{t.price.toLocaleString()})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {selectedTrip && selectedTrip.pickup_points.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Pickup Point</label>
              <select
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                required
                className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
              >
                <option value="">Select pickup point</option>
                {selectedTrip.pickup_points.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}

          {selectedTrip && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Number of Seats</label>
              <select
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
              >
                {Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? "seat" : "seats"}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Your full name" className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Phone Number</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="080..." className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
          </div>

          {selectedTrip && (
            <div className="bg-accent/10 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-accent">₦{(selectedTrip.price * seats).toLocaleString()}</p>
            </div>
          )}

          <button type="submit" disabled={!selectedTrip} className="w-full bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50">
            <Bus size={18} />
            Proceed to Payment
          </button>
        </form>
      )}

      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onConfirmPaid={handleConfirmPaid}
        loading={loading}
        totalPrice={selectedTrip ? selectedTrip.price * seats : undefined}
        remark={`${fullName} + Booking Ref`}
      />

      <WhatsAppButton />
    </div>
  );
};

export default BookRide;
