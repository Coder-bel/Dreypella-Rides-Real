/**
 * Payments are manual via Opay transfer. Admin verifies manually and updates booking status to 'Confirmed'.
 */
import { Link } from "react-router-dom";
import { Bus, Package, ArrowRight, MapPin, LogIn, Truck, Shield } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useAuth } from "@/hooks/useAuth";

const cities = ["Lagos", "Ibadan", "Ogbomoso", "Iseyin", "Oyo"];

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="pb-6">
      {/* Animated Hero Background */}
      <section className="relative w-full overflow-hidden">
        <div className="hero-animated-bg w-full h-48 sm:h-64 lg:h-80">
          <div className="hero-shape hero-shape-1" />
          <div className="hero-shape hero-shape-2" />
          <div className="hero-shape hero-shape-3" />
          <div className="hero-shape hero-shape-4" />
          <div className="hero-grid" />
        </div>
      </section>

      {/* Hero Text */}
      <section className="container px-4 py-8 text-center">
        <h1 className="font-display font-bold text-2xl sm:text-4xl lg:text-5xl leading-tight animate-fade-in-up">
          DREYPELLA <span className="text-accent">RIDE</span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-2 max-w-lg mx-auto animate-fade-in-up-delay-1">
          Reliable Inter-City Travel & Package Delivery Across Oyo State
        </p>
        <p className="text-muted-foreground/60 text-xs sm:text-sm mt-1 max-w-md mx-auto animate-fade-in-up-delay-1">
          Safe, affordable, and convenient rides and deliveries connecting Lagos, Ibadan, Ogbomoso, Iseyin, and Oyo. Book now for your next trip or send packages hassle-free.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 animate-fade-in-up-delay-2">
          {user ? (
            <>
              <Link
                to="/book-ride"
                className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <Bus size={18} />
                Book a Ride
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/send-package"
                className="inline-flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 border"
              >
                <Package size={18} />
                Send a Package
              </Link>
            </>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <LogIn size={18} />
              Get Started – Book or Send
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="container px-4 mt-4">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Bus, title: "Inter-City Rides", desc: "Comfortable AC buses across 5 cities in Oyo State and Lagos" },
            { icon: Truck, title: "Package Delivery", desc: "Same-day & next-day dispatch between all routes" },
            { icon: Shield, title: "Safe & Reliable", desc: "Trusted by students and travelers across the region" },
          ].map((f, i) => (
            <div
              key={f.title}
              className="bg-card rounded-xl p-5 border text-center hover-lift animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="bg-secondary rounded-lg p-3 w-fit mx-auto mb-3">
                <f.icon size={24} className="text-accent" />
              </div>
              <h3 className="font-display font-bold text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cities We Cover */}
      <section className="container px-4 mt-8">
        <h2 className="font-display font-bold text-lg mb-4 animate-fade-in-up">Cities We Cover</h2>
        <div className="flex flex-wrap gap-2 justify-center animate-fade-in-up-delay-1">
          {cities.map((city, i) => (
            <span
              key={city}
              className="inline-flex items-center gap-1.5 bg-card border rounded-full px-4 py-2 text-sm font-medium hover-lift"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <MapPin size={14} className="text-accent" />
              {city}
            </span>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3 animate-fade-in-up-delay-2">
          All routes available in both directions
        </p>
      </section>

      {/* Next Trip Info */}
      <section className="container px-4 mt-8">
        <div className="bg-card rounded-xl p-5 border text-center animate-fade-in-up-delay-2">
          <p className="text-sm font-medium text-muted-foreground mb-1">🚌 Next trips available daily</p>
          <p className="font-display font-bold text-lg">Seats available – Book now!</p>
          <p className="text-xs text-muted-foreground mt-1">
            Lagos ↔ Ibadan ↔ Ogbomoso ↔ Iseyin ↔ Oyo
          </p>
        </div>
      </section>

      <WhatsAppButton />
    </div>
  );
};

export default Index;
