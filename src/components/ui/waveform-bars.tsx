import { cn } from "@/lib/utils";

interface WaveformBarsProps {
  barCount?: number;
  className?: string;
  active?: boolean;
}

export function WaveformBars({ barCount = 20, className, active = true }: WaveformBarsProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1.5 rounded-full bg-gradient-to-t from-brand-600 to-brand-400 shadow-[0_0_10px_rgba(12,142,233,0.3)]",
            active && "animate-wave"
          )}
          style={{
            height: `${20 + Math.sin(i * 0.5) * 40 + Math.random() * 20}%`,
            animationDelay: `${i * 0.05}s`,
            animationDuration: `${1 + Math.random() * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}
