/**
 * Payments are manual via Opay transfer. Admin verifies manually and updates booking status to 'Confirmed'.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Bus, Package, ArrowRight, MapPin, LogIn, Truck, Shield, ChevronDown, ChevronUp } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useAuth } from "@/hooks/useAuth";

const cities = ["Lagos", "Ibadan", "Ogbomoso", "Iseyin", "Oyo"];

const faqs = [
  {
    question: "How do I book a ride?",
    answer: "Create an account, go to 'Book a Ride', select your route, travel date, pickup point and number of seats. Proceed to payment and transfer the amount to our Opay account. Your booking will be confirmed once payment is verified by our admin.",
  },
  {
    question: "How long does payment verification take?",
    answer: "Payment verification typically takes between 15 minutes to 20 minutes. Once confirmed, you'll see your booking status change to 'Payment Confirmed' on your dashboard and a boarding pass will be generated.",
  },
  {
    question: "How do I send a package?",
    answer: "Go to 'Send a Package', enter your pickup and delivery locations, fill in sender and receiver details,and note if it is from one state to another make it is the precised and correct address because we deal with door to door delivery, and submit. A rider will accept and deliver your package. Payment is made on delivery by the receiver.",
  },
  {
    question: "What cities do you cover?",
    answer: "We currently cover Lagos, Ibadan, Ogbomoso, Iseyin, and Oyo. All routes are available in both directions.",
  },
  {
    question: "How do I track my package?",
    answer: "Once your package is submitted, you'll receive a tracking ID. You can view your package status on your dashboard. When a rider accepts, their WhatsApp number will appear so you can contact them directly.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We currently accept bank transfers via Opay.For packages, payment is made on delivery.",
  },
  {
    question: "Can I cancel a booking?",
    answer: "To cancel a booking, please contact our support team on WhatsApp as soon as possible. Cancellations are subject to our refund policy.",
  },
  {
    question: "What if my package is lost or damaged?",
    answer: "Please contact our support team immediately via WhatsApp. We take responsibility for packages in our care and will work to resolve any issues promptly.",
  },
];

const Index = () => {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="pb-6">
      {/* Hero with Background Image */}
      <section className="relative w-full overflow-hidden">
        <div
          className="relative w-full min-h-[320px] sm:min-h-[420px] lg:min-h-[500px] bg-cover bg-center flex items-center justify-center"
          style={{ backgroundImage: `url('https://images.pexels.com/photos/257636/pexels-photo-257636.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')` }}
        >
          <div className="absolute inset-0 bg-[hsl(210,100%,12%)]/75 dark:bg-[hsl(210,60%,6%)]/85" />
          <div className="relative z-10 container px-4 py-12 sm:py-16 text-center">
            <h1 className="font-display font-bold text-2xl sm:text-4xl lg:text-5xl leading-tight animate-fade-in-up text-primary-foreground">
              DREYPELLA <span className="text-accent">RIDE</span>
            </h1>
            <p className="text-white text-sm sm:text-base mt-2 max-w-lg mx-auto animate-fade-in-up-delay-1 font-medium drop-shadow">
              Reliable Inter-City Travel & Package Delivery Across Oyo State
            </p>
            <p className="text-white/90 text-xs sm:text-sm mt-2 max-w-md mx-auto animate-fade-in-up-delay-1 drop-shadow">
              Safe, affordable, and convenient rides and deliveries connecting Lagos, Ibadan, Ogbomoso, Iseyin, and Oyo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 animate-fade-in-up-delay-2">
              {user ? (
                <>
                  <Link to="/book-ride" className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg">
                    <Bus size={18} /> Book a Ride <ArrowRight size={16} />
                  </Link>
                  <Link to="/send-package" className="inline-flex items-center justify-center gap-2 bg-white text-[hsl(210,100%,12%)] hover:bg-white/90 font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 border border-white shadow-lg">
                    <Package size={18} /> Send a Package
                  </Link>
                </>
              ) : (
                <Link to="/auth" className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-red-brand-light text-accent-foreground font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg">
                  <LogIn size={18} /> Get Started – Book or Send <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
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
            <div key={f.title} className="bg-card rounded-xl p-5 border text-center hover-lift animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
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
            <span key={city} className="inline-flex items-center gap-1.5 bg-card border rounded-full px-4 py-2 text-sm font-medium hover-lift" style={{ animationDelay: `${i * 0.08}s` }}>
              <MapPin size={14} className="text-accent" />
              {city}
            </span>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3 animate-fade-in-up-delay-2">
          All routes available in both directions
        </p>
      </section>

      {/* Pricing Section */}
      <section className="container px-4 mt-8">
        <h2 className="font-display font-bold text-lg mb-4 animate-fade-in-up">Delivery Pricing</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl p-5 border animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-accent/10 p-2 rounded-lg">
                <Package size={18} className="text-accent" />
              </div>
              <h3 className="font-display font-bold text-sm">Within Same City</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">For deliveries within Lagos, Ibadan, Ogbomoso, Iseyin, or Oyo</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base fee</span>
                <span className="font-semibold">₦600</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Per km</span>
                <span className="font-semibold">₦150/km</span>
              </div>
              <div className="border-t pt-1.5 flex justify-between font-bold">
                <span>Example (3km)</span>
                <span className="text-accent">₦1,050</span>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-5 border animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-accent/10 p-2 rounded-lg">
                <Truck size={18} className="text-accent" />
              </div>
              <h3 className="font-display font-bold text-sm">Interstate Delivery</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">For deliveries between different cities</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trip fare</span>
                <span className="font-semibold">Route price</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last-mile delivery</span>
                <span className="font-semibold">₦150/km</span>
              </div>
              <div className="border-t pt-1.5 flex justify-between font-bold">
                <span>Example (Ogbomoso→Lagos, 5km)</span>
                <span className="text-accent">Trip + ₦750</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Next Trip Info */}
      <section className="container px-4 mt-8">
        <div className="bg-card rounded-xl p-5 border text-center animate-fade-in-up-delay-2">
          <p className="text-sm font-medium text-muted-foreground mb-1">🚌 Next trips available daily</p>
          <p className="font-display font-bold text-lg">Seats available – Book now!</p>
          <p className="text-xs text-muted-foreground mt-1">Lagos ↔ Ibadan ↔ Ogbomoso ↔ Iseyin ↔ Oyo</p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container px-4 mt-8 mb-4">
        <h2 className="font-display font-bold text-lg mb-4 animate-fade-in-up">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-card rounded-xl border overflow-hidden animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
              >
                <span className="font-medium text-sm pr-4">{faq.question}</span>
                {openFaq === i ? (
                  <ChevronUp size={16} className="text-accent shrink-0" />
                ) : (
                  <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                )}
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <WhatsAppButton />
    </div>
  );
};

export default Index;
