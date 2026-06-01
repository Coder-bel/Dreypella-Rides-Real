import { MessageCircle } from "lucide-react";
import { SUPPORT_WHATSAPP } from "@/lib/constants";

interface SupportWhatsAppProps {
  context?: string; // e.g. "booking DR-ABC123" or "package DRP-XYZ"
  label?: string;
  className?: string;
}

const SupportWhatsApp = ({ context, label = "Contact Support", className = "" }: SupportWhatsAppProps) => {
  const message = context
    ? `Hello DREYPELLA support, regarding my ${context}. I need help.`
    : "Hello DREYPELLA support, I need help.";

  return (
    <a
      href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors ${className}`}
    >
      <MessageCircle size={16} fill="#25D366" />
      {label}
    </a>
  );
};

export default SupportWhatsApp;
