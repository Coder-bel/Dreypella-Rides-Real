/**
 * Package delivery — distance-based pricing via OpenRouteService API.
 * Same city: ₦600 base + ₦150/km
 * Interstate scenarios:
 * 1. Park → Park: just admin trip price
 * 2. Park → Address: trip price + last-mile km × ₦150
 * 3. Address → Park: pickup km × ₦150 + trip price
 * 4. Address → Address: pickup km × ₦150 + trip price + last-mile km × ₦150
 */
import { useState } from "react";
import { Package, CircleCheck as CheckCircle, MessageCircle, Clock, Calculator } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORT_WHATSAPP, OPAY_ACCOUNT, isValidPhone, PHONE_ERROR } from "@/lib/constants";

const packageTypes = ["Small Envelope", "Medium Box", "Large Box", "Electronics", "Documents", "Other"];
const LARGE_PACKAGE_TYPES = ["Large Box"];
const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;
const BASE_FEE = 600;
const RATE_PER_KM = 150;

const generateTrackingId = () =>
  "DRP-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();

// All motor parks per city — [longitude, latitude] format for ORS
const CITY_PARKS: Record<string, [number, number][]> = {
  lagos: [
    [3.3762, 6.5818],  // Ojota Motor Park
    [3.369, 6.517],    // Jibowu Bus Park
    [3.28, 6.47],      // Mile 2 Bus Park
  ],
  ibadan: [
    [3.9395, 7.4025],  // Iwo Road Terminal 1
    [3.9449, 7.4027],  // Iwo Road Terminal 2
    [3.878, 7.345],    // Challenge Bus Terminal
    [3.92, 7.45],      // Ojoo Bus Terminal
  ],
  ogbomoso: [
    [4.23764, 8.13645], // Takie Motor Park
  ],
  iseyin: [
    [3.59, 7.97],      // Iseyin Main Garage
    [3.6138, 7.9589],  // Ebedi Motor Park
  ],
  oyo: [
    [3.93, 7.84],      // Main Garage
  ],
};

// Park name keywords — if user types any of these, treat as a park directly
const PARK_KEYWORDS: Record<string, { city: string; coords: [number, number] }> = {
  // Lagos parks
  "ojota": { city: "lagos", coords: [3.3762, 6.5818] },
  "ojota motor park": { city: "lagos", coords: [3.3762, 6.5818] },
  "jibowu": { city: "lagos", coords: [3.369, 6.517] },
  "jibowu bus park": { city: "lagos", coords: [3.369, 6.517] },
  "mile 2": { city: "lagos", coords: [3.28, 6.47] },
  "mile2": { city: "lagos", coords: [3.28, 6.47] },
  "mile 2 bus park": { city: "lagos", coords: [3.28, 6.47] },
  // Ibadan parks
  "iwo road": { city: "ibadan", coords: [3.9395, 7.4025] },
  "iwo road terminal": { city: "ibadan", coords: [3.9395, 7.4025] },
  "challenge": { city: "ibadan", coords: [3.878, 7.345] },
  "challenge bus terminal": { city: "ibadan", coords: [3.878, 7.345] },
  "ojoo": { city: "ibadan", coords: [3.92, 7.45] },
  "ojoo bus terminal": { city: "ibadan", coords: [3.92, 7.45] },
  // Ogbomoso parks
  "takie": { city: "ogbomoso", coords: [4.23764, 8.13645] },
  "takie garage": { city: "ogbomoso", coords: [4.23764, 8.13645] },
  "takie motor park": { city: "ogbomoso", coords: [4.23764, 8.13645] },
  "takie junction": { city: "ogbomoso", coords: [4.23764, 8.13645] },
  // Iseyin parks
  "ebedi": { city: "iseyin", coords: [3.6138, 7.9589] },
  "ebedi motor park": { city: "iseyin", coords: [3.6138, 7.9589] },
  "iseyin garage": { city: "iseyin", coords: [3.59, 7.97] },
  "iseyin motor park": { city: "iseyin", coords: [3.59, 7.97] },
  // Oyo parks
  "oyo garage": { city: "oyo", coords: [3.93, 7.84] },
  "oyo motor park": { city: "oyo", coords: [3.93, 7.84] },
};

const CITY_OFFICIAL_NAMES: Record<string, string> = {
  lagos: "Lagos",
  ibadan: "Ibadan",
  ogbomoso: "Ogbomoso",
  iseyin: "Iseyin",
  oyo: "Oyo",
};

const CITY_FALLBACK_COORDS: Record<string, [number, number]> = {
  lagos:    [3.3792, 6.5244],
  ibadan:   [3.9470, 7.3775],
  ogbomoso: [4.2667, 8.1333],
  iseyin:   [3.6000, 7.9667],
  oyo:      [3.9333, 7.8500],
};

// Check if address matches a known park — returns park info or null
const detectPark = (text: string): { city: string; coords: [number, number] } | null => {
  const lower = text.toLowerCase().trim();
  for (const [keyword, park] of Object.entries(PARK_KEYWORDS)) {
    if (lower.includes(keyword)) return park;
  }
  return null;
};

const detectCity = (text: string): string | null => {
  const lower = text.toLowerCase().trim();

  // Check park keywords first
  const park = detectPark(text);
  if (park) return park.city;

  if (lower.includes("lagos") || lower.includes("lekki") || lower.includes("ikeja") ||
      lower.includes("yaba") || lower.includes("surulere") || lower.includes("ajah") ||
      lower.includes("berger") || lower.includes("oshodi") ||
      lower.includes("ikorodu") || lower.includes("apapa") || lower.includes("victoria island") ||
      lower.includes("vi ") || lower.includes("mushin") || lower.includes("agege") ||
      lower.includes("alimosho") || lower.includes("badagry") || lower.includes("epe")) {
    return "lagos";
  }

  if (lower.includes("ibadan") || lower.includes("bodija") ||
      lower.includes("mokola") || lower.includes("iwo road") ||
      lower.includes("apata") || lower.includes("agodi") || lower.includes("dugbe") ||
      lower.includes("ring road") || lower.includes("ui ") || lower.includes("university of ibadan") ||
      lower.includes("jericho") || lower.includes("new garage") || lower.includes("old garage") ||
      lower.includes("alesinloye") || lower.includes("gate ibadan") ||
      lower.includes("polytechnic ibadan") || lower.includes("poly ibadan")) {
    return "ibadan";
  }

  if (lower.includes("ogbomoso") || lower.includes("ogbomosho") || lower.includes("ogbomosha") ||
      lower.includes("ogbomosa") || lower.includes("lautech") || lower.includes("arada") ||
      lower.includes("sabo ogb") || lower.includes("arowomole") ||
      lower.includes("ijomu") || lower.includes("owode ogb")) {
    return "ogbomoso";
  }

  if (lower.includes("iseyin") || lower.includes("isale iseyin") || lower.includes("oke iseyin")) {
    return "iseyin";
  }

  if (lower.includes(" oyo") || lower.includes("oyo ") || lower.startsWith("oyo") ||
      lower.includes("atiba") || lower.includes("akesan") || lower.includes("kosobo") ||
      lower.includes("oyo town") || lower.includes("owode oyo") || lower.includes("isale oyo")) {
    return "oyo";
  }

  return null;
};

const haversineKm = (coord1: [number, number], coord2: [number, number]): number => {
  const R = 6371;
  const dLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const dLon = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1[1] * Math.PI) / 180) *
    Math.cos((coord2[1] * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const geocodeAddress = async (address: string, cityHint?: string): Promise<[number, number]> => {
  const officialCityName = cityHint ? CITY_OFFICIAL_NAMES[cityHint] : null;
  const fallbackCoords: [number, number] = cityHint ? CITY_FALLBACK_COORDS[cityHint] : [0, 0];

  try {
    const searchQuery = officialCityName
      ? `${address}, ${officialCityName}, Nigeria`
      : `${address}, Nigeria`;

    console.log("Geocoding query:", searchQuery);

    const res = await fetch(
      `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(searchQuery)}&boundary.country=NG&size=1`
    );
    const data = await res.json();
    const coords: [number, number] | null = data?.features?.[0]?.geometry?.coordinates ?? null;
    const label = data?.features?.[0]?.properties?.label;

    console.log("Geocode result:", label, coords);

    if (coords) {
      const inNigeria = coords[0] >= 2.7 && coords[0] <= 14.7 && coords[1] >= 4.3 && coords[1] <= 13.9;
      if (inNigeria) {
        const distFromCity = haversineKm(coords, fallbackCoords);
        console.log("Distance from expected city:", distFromCity, "km");
        if (distFromCity <= 80) return coords;
      }
    }

    console.log("Using fallback for:", cityHint);
    return fallbackCoords;

  } catch (err) {
    console.error("Geocode error:", err);
    return fallbackCoords;
  }
};

const getDistanceKm = async (
  fromCoords: [number, number],
  toCoords: [number, number]
): Promise<number | null> => {
  try {
    console.log("Getting distance from", fromCoords, "to", toCoords);
    const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
      method: "POST",
      headers: {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates: [fromCoords, toCoords],
      }),
    });
    const data = await res.json();
    console.log("Distance API response:", data?.routes?.[0]?.summary);
    const distanceMeters = data?.routes?.[0]?.summary?.distance;
    if (!distanceMeters) return null;
    return Math.round(distanceMeters / 1000);
  } catch (err) {
    console.error("Distance error:", err);
    return null;
  }
};

const findClosestPark = (
  city: string,
  addressCoords: [number, number]
): [number, number] => {
  const parks = CITY_PARKS[city];
  if (!parks || parks.length === 0) return CITY_FALLBACK_COORDS[city] || [0, 0];
  if (parks.length === 1) return parks[0];

  let closestPark = parks[0];
  let minDistance = haversineKm(addressCoords, parks[0]);

  for (let i = 1; i < parks.length; i++) {
    const dist = haversineKm(addressCoords, parks[i]);
    if (dist < minDistance) {
      minDistance = dist;
      closestPark = parks[i];
    }
  }

  return closestPark;
};

type PriceBreakdown = {
  isInterstate: boolean;
  tripPrice: number;
  pickupKm: number;
  pickupCharge: number;
  lastMileKm: number;
  lastMileCharge: number;
  total: number;
  pickupCity: string;
  dropoffCity: string;
  pickupIsPark: boolean;
  dropoffIsPark: boolean;
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
  const [calculating, setCalculating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [error, setError] = useState("");

  const handleChange = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (field === "pickup" || field === "dropoff" || field === "packageType") {
      setPriceBreakdown(null);
      setCantEstimate(false);
    }
  };

  const isLargePackage = LARGE_PACKAGE_TYPES.includes(form.packageType);

  const handleCalculatePrice = async () => {
    console.log("=== Calculate Price Started ===");

    const pickupCity = detectCity(form.pickup);
    const dropoffCity = detectCity(form.dropoff);

    console.log("Detected cities — pickup:", pickupCity, "dropoff:", dropoffCity);

    if (!pickupCity || !dropoffCity) {
      setCantEstimate(true);
      setPriceBreakdown(null);
      return;
    }

    setCantEstimate(false);
    setCalculating(true);

    try {
      if (pickupCity === dropoffCity) {
        // Same city delivery
        console.log("Same city delivery");

        const pickupPark = detectPark(form.pickup);
        const dropoffPark = detectPark(form.dropoff);

        let fromCoords: [number, number];
        let toCoords: [number, number];

        if (pickupPark) {
          fromCoords = pickupPark.coords;
          console.log("Pickup is a park:", fromCoords);
        } else {
          fromCoords = await geocodeAddress(form.pickup, pickupCity);
          console.log("Pickup geocoded:", fromCoords);
        }

        if (dropoffPark) {
          toCoords = dropoffPark.coords;
          console.log("Dropoff is a park:", toCoords);
        } else {
          toCoords = await geocodeAddress(form.dropoff, dropoffCity);
          console.log("Dropoff geocoded:", toCoords);
        }

        const distKm = await getDistanceKm(fromCoords, toCoords);
        console.log("Distance km:", distKm);

        if (!distKm) {
          setCantEstimate(true);
          setCalculating(false);
          return;
        }

        const lastMileCharge = distKm * RATE_PER_KM;
        const total = BASE_FEE + lastMileCharge + (isLargePackage ? 500 : 0);

        setPriceBreakdown({
          isInterstate: false,
          tripPrice: BASE_FEE,
          pickupKm: 0,
          pickupCharge: 0,
          lastMileKm: distKm,
          lastMileCharge,
          total,
          pickupCity,
          dropoffCity,
          pickupIsPark: !!pickupPark,
          dropoffIspark: !!dropoffPark,
        });

      } else {
        // Interstate delivery
        console.log("Interstate delivery");

        const routeA = `${pickupCity.charAt(0).toUpperCase() + pickupCity.slice(1)} → ${dropoffCity.charAt(0).toUpperCase() + dropoffCity.slice(1)}`;
        const routeB = `${dropoffCity.charAt(0).toUpperCase() + dropoffCity.slice(1)} → ${pickupCity.charAt(0).toUpperCase() + pickupCity.slice(1)}`;

        const { data: tripData } = await supabase
          .from("trips")
          .select("price, route")
          .or(`route.eq.${routeA},route.eq.${routeB}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log("Trip data:", tripData);
        const tripPrice = tripData?.price || 0;

        // Check if pickup or dropoff is a known park
        const pickupPark = detectPark(form.pickup);
        const dropoffPark = detectPark(form.dropoff);

        console.log("Pickup is park:", !!pickupPark, "Dropoff is park:", !!dropoffPark);

        let pickupCoords: [number, number];
        let dropoffCoords: [number, number];
        let originPark: [number, number];
        let destPark: [number, number];

        // Resolve pickup coords
        if (pickupPark) {
          pickupCoords = pickupPark.coords;
          originPark = pickupPark.coords;
        } else {
          pickupCoords = await geocodeAddress(form.pickup, pickupCity);
          originPark = findClosestPark(pickupCity, pickupCoords);
        }

        // Resolve dropoff coords
        if (dropoffPark) {
          dropoffCoords = dropoffPark.coords;
          destPark = dropoffPark.coords;
        } else {
          dropoffCoords = await geocodeAddress(form.dropoff, dropoffCity);
          destPark = findClosestPark(dropoffCity, dropoffCoords);
        }

        console.log("Origin park:", originPark);
        console.log("Dest park:", destPark);

        // Calculate km charges based on scenario
        let pickupKm = 0;
        let pickupCharge = 0;
        let lastMileKm = 0;
        let lastMileCharge = 0;

        // Pickup to origin park (only if pickup is NOT a park)
        if (!pickupPark) {
          const km = await getDistanceKm(pickupCoords, originPark);
          pickupKm = km || 0;
          pickupCharge = pickupKm * RATE_PER_KM;
          console.log("Pickup to park km:", pickupKm);
        }

        // Dest park to dropoff (only if dropoff is NOT a park)
        if (!dropoffPark) {
          const km = await getDistanceKm(destPark, dropoffCoords);
          lastMileKm = km || 0;
          lastMileCharge = lastMileKm * RATE_PER_KM;
          console.log("Park to dropoff km:", lastMileKm);
        }

        const total = pickupCharge + tripPrice + lastMileCharge + (isLargePackage ? 500 : 0);

        console.log("=== Final Breakdown ===");
        console.log("Pickup charge:", pickupCharge, "Trip price:", tripPrice, "Dropoff charge:", lastMileCharge, "Total:", total);

        setPriceBreakdown({
          isInterstate: true,
          tripPrice,
          pickupKm,
          pickupCharge,
          lastMileKm,
          lastMileCharge,
          total,
          pickupCity,
          dropoffCity,
          pickupIsPark: !!pickupPark,
          dropoffIspark: !!dropoffPark,
        });
      }
    } catch (err) {
      console.error("Price calculation error:", err);
      setCantEstimate(true);
    }

    setCalculating(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !priceBreakdown) return;

    if (!isValidPhone(form.senderPhone)) {
      setError("Sender " + PHONE_ERROR.toLowerCase());
      return;
    }
    if (!isValidPhone(form.receiverPhone)) {
      setError("Receiver " + PHONE_ERROR.toLowerCase());
      return;
    }

    setLoading(true);
    setError("");

    const id = generateTrackingId();

    const { error: dbError } = await supabase.from("dispatches").insert({
      user_id: user.id,
      tracking_id: id,
      tracking_number: id,
      package_type: form.packageType,
      pickup_location: form.pickup,
      pickup: form.pickup,
      delivery_location: form.dropoff,
      dropoff: form.dropoff,
      sender_name: form.senderName,
      sender_phone: form.senderPhone,
      receiver_name: form.receiverName,
      receiver_phone: form.receiverPhone,
      delivery_option: form.delivery === "same-day" ? "Same Day" : "Next Day",
      delivery_type: form.delivery === "same-day" ? "Same Day" : "Next Day",
      estimated_price: priceBreakdown.total,
      price: priceBreakdown.total,
      status: "Pending Delivery & Payment",
      payment_status: "Pending",
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
    const isInterstate = priceBreakdown?.isInterstate;
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
            <p className="font-semibold text-accent">Total: ₦{priceBreakdown?.total.toLocaleString()}</p>
          </div>

          {isInterstate ? (
            // Interstate — contact support + payment options
            <div className="space-y-3">
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-left">
                <p className="text-sm font-semibold text-blue-600 mb-1">🚚 Interstate Delivery</p>
                <p className="text-xs text-muted-foreground">This is an interstate package. Please contact support on WhatsApp to process your delivery. You can choose to pay now or have the receiver pay on delivery.</p>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-left space-y-2">
                <p className="font-bold text-sm">💳 Payment Options</p>
                <div className="space-y-1">
                  <p className="font-semibold text-accent">Option 1 — Sender pays now:</p>
                  <p className="text-muted-foreground">Transfer ₦{priceBreakdown?.total.toLocaleString()} to:</p>
                  <p className="font-medium">Name: Ajayi Oluwadamilare John</p>
                  <p className="font-medium">Bank: {OPAY_ACCOUNT.bank}</p>
                  <p className="font-medium">Account: {OPAY_ACCOUNT.number}</p>
                  <p className="text-muted-foreground mt-1">Then send your receipt to support on WhatsApp.</p>
                </div>
                <div className="border-t pt-2 space-y-1">
                  <p className="font-semibold text-accent">Option 2 — Receiver pays on delivery:</p>
                  <p className="text-muted-foreground">The receiver will pay ₦{priceBreakdown?.total.toLocaleString()} when the package arrives.</p>
                </div>
              </div>

              
               <a href={"https://wa.me/" + SUPPORT_WHATSAPP + "?text=" + encodeURIComponent("Hello DREYPELLA support, I have an interstate package dispatch. Tracking ID: " + trackingId + ". From: " + form.pickup + " To: " + form.dropoff + ". Total: ₦" + priceBreakdown?.total.toLocaleString())}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} fill="white" />
                Contact Support on WhatsApp
              </a>
            </div>
          ) : (
            // Same city — waiting for rider
            <div className="space-y-3">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-center">
                <p className="font-bold text-sm mb-1">💰 Pay on Delivery</p>
                <p className="text-muted-foreground">The receiver will pay ₦{priceBreakdown?.total.toLocaleString()} upon delivery.</p>
                <p className="text-muted-foreground mt-2">For reference — Account: Ajayi Oluwadamilare John, {OPAY_ACCOUNT.bank}, {OPAY_ACCOUNT.number}</p>
              </div>
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-center">
                <Clock size={24} className="mx-auto text-blue-500 mb-2" />
                <p className="text-sm font-semibold text-blue-600">Waiting for a rider to accept your order</p>
                <p className="text-xs text-muted-foreground mt-1">Once a rider accepts, their WhatsApp number will appear on your dashboard.</p>
              </div>
              
               <a href={"https://wa.me/" + SUPPORT_WHATSAPP + "?text=" + encodeURIComponent("Hello DREYPELLA support, regarding my package " + trackingId)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} fill="white" />
                Contact Support
              </a>
            </div>
          )}
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
          <input type="text" value={form.pickup} onChange={(e) => handleChange("pickup", e.target.value)} required placeholder="e.g. LAUTECH Gate, Ogbomoso or Takie Motor Park" className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Delivery Location</label>
          <input type="text" value={form.dropoff} onChange={(e) => handleChange("dropoff", e.target.value)} required placeholder="e.g. Command School, Apata Ibadan or Ojoo Terminal" className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
        </div>

        {canCalculate && !priceBreakdown && (
          <button type="button" onClick={handleCalculatePrice} disabled={calculating} className="w-full bg-secondary hover:bg-secondary/80 text-foreground font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60">
            {calculating ? (
              <><div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" /> Calculating...</>
            ) : (
              <><Calculator size={18} /> Calculate Price</>
            )}
          </button>
        )}

        {cantEstimate && (
          <div className="bg-secondary rounded-xl p-5 text-center animate-fade-in-up">
            <p className="font-semibold text-sm mb-2">Unable to estimate distance</p>
            <p className="text-xs text-muted-foreground mb-4">Please include a city name (Lagos, Ibadan, Ogbomoso, Oyo, Iseyin) in your locations, or contact support for a quote.</p>
            
             <a href={"https://wa.me/" + SUPPORT_WHATSAPP + "?text=" + encodeURIComponent("Hello DREYPELLA support, I need a delivery price quote. Pickup: " + form.pickup + " → Delivery: " + form.dropoff)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
            >
              <MessageCircle size={16} fill="#25D366" />
              Contact Support for Quote
            </a>
          </div>
        )}

        {priceBreakdown && (
          <div className="bg-accent/10 rounded-xl p-4 animate-fade-in-up space-y-2">
            <p className="text-xs text-muted-foreground text-center mb-1">
              {priceBreakdown.isInterstate ? "🚚 Interstate Delivery" : "🏍️ Same City Delivery"}
            </p>

            {priceBreakdown.isInterstate && (
              <div className="bg-card rounded-lg p-3 text-xs space-y-1.5">
                {/* Only show pickup leg if pickup is not a park */}
                {!priceBreakdown.pickupIspark && priceBreakdown.pickupKm > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Pickup → {priceBreakdown.pickupCity} park ({priceBreakdown.pickupKm}km × ₦{RATE_PER_KM})
                    </span>
                    <span className="font-medium">₦{priceBreakdown.pickupCharge.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Trip fare ({priceBreakdown.pickupCity} → {priceBreakdown.dropoffCity})
                  </span>
                  <span className="font-medium">₦{priceBreakdown.tripPrice.toLocaleString()}</span>
                </div>
                {/* Only show dropoff leg if dropoff is not a park */}
                {!priceBreakdown.dropoffIspark && priceBreakdown.lastMileKm > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {priceBreakdown.dropoffCity} park → destination ({priceBreakdown.lastMileKm}km × ₦{RATE_PER_KM})
                    </span>
                    <span className="font-medium">₦{priceBreakdown.lastMileCharge.toLocaleString()}</span>
                  </div>
                )}
                {isLargePackage && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Large package fee</span>
                    <span className="font-medium">₦500</span>
                  </div>
                )}
              </div>
            )}

            {!priceBreakdown.isInterstate && (
              <div className="bg-card rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base fee</span>
                  <span className="font-medium">₦{BASE_FEE.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Distance ({priceBreakdown.lastMileKm}km × ₦{RATE_PER_KM})</span>
                  <span className="font-medium">₦{priceBreakdown.lastMileCharge.toLocaleString()}</span>
                </div>
                {isLargePackage && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Large package fee</span>
                    <span className="font-medium">₦500</span>
                  </div>
                )}
              </div>
            )}

            <div className="text-center pt-1">
              <p className="text-2xl font-bold text-accent">₦{priceBreakdown.total.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Pay on delivery – receiver pays upon receipt</p>
            </div>
          </div>
        )}

        {priceBreakdown && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Sender Name</label>
                <input type="text" value={form.senderName} onChange={(e) => handleChange("senderName", e.target.value)} required placeholder="Full name" className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Sender Phone</label>
                <input type="tel" value={form.senderPhone} onChange={(e) => handleChange("senderPhone", e.target.value.replace(/\D/g, "").slice(0, 11))} required maxLength={11} placeholder="08012345678" className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Receiver Name</label>
                <input type="text" value={form.receiverName} onChange={(e) => handleChange("receiverName", e.target.value)} required placeholder="Full name" className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Receiver Phone</label>
                <input type="tel" value={form.receiverPhone} onChange={(e) => handleChange("receiverPhone", e.target.value.replace(/\D/g, "").slice(0, 11))} required maxLength={11} placeholder="08012345678" className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Delivery Speed</label>
              <div className="grid grid-cols-2 gap-3">
                {[{ value: "next-day", label: "Next Day" }, { value: "same-day", label: "Same Day" }].map((opt) => (
                  <label key={opt.value} className={"flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all " + (form.delivery === opt.value ? "border-accent bg-accent/5" : "border-border hover:border-accent/30")}>
                    <input type="radio" name="delivery" value={opt.value} checked={form.delivery === opt.value} onChange={(e) => handleChange("delivery", e.target.value)} className="sr-only" />
                    <span className="text-sm font-semibold">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" /> : <><Package size={18} /> Submit Dispatch (Pay on Delivery)</>}
            </button>
          </>
        )}
      </form>
      <WhatsAppButton />
    </div>
  );
};

export default SendPackage;
