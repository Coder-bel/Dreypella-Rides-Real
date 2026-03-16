import { MessageCircle } from "lucide-react";
import { SUPPORT_WHATSAPP } from "@/lib/constants";

const WhatsAppButton = () => {
  return (
    <a
      href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent("Hello DREYPELLA support, I need help.")}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 md:bottom-6 right-4 z-40 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full p-3.5 shadow-xl hover-lift animate-bounce-in"
      aria-label="Contact Support on WhatsApp"
      title="Contact Support"
    >
      <MessageCircle size={24} fill="white" />
    </a>
  );
};

export default WhatsAppButton;
