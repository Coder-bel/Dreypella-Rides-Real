import { useState, useEffect } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer = () => {
  const getTargetDate = () => {
    const now = new Date();
    const target = new Date(now);
    // Next trip in 2 days at 7am
    target.setDate(target.getDate() + 2);
    target.setHours(7, 0, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return target;
  };

  const [targetDate] = useState(getTargetDate);
  const [seatsLeft] = useState(7);

  const calcTimeLeft = (): TimeLeft => {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calcTimeLeft);
  const [tick, setTick] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calcTimeLeft());
      setTick((t) => !t);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const blocks = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Mins", value: timeLeft.minutes },
    { label: "Secs", value: timeLeft.seconds },
  ];

  return (
    <div className="bg-card rounded-xl p-4 sm:p-6 shadow-lg border animate-fade-in-up-delay-2">
      <p className="text-sm font-medium text-muted-foreground mb-1">Next Lagos Trip</p>
      <div className="flex gap-2 sm:gap-3 justify-center my-3">
        {blocks.map((b) => (
          <div
            key={b.label}
            className={`flex flex-col items-center bg-secondary rounded-lg px-3 py-2 min-w-[56px] ${
              tick && b.label === "Secs" ? "animate-count-tick" : ""
            }`}
          >
            <span className="text-xl sm:text-2xl font-display font-bold text-foreground">
              {String(b.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{b.label}</span>
          </div>
        ))}
      </div>
      <p className={`text-center text-sm font-semibold ${seatsLeft < 5 ? "text-accent" : "text-foreground"}`}>
        🪑 {seatsLeft} seats left – book now!
      </p>
    </div>
  );
};

export default CountdownTimer;
