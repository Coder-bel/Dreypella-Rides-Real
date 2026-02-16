import { useState, useEffect } from "react";
import { Bus, Package, Wallet, Clock, LogOut, Plus, Copy, CheckCircle, X, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface DvaDetails {
  bank_name: string;
  account_number: string;
  account_name: string;
  customer_code: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(0);
  const [bookings, setBookings] = useState<any[]>([]);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showFund, setShowFund] = useState(false);
  const [copied, setCopied] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [dva, setDva] = useState<DvaDetails | null>(null);
  const [dvaLoading, setDvaLoading] = useState(false);
  const [dvaError, setDvaError] = useState("");

  const fetchData = async () => {
    if (!user) return;

    const [profileRes, bookingsRes, dispatchRes, txRes] = await Promise.all([
      supabase.from("profiles").select("wallet_balance, dva_details").eq("user_id", user.id).single(),
      supabase.from("bookings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("dispatches").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);

    if (profileRes.data) {
      setWalletBalance(profileRes.data.wallet_balance || 0);
      if (profileRes.data.dva_details) {
        setDva(profileRes.data.dva_details as unknown as DvaDetails);
      }
    }
    if (bookingsRes.data) setBookings(bookingsRes.data);
    if (dispatchRes.data) setDispatches(dispatchRes.data);
    if (txRes.data) setTransactions(txRes.data);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Real-time subscription for wallet updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` }, (payload: any) => {
        if (payload.new?.wallet_balance !== undefined) {
          setWalletBalance(payload.new.wallet_balance);
        }
        if (payload.new?.dva_details) {
          setDva(payload.new.dva_details as DvaDetails);
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dispatches", filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "wallet_transactions", filter: `user_id=eq.${user.id}` }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const createDva = async () => {
    setDvaLoading(true);
    setDvaError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setDvaError("Please log in again.");
        setDvaLoading(false);
        return;
      }

      const res = await supabase.functions.invoke("create-dva", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) {
        setDvaError(res.error.message || "Failed to create virtual account.");
      } else if (res.data?.dva) {
        setDva(res.data.dva);
      } else if (res.data?.error) {
        setDvaError(res.data.error);
      }
    } catch (err: any) {
      setDvaError("Something went wrong. Please try again.");
    }
    setDvaLoading(false);
  };

  const upcomingBookings = bookings.filter((b) => new Date(b.travel_date) >= new Date());

  const stats = [
    { icon: Bus, label: "Rides", value: String(bookings.length), color: "text-accent" },
    { icon: Package, label: "Dispatches", value: String(dispatches.length), color: "text-accent" },
    { icon: Wallet, label: "Wallet", value: `₦${walletBalance.toLocaleString()}`, color: "text-green-500" },
    { icon: Clock, label: "Upcoming", value: String(upcomingBookings.length), color: "text-accent" },
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

      {/* Fund Wallet - DVA */}
      <div className="bg-card rounded-2xl p-5 border mb-4 animate-fade-in-up-delay-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-sm">Wallet</h3>
          <button
            onClick={() => { setShowFund(!showFund); if (!dva && !showFund) createDva(); }}
            className="inline-flex items-center gap-1 text-accent text-sm font-semibold hover:underline"
          >
            <Plus size={14} />
            Fund Wallet
          </button>
        </div>

        {showFund && (
          <div className="space-y-3 animate-fade-in-up">
            {dvaLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Setting up your virtual account...</span>
              </div>
            ) : dvaError ? (
              <div className="bg-accent/10 text-foreground text-sm px-4 py-3 rounded-xl space-y-2">
                <p className="font-semibold text-accent">⚠️ Virtual Account Not Yet Available</p>
                <p className="text-xs text-muted-foreground">
                  Your Paystack business account needs to be approved for Dedicated Virtual Accounts (DVAs). 
                  Please email <strong>support@paystack.com</strong> to request DVA activation for your business.
                </p>
                <p className="text-xs text-muted-foreground">Once approved, click below to set up your account.</p>
                <button onClick={createDva} className="mt-1 bg-accent text-accent-foreground px-3 py-1.5 rounded-lg font-semibold text-xs hover:scale-105 transition-transform">
                  Retry Setup
                </button>
              </div>
            ) : dva ? (
              <div className="bg-secondary rounded-xl p-4 space-y-3">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 text-xs text-center">
                  <p className="font-semibold text-yellow-600">🧪 Test Mode</p>
                  <p className="text-muted-foreground">Use the demo bank app to simulate transfers</p>
                </div>
                <p className="text-sm font-semibold text-center">Transfer to your dedicated account:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Bank:</span>
                    <span className="font-semibold">{dva.bank_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Account Name:</span>
                    <span className="font-semibold">{dva.account_name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Account No:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-accent">{dva.account_number}</span>
                      <button
                        onClick={() => copyToClipboard(dva.account_number, "acct")}
                        className="p-1 hover:bg-background rounded transition-colors"
                        aria-label="Copy account number"
                      >
                        {copied === "acct" ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} className="text-muted-foreground" />}
                      </button>
                    </div>
                  </div>
                </div>
                <a
                  href="https://demobank.paystackintegrations.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-accent text-accent-foreground text-center py-2 rounded-lg font-semibold text-sm hover:scale-105 transition-transform"
                >
                  Open Demo Bank to Simulate Transfer
                </a>
                <div className="bg-accent/10 rounded-lg p-3 text-xs text-center space-y-1">
                  <p className="font-semibold text-accent">How to Fund</p>
                  <p className="text-muted-foreground">
                    Transfer any amount (min ₦100) to the account above using the Paystack Demo Bank app.
                    Your wallet will be credited automatically once confirmed.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <button onClick={createDva} className="bg-accent text-accent-foreground px-4 py-2 rounded-xl font-semibold text-sm hover:scale-105 transition-transform">
                  Create Virtual Account
                </button>
                <p className="text-xs text-muted-foreground mt-2">Get a dedicated account number for instant wallet funding</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transaction History */}
      {transactions.length > 0 && (
        <div className="mb-4">
          <h3 className="font-display font-semibold text-sm mb-2">Transaction History</h3>
          <div className="space-y-2">
            {transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="bg-card rounded-xl p-3 border text-sm flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {tx.amount > 0 ? (
                    <ArrowDownLeft size={14} className="text-green-500" />
                  ) : (
                    <ArrowUpRight size={14} className="text-accent" />
                  )}
                  <div>
                    <p className="font-medium text-xs capitalize">{tx.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{tx.reference}</p>
                  </div>
                </div>
                <span className={`font-display font-bold text-sm ${tx.amount > 0 ? "text-green-500" : "text-accent"}`}>
                  {tx.amount > 0 ? "+" : ""}₦{Math.abs(tx.amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Trips */}
      {upcomingBookings.length > 0 && (
        <div className="mb-4">
          <h3 className="font-display font-semibold text-sm mb-2">Upcoming Trips</h3>
          <div className="space-y-2">
            {upcomingBookings.map((b) => {
              const daysLeft = Math.ceil((new Date(b.travel_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <div key={b.id} onClick={() => setSelectedBooking(b)} className="bg-card rounded-xl p-3 border text-sm cursor-pointer hover-lift transition-all">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{b.route}</p>
                      <p className="text-xs text-muted-foreground">{b.travel_date} • {b.pickup}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-display font-bold text-accent">₦{Number(b.price).toLocaleString()}</span>
                      <p className="text-xs text-muted-foreground">{daysLeft > 0 ? `${daysLeft}d left` : "Today"}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking History */}
      {bookings.length > 0 && (
        <div className="mb-4">
          <h3 className="font-display font-semibold text-sm mb-2">Ride History</h3>
          <div className="space-y-2">
            {bookings.slice(0, 5).map((b) => (
              <div key={b.id} className="bg-card rounded-xl p-3 border text-sm flex justify-between items-center">
                <div>
                  <p className="font-medium">{b.route}</p>
                  <p className="text-xs text-muted-foreground">{b.travel_date} • {b.pickup}</p>
                </div>
                <div className="text-right">
                  <span className="font-display font-bold text-accent">₦{Number(b.price).toLocaleString()}</span>
                  <p className="text-xs capitalize text-muted-foreground">{b.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Dispatches */}
      {dispatches.length > 0 && (
        <div className="mb-4">
          <h3 className="font-display font-semibold text-sm mb-2">Dispatch History</h3>
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

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedBooking(null)}>
          <div className="bg-card rounded-2xl p-6 border max-w-sm w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-lg">Ride Details</h3>
              <button onClick={() => setSelectedBooking(null)} className="p-1 hover:bg-secondary rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Route:</span> <span className="font-semibold">{selectedBooking.route}</span></p>
              <p><span className="text-muted-foreground">Date:</span> <span className="font-semibold">{selectedBooking.travel_date}</span></p>
              <p><span className="text-muted-foreground">Pickup:</span> <span className="font-semibold">{selectedBooking.pickup}</span></p>
              <p><span className="text-muted-foreground">Passengers:</span> <span className="font-semibold">{selectedBooking.passengers}</span></p>
              <p><span className="text-muted-foreground">Price:</span> <span className="font-bold text-accent">₦{Number(selectedBooking.price).toLocaleString()}</span></p>
              <p><span className="text-muted-foreground">Status:</span> <span className="font-semibold capitalize">{selectedBooking.status}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
