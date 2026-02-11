import { Link } from "react-router-dom";
import { Bus, Package, ArrowRight, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import CountdownTimer from "@/components/CountdownTimer";
import TestimonialCard from "@/components/TestimonialCard";
import WhatsAppButton from "@/components/WhatsAppButton";

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
  return (
    <div className="pb-6">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Students boarding a DREYPELLA bus" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-hero-overlay" />
        </div>
        <div className="relative container px-4 py-16 sm:py-24 text-center">
          <h1 className="font-display font-bold text-2xl sm:text-4xl lg:text-5xl text-primary-foreground leading-tight animate-fade-in-up">
            DREYPELLA RIDE
          </h1>
          <p className="text-primary-foreground/80 text-sm sm:text-base mt-2 max-w-md mx-auto animate-fade-in-up-delay-1">
            Affordable Student Transport & Dispatch for LAUTECH
          </p>
          <p className="text-primary-foreground/60 text-xs sm:text-sm mt-1 animate-fade-in-up-delay-1">
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
              className="inline-flex items-center justify-center gap-2 bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 border border-primary-foreground/20"
            >
              <Package size={18} />
              Send a Package
            </Link>
          </div>
        </div>
      </section>

      {/* Countdown */}
      <section className="container px-4 -mt-6 relative z-10">
        <CountdownTimer />
      </section>

      {/* Routes */}
      <section className="container px-4 mt-8">
        <h2 className="font-display font-bold text-lg mb-4 animate-fade-in-up">Popular Routes</h2>
        <div className="grid gap-3">
          {routes.map((r, i) => (
            <Link
              key={i}
              to="/book-ride"
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
