/**
 * Biker auth is separate for MVP. In production use proper role-based auth with Supabase metadata or Edge Functions.
 * No links to this page from main site or admin.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bike, AlertCircle } from "lucide-react";

const ALLOWED_BIKERS = ["okikibeloved@gmail.com"];
const BIKER_PASSWORD = "12345678";

const BikersLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (ALLOWED_BIKERS.includes(normalizedEmail) && password === BIKER_PASSWORD) {
      const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24h
      localStorage.setItem("isBiker", "true");
      localStorage.setItem("bikerExpiry", String(expiry));
      localStorage.setItem("bikerEmail", normalizedEmail);
      navigate("/bikers");
    } else {
      setError("Invalid biker credentials");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-navy-gradient sticky top-0 z-50">
        <div className="container flex items-center justify-center h-14 px-4">
          <span className="font-display font-bold text-lg text-primary-foreground tracking-tight">
            DREYPELLA<span className="text-red-brand"> RIDE</span>
            <span className="text-primary-foreground/60 text-sm ml-2">– Bikers</span>
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-card rounded-2xl border p-8 w-full max-w-sm animate-fade-in-up">
          <div className="text-center mb-6">
            <Bike size={40} className="mx-auto text-accent mb-3" />
            <h1 className="font-display font-bold text-xl">Bikers Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to manage deliveries</p>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-xl mb-4 flex items-center gap-2 animate-shake">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default BikersLogin;
