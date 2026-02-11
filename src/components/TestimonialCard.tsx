import { Star } from "lucide-react";

interface TestimonialCardProps {
  name: string;
  department: string;
  text: string;
  delay?: number;
}

const TestimonialCard = ({ name, department, text, delay = 0 }: TestimonialCardProps) => {
  return (
    <div
      className="bg-card rounded-xl p-5 border shadow-sm hover-lift"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex gap-0.5 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} className="fill-gold text-gold" />
        ))}
      </div>
      <p className="text-sm text-foreground leading-relaxed mb-3">"{text}"</p>
      <div>
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{department}</p>
      </div>
    </div>
  );
};

export default TestimonialCard;
