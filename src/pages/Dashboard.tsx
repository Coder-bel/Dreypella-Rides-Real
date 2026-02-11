import { Bus, Package, Wallet, Clock } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="container px-4 py-6 max-w-lg mx-auto">
      <h1 className="font-display font-bold text-xl mb-1 animate-fade-in-up">Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-6 animate-fade-in-up-delay-1">Login to view your bookings & wallet</p>

      {/* Quick stats placeholder */}
      <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-in-up-delay-2">
        {[
          { icon: Bus, label: "Rides", value: "0", color: "text-accent" },
          { icon: Package, label: "Dispatches", value: "0", color: "text-accent" },
          { icon: Wallet, label: "Wallet", value: "₦0", color: "text-green-500" },
          { icon: Clock, label: "Upcoming", value: "0", color: "text-accent" },
        ].map((stat, i) => (
          <div key={i} className="bg-card rounded-xl p-4 border text-center hover-lift">
            <stat.icon size={20} className={`mx-auto mb-2 ${stat.color}`} />
            <p className="text-lg font-display font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Login prompt */}
      <div className="bg-card rounded-2xl p-6 border text-center animate-fade-in-up-delay-3">
        <p className="text-sm text-muted-foreground mb-4">Sign in to access your bookings, dispatch history, and wallet.</p>
        <button className="bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 hover:scale-105">
          Login / Sign Up
        </button>
        <p className="text-xs text-muted-foreground mt-3">
          🎁 Get <span className="text-accent font-semibold">10% cashback</span> on every ride credited to your wallet!
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
