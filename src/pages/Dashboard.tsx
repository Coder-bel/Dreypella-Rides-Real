import { useState, useEffect } from "react";
import { Bus, Package, Wallet, Clock, LogOut, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(0);
  const [bookings, setBookings] = useState<any[]>([]);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [showFund, setShowFund] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [fundError, setFundError] = useState("");
  const [fundLoading, setFundLoading] = useState(false);
  const [fundSuccess, setFundSuccess] = useState("");
  const [paystackLoaded, setPaystackLoaded] = useState(false);

  const [paystackKey, setPaystackKey] = useState("");

  // Load Paystack script and key
  useEffect(() => {
    // Load script
    if (!document.getElementById("paystack-script")) {
      const script = document.createElement("script");
      script.id = "paystack-script";
      script.src = "https://js.paystack.co/v1/inline.js";
      script.onload = () => setPaystackLoaded(true);
      document.head.appendChild(script);
    } else {
      setPaystackLoaded(true);
    }

    // Fetch Paystack key
    supabase.functions.invoke("get-paystack-key").then(({ data }) => {
      if (data?.key) setPaystackKey(data.key);
    });
  }, []);

  const fetchData = async () => {
    if (!user) return;

    const [profileRes, bookingsRes, dispatchRes] = await Promise.all([
      supabase.from("profiles").select("wallet_balance").eq("user_id", user.id).single(),
      supabase.from("bookings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("dispatches").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);

    if (profileRes.data) setWalletBalance(profileRes.data.wallet_balance || 0);
    if (bookingsRes.data) setBookings(bookingsRes.data);
    if (dispatchRes.data) setDispatches(dispatchRes.data);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleFundWallet = () => {
    setFundError("");
    setFundSuccess("");
    const amount = Number(fundAmount);
    if (!amount || amount < 100) {
      setFundError("Minimum deposit is ₦100");
      return;
    }
    if (!paystackLoaded || !window.PaystackPop || !paystackKey) {
      setFundError("Payment system is loading. Please try again.");
      return;
    }

    setFundLoading(true);
    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email: user?.email || "",
      amount: amount * 100, // Paystack uses kobo
      currency: "NGN",
      ref: "DRP-" + Date.now().toString(36).toUpperCase(),
      callback: async (response: any) => {
        // Payment successful - update wallet
        await supabase.from("wallet_transactions").insert({
          user_id: user!.id,
          amount,
          type: "funding",
          reference: response.reference,
        });

        const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", user!.id).single();
        if (profile) {
          await supabase.from("profiles").update({ wallet_balance: (profile.wallet_balance || 0) + amount }).eq("user_id", user!.id);
        }

        setWalletBalance((prev) => prev + amount);
        setFundSuccess(`₦${amount.toLocaleString()} added to your wallet!`);
        setFundAmount("");
        setFundLoading(false);
        setShowFund(false);
        fetchData();
      },
      onClose: () => {
        setFundLoading(false);
      },
    });
    handler.openIframe();
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const stats = [
    { icon: Bus, label: "Rides", value: String(bookings.length), color: "text-accent" },
    { icon: Package, label: "Dispatches", value: String(dispatches.length), color: "text-accent" },
    { icon: Wallet, label: "Wallet", value: `₦${walletBalance.toLocaleString()}`, color: "text-green-500" },
    { icon: Clock, label: "Upcoming", value: String(bookings.filter((b) => new Date(b.travel_date) >= new Date()).length), color: "text-accent" },
  ];

  return (
    <div className="container px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-1 animate-fade-in-up">
        <h1 className="font-display font-bold text-xl">Dashboard</h1>
        <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors p-2">
          <LogOut size={18} />
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-6 animate-fade-in-up-delay-1">
        Welcome, {user?.email}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-in-up-delay-2">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card rounded-xl p-4 border text-center hover-lift">
            <stat.icon size={20} className={`mx-auto mb-2 ${stat.color}`} />
            <p className="text-lg font-display font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Fund Wallet */}
      <div className="bg-card rounded-2xl p-5 border mb-4 animate-fade-in-up-delay-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-sm">Wallet</h3>
          <button
            onClick={() => setShowFund(!showFund)}
            className="inline-flex items-center gap-1 text-accent text-sm font-semibold hover:underline"
          >
            <Plus size={14} />
            Fund Wallet
          </button>
        </div>

        {showFund && (
          <div className="space-y-3 animate-fade-in-up">
            <div className="flex gap-2">
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => { setFundAmount(e.target.value); setFundError(""); }}
                placeholder="Enter amount (min ₦100)"
                min={100}
                className="flex-1 rounded-xl border bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
              />
              <button
                onClick={handleFundWallet}
                disabled={fundLoading}
                className="bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-60"
              >
                {fundLoading ? "..." : "Fund"}
              </button>
            </div>
            {fundError && <p className="text-xs text-destructive animate-shake">{fundError}</p>}
            {fundSuccess && <p className="text-xs text-green-600 animate-fade-in-up">{fundSuccess}</p>}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-2">
          🎁 Get <span className="text-accent font-semibold">10% cashback</span> on every ride credited to your wallet!
        </p>
      </div>

      {/* Recent Bookings */}
      {bookings.length > 0 && (
        <div className="mb-4">
          <h3 className="font-display font-semibold text-sm mb-2">Recent Rides</h3>
          <div className="space-y-2">
            {bookings.slice(0, 5).map((b) => (
              <div key={b.id} className="bg-card rounded-xl p-3 border text-sm flex justify-between items-center">
                <div>
                  <p className="font-medium">{b.route}</p>
                  <p className="text-xs text-muted-foreground">{b.travel_date} • {b.pickup}</p>
                </div>
                <span className="font-display font-bold text-accent">₦{Number(b.price).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Dispatches */}
      {dispatches.length > 0 && (
        <div className="mb-4">
          <h3 className="font-display font-semibold text-sm mb-2">Recent Dispatches</h3>
          <div className="space-y-2">
            {dispatches.slice(0, 5).map((d) => (
              <div key={d.id} className="bg-card rounded-xl p-3 border text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-accent text-xs font-bold">{d.tracking_id}</span>
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full capitalize">{d.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{d.pickup} → {d.dropoff}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
