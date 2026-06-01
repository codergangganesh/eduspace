import { ButtonDemo } from "@/components/ui/button-border";
import { GlowCard } from "@/components/ui/spotlight-card";
import { GlobePulse } from "@/components/ui/cobe-globe-pulse";
import { RainbowButton } from "@/components/ui/rainbow-borders-button";

export default function DemoOne() {
  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center gap-10 p-10">
      <h1 className="text-3xl font-black text-white uppercase tracking-wider">Rainbow Border Button Showcase</h1>
      <RainbowButton onClick={() => alert("Rainbow Action!")}>
        Rainbow Button
      </RainbowButton>
    </div>
  );
}

export function Default() {
  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center gap-10 p-10">
      <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-4">Spotlight Glow Cards</h1>
      <div className="flex flex-col md:flex-row items-center justify-center gap-10">
        <GlowCard glowColor="blue" size="md">
          <div className="text-white relative z-10 flex flex-col justify-between h-full p-4">
            <h3 className="text-2xl font-black tracking-tight">Blue Spotlight</h3>
            <p className="text-sm text-slate-400 font-medium">Move your mouse to trace the glowing border dynamic effect.</p>
          </div>
        </GlowCard>
        <GlowCard glowColor="purple" size="md">
          <div className="text-white relative z-10 flex flex-col justify-between h-full p-4">
            <h3 className="text-2xl font-black tracking-tight">Purple Spotlight</h3>
            <p className="text-sm text-slate-400 font-medium">Interactive pointer tracker using CSS custom property mappings.</p>
          </div>
        </GlowCard>
        <GlowCard glowColor="orange" size="md">
          <div className="text-white relative z-10 flex flex-col justify-between h-full p-4">
            <h3 className="text-2xl font-black tracking-tight">Orange Spotlight</h3>
            <p className="text-sm text-slate-400 font-medium">Extremely high-fidelity layout rendering for premium aesthetics.</p>
          </div>
        </GlowCard>
      </div>
    </div>
  );
}

export function GlobePulseDemo() {
  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-black p-8 overflow-hidden">
      <div className="w-full max-w-lg">
        <GlobePulse />
      </div>
    </div>
  )
}
