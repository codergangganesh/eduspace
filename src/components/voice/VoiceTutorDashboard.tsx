import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/Progress";
import {
  Flame,
  Trophy,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Briefcase,
  Languages,
  Presentation,
  ShieldCheck,
  Database,
  Code2
} from "lucide-react";
import { PracticeMode } from "@/lib/voiceService";
import { cn } from "@/lib/utils";

const modes: Array<{
  id: PracticeMode;
  name: string;
  desc: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  difficulty: string;
}> = [
    {
      id: "interview",
      name: "Interview Prep",
      icon: Briefcase,
      desc: "Behavioral and technical mock rounds for top companies.",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20 hover:border-blue-500/40",
      iconBg: "bg-blue-500/20",
      difficulty: "Advanced",
    },
    {
      id: "language",
      name: "Language Fluency",
      icon: Languages,
      desc: "Master grammar, pronunciation, and conversational flow.",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20 hover:border-emerald-500/40",
      iconBg: "bg-emerald-500/20",
      difficulty: "Intermediate",
    },
    {
      id: "presentation",
      name: "Public Speaking",
      icon: Presentation,
      desc: "Refine your delivery, pacing, and narrative structure.",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20 hover:border-amber-500/40",
      iconBg: "bg-amber-500/20",
      difficulty: "Advanced",
    },
    {
      id: "sales",
      name: "SQL Practice",
      icon: Database,
      desc: "Practice queries, joins, filtering, and database thinking.",
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/20 hover:border-rose-500/40",
      iconBg: "bg-rose-500/20",
      difficulty: "Advanced",
    },
    {
      id: "academic",
      name: "DSA",
      icon: Code2,
      desc: "Solve algorithm problems and explain data structures.",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20 hover:border-cyan-500/40",
      iconBg: "bg-cyan-500/20",
      difficulty: "Intermediate",
    },
    {
      id: "confidence",
      name: "Confidence Builder",
      icon: ShieldCheck,
      desc: "Low-pressure environment to build speaking stamina.",
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20 hover:border-indigo-500/40",
      iconBg: "bg-indigo-500/20",
      difficulty: "Beginner",
    },
  ];

interface VoiceTutorDashboardProps {
  onStartSession: (mode: PracticeMode) => void;
}

export function VoiceTutorDashboard({ onStartSession }: VoiceTutorDashboardProps) {
  return (
    <div className="p-4 md:p-8 space-y-8 h-full overflow-y-auto custom-scrollbar scroll-smooth pb-24">
      {/* Top bar with search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-secondary/30 backdrop-blur-md rounded-full px-1 py-1">
          <button className="px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-brand-500 text-white shadow-lg shadow-brand-500/20 transition-all">
            Practice
          </button>
          <button className="px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all">
            History
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 shadow-sm">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-xs font-black text-orange-500">7-Day Streak</span>
          </div>
        </div>
      </div>

      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-3xl md:text-4xl font-black tracking-tight">
          Ready to Practice?
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Select a domain to start a high-performance voice training session.
        </p>
      </motion.div>

      {/* Domain Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {modes.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={cn(
              "glass-card border-border/10 transition-all duration-300 group h-full cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
              m.borderColor
            )}>
              <CardContent className="p-7 flex flex-col h-full">
                {/* Header with icons */}
                <div className="flex items-start justify-between mb-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-black/5",
                    m.iconBg
                  )}>
                    <m.icon className={cn("h-6 w-6", m.color)} />
                  </div>
                  <Badge variant="secondary" className="text-[10px] uppercase font-black tracking-widest bg-white/5 border-none opacity-60">
                    {m.difficulty}
                  </Badge>
                </div>

                {/* Title & Description */}
                <h3 className="font-heading text-xl font-bold mb-2 group-hover:text-brand-400 transition-colors">{m.name}</h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-2">{m.desc}</p>

                {/* Progress (Mock) */}
                <div className="mb-8 mt-auto">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">
                    <span>Performance</span>
                    <span>72%</span>
                  </div>
                  <Progress value={72} className="h-1.5" />
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-auto">
                  <Button
                    variant="default"
                    size="default"
                    className="flex-1 font-black uppercase tracking-widest h-12 rounded-2xl shadow-xl shadow-brand-500/20 group-hover:scale-[1.02] transition-transform"
                    onClick={() => onStartSession(m.id)}
                  >
                    Start Practice
                  </Button>
                  <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl border-border/20 bg-white/5">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats Row per CoachBuddy */}
      <div className="grid lg:grid-cols-2 gap-8 mt-12 pb-12">
        {/* Recent sessions teaser or AI feedback summary */}
        <Card className="glass-card border-brand-500/20 bg-brand-500/5 group">
          <CardContent className="p-8 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-all duration-500">
              <Sparkles className="h-8 w-8 text-brand-400" />
            </div>
            <div>
              <h3 className="text-lg font-black font-heading mb-1">Personalized Coaching</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">AI keeps your practice focused on the mode you select, with no extra chatter outside the session topic.</p>
            </div>
            <Button variant="default" size="sm" className="shrink-0 ml-auto h-10 rounded-xl hidden md:flex">Resume</Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/10 bg-card/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <TrendingUp className="size-20" />
          </div>
          <CardContent className="p-8 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-black font-heading mb-1">Global Leaderboard</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">You are in the **Top 5%** of learners this week for fluency.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
