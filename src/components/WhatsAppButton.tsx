import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => {
  return (
    <a
      href="https://wa.me/2348000000000"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 md:bottom-6 right-4 z-40 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full p-3.5 shadow-xl hover-lift animate-bounce-in"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={24} fill="white" />
    </a>
  );
};

export default WhatsAppButton;
