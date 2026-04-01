import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface CardItem {
  label: string;
  icon: string | React.ReactNode;
  desc: string;
  prompt: string;
}

const LECTURER_CARDS: CardItem[] = [
  { label: "Create Assignment", icon: "📝", desc: "Build new class tasks", prompt: "I want to create a new assignment with a specific topic" },
  { label: "Mark Attendance", icon: "✅", desc: "Track student presence", prompt: "Help me mark today's attendance" },
  { label: "Generate Quiz", icon: "⚛️", desc: "Build interactive tests", prompt: "I want to generate a 5-question quiz" },
  { label: "Schedule Class", icon: "📅", desc: "Plan future sessions", prompt: "I want to schedule a lecture for next week" },
  { label: "Send Notices", icon: "🔔", desc: "Broadcast class alerts", prompt: "Send an urgent notification to my class" },
  { label: "View Reports", icon: "📊", desc: "Check class analytics", prompt: "Show me the latest attendance report" },
];

const STUDENT_CARDS: CardItem[] = [
  { label: "Check Tasks", icon: "📝", desc: "View your assignments", prompt: "What assignments are due soon?" },
  { label: "My Attendance", icon: "✅", desc: "View your presence log", prompt: "Show my attendance percentage" },
  { label: "Today's Schedule", icon: "📅", desc: "Check your class times", prompt: "Which classes do I have today?" },
  { label: "Quiz Results", icon: "⭐", desc: "Check your test scores", prompt: "Show my recent quiz results" },
  { label: "Study Streak", icon: "🔥", desc: "Check your learning progress", prompt: "How many days is my study streak?" },
  { label: "Alerts", icon: "🔔", desc: "See your latest updates", prompt: "Show my latest notifications" },
];

interface AgentWelcomeProps {
  onChipClick: (prompt: string) => void;
}

export const AgentWelcome = ({ onChipClick }: AgentWelcomeProps) => {
  const { role, profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const isLecturer = role === "lecturer" || role === "admin";
  const cards = isLecturer ? LECTURER_CARDS : STUDENT_CARDS;

  const slogans = isLecturer ? [
    "Empowering Educators with AI",
    "Streamline Your Teaching Experience",
    "Revolutionize the Way You Teach"
  ] : [
    "Your Personalized Learning Partner",
    "Unlock Your Academic Potential",
    "The Smartest Way to Study"
  ];

  const [currentSloganIndex, setCurrentSloganIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const handleTyping = () => {
      const fullSlogan = slogans[currentSloganIndex];

      if (!isDeleting) {
          setDisplayText(fullSlogan.substring(0, displayText.length + 1));
          setTypingSpeed(100);

          if (displayText === fullSlogan) {
              setIsDeleting(true);
              setTypingSpeed(2000); // Pause at the end
          }
      } else {
          setDisplayText(fullSlogan.substring(0, displayText.length - 1));
          setTypingSpeed(50);

          if (displayText === "") {
              setIsDeleting(false);
              setCurrentSloganIndex((prev) => (prev + 1) % slogans.length);
              setTypingSpeed(500);
          }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentSloganIndex, slogans.length, typingSpeed]);

  return (
    <div className="flex flex-col items-center justify-start pt-0 md:pt-2 text-center space-y-2 md:space-y-3 w-full">
      <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
      >
          <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-primary-foreground/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative h-14 w-14 md:h-16 md:w-16 rounded-2xl overflow-hidden border border-border shadow-2xl mx-auto bg-background">
              <img src="/agent-icon.png" alt="EduSpace Agent" className="size-full object-cover p-1.5" />
          </div>
      </motion.div>

      <div className="space-y-1.5 md:space-y-2 max-w-2xl mx-auto">
          <div className="flex flex-col items-center gap-1">
             <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                Hello, {isLecturer ? `Prof. ${firstName}` : firstName} 👋
             </span>
             <h1 className="text-xl md:text-3xl font-black tracking-tight text-foreground leading-[1.1] min-h-[1.8em] flex flex-wrap justify-center items-center px-4">
                <span className="text-foreground/70">{displayText.split(' ').slice(0, -2).join(' ')} </span>
                <span className="text-primary ml-2 underline decoration-primary/20 underline-offset-4">
                    {displayText.split(' ').slice(-2).join(' ')}
                    <span className="inline-block w-1 h-5 md:h-8 bg-primary/40 ml-1 animate-pulse align-middle" />
                </span>
             </h1>
          </div>
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
              {cards.map((item, i) => (
                  <motion.button
                      key={item.label}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      onClick={() => onChipClick(item.prompt)}
                      className={cn(
                        "group flex items-center gap-3 p-3 md:p-3.5 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl hover:bg-primary/[0.04] hover:border-primary/20 transition-all text-left shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]",
                      )}
                  >
                      <div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-lg md:text-xl group-hover:scale-110 transition-all shadow-inner border border-primary/5">
                          {item.icon}
                      </div>
                      <div className="min-w-0">
                          <p className="text-[11px] md:text-[12px] font-black text-foreground group-hover:text-primary transition-colors truncate">
                              {item.label}
                          </p>
                          <p className="text-[8px] md:text-[9px] font-bold text-muted-foreground/40 mt-0.5 uppercase tracking-wide truncate">
                              {item.desc}
                          </p>
                      </div>
                  </motion.button>
              ))}
          </div>
      </div>
    </div>
  );
};
