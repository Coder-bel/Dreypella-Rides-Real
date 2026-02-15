import { Link } from "react-router-dom";
import { Bus, Package, ArrowRight, MapPin, LogIn } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import TestimonialCard from "@/components/TestimonialCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useAuth } from "@/hooks/useAuth";

const routes = [
  { from: "Ogbomoso", to: "Lagos", price: "₦4,000" },
  { from: "Ogbomoso", to: "Ibadan", price: "₦2,500" },
  { from: "Ibadan", to: "Lagos", price: "₦3,000" },
];

const testimonials = [
  {
    name: "Tunde A.",
    department: "Computer Science, 400L",
    text: "Dreypella Ride is a lifesaver! I book my trips to Lagos right from hostel. No stress, no wahala.",
  },
  {
    name: "Blessing O.",
    department: "Nursing, 300L",
    text: "I sent a package to my mum in Ibadan and she got it same day. The tracking number was very helpful!",
  },
  {
    name: "Emeka C.",
    department: "Engineering, 500L",
    text: "The prices are student-friendly and the buses are always clean. I don't use any other service again.",
  },
];

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="pb-6">
      {/* Animated Hero Background */}
      <section className="relative w-full overflow-hidden">
        <div className="hero-animated-bg w-full h-48 sm:h-64 lg:h-80">
          {/* Floating geometric shapes */}
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
        <p className="text-muted-foreground text-sm sm:text-base mt-2 max-w-md mx-auto animate-fade-in-up-delay-1">
          Affordable Student Transport & Dispatch for LAUTECH
        </p>
        <p className="text-muted-foreground/60 text-xs sm:text-sm mt-1 animate-fade-in-up-delay-1">
          Ogbomoso ↔ Ibadan ↔ Lagos — Reliable, Cheap, Student-Focused
        </p>

        {/* Price badge */}
        <div className="mt-5 animate-fade-in-up-delay-2">
          <span className="inline-block bg-accent text-accent-foreground text-sm font-bold px-4 py-1.5 rounded-full animate-pulse-red">
            From ₦4,000
          </span>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 animate-fade-in-up-delay-3">
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
              Log In to Book
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </section>

      {/* Countdown */}
      <section className="container px-4 relative z-10">
        <CountdownTimer />
      </section>

      {/* Routes */}
      <section className="container px-4 mt-8">
        <h2 className="font-display font-bold text-lg mb-4 animate-fade-in-up">Popular Routes</h2>
        <div className="grid gap-3">
          {routes.map((r, i) => (
            <Link
              key={i}
              to={user ? "/book-ride" : "/auth"}
              className="flex items-center justify-between bg-card rounded-xl p-4 border hover-lift animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-secondary rounded-lg p-2">
                  <MapPin size={16} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{r.from} → {r.to}</p>
                  <p className="text-xs text-muted-foreground">AC Bus • Direct</p>
                </div>
              </div>
              <span className="font-display font-bold text-accent text-sm">{r.price}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container px-4 mt-10">
        <h2 className="font-display font-bold text-lg mb-4">What Students Say</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} {...t} delay={i * 0.15} />
          ))}
        </div>
      </section>

      <WhatsAppButton />
    </div>
  );
};

export default Index;
