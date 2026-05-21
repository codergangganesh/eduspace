import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  Globe, 
  Search, 
  Linkedin, 
  Github, 
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Twitter
} from "lucide-react";
import { toast } from "sonner";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { actualTheme } = useTheme();
  const isDark = actualTheme === "dark";
  
  // Swipe Slider State & Pointer Event Handlers for Mobile Redirect
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const trackRef = useRef<HTMLDivElement>(null);
  
  const knobWidth = 48; // Size of circular knob (w-12)
  const trackPadding = 4; // Padding inside track (p-1)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isSuccess) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    (e.currentTarget as any).startX = e.clientX;
    (e.currentTarget as any).currentDragX = dragX;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isSuccess || !trackRef.current) return;
    
    const startX = (e.currentTarget as any).startX;
    const currentX = e.clientX;
    const deltaX = currentX - startX;
    
    const trackWidth = trackRef.current.clientWidth;
    const maxDistance = trackWidth - knobWidth - (trackPadding * 2);
    
    let newDragX = Math.max(0, Math.min(deltaX, maxDistance));
    setDragX(newDragX);
    
    if (newDragX >= maxDistance - 1) {
      setIsSuccess(true);
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
      
      toast.success("Redirecting to Dashboard...");
      setTimeout(() => {
        navigate(role ? (role === "lecturer" ? "/lecturer-dashboard" : "/dashboard") : "/");
      }, 500);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isSuccess) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragX(0); // Snap back smoothly
  };
  
  // Parallax mouse offsets
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Parallax handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / (width / 2); // Normalizes between -1 and 1
    const y = (e.clientY - top - height / 2) / (height / 2); // Normalizes between -1 and 1
    setMouseOffset({ x, y });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 }); // Snap back smoothly
  };

  // Get responsive layer styles
  const getTranslationStyle = (factor: number) => {
    const translateX = mouseOffset.x * factor;
    const translateY = mouseOffset.y * (factor * 0.4); // Vertically damp the parallax for visual coherence
    return {
      transform: `translate3d(${translateX}px, ${translateY}px, 0)`,
      transition: "transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    };
  };

  // Smart Search logic
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    if (q.includes("profile") || q.includes("account") || q.includes("avatar") || q.includes("me")) {
      navigate("/profile");
    } else if (q.includes("setting") || q.includes("password") || q.includes("theme")) {
      navigate("/settings");
    } else if (q.includes("help") || q.includes("support") || q.includes("faq") || q.includes("contact") || q.includes("guide")) {
      navigate("/help");
    } else if (q.includes("assign") || q.includes("homework") || q.includes("task") || q.includes("project")) {
      navigate(role === "lecturer" ? "/lecturer/assignments" : "/student/assignments");
    } else if (q.includes("schedule") || q.includes("timetable") || q.includes("calendar") || q.includes("class")) {
      navigate(role === "lecturer" ? "/lecturer/timetable" : "/schedule");
    } else if (q.includes("attendance") || q.includes("present") || q.includes("absent")) {
      navigate(role === "lecturer" ? "/lecturer/attendance" : "/student/attendance");
    } else if (q.includes("quiz") || q.includes("test") || q.includes("exam")) {
      navigate(role === "lecturer" ? "/lecturer/classes/quizzes" : "/student/quizzes");
    } else if (q.includes("ai") || q.includes("tutor") || q.includes("voice") || q.includes("chat") || q.includes("bot")) {
      navigate("/voice-tutor");
    } else if (q.includes("map") || q.includes("knowledge") || q.includes("skill")) {
      navigate("/knowledge-map");
    } else if (q.includes("streak") || q.includes("rank") || q.includes("points")) {
      navigate("/streak");
    } else if (q.includes("message") || q.includes("chat") || q.includes("inbox") || q.includes("mail")) {
      navigate("/messages");
    } else if (q.includes("dashboard") || q.includes("home")) {
      navigate(role === "lecturer" ? "/lecturer-dashboard" : "/dashboard");
    } else {
      navigate(`/help?search=${encodeURIComponent(q)}`);
    }
  };

  const languages = ["English", "Español", "Français", "Deutsch", "日本語", "हिन्दी"];

  const handleLanguageSelect = (lang: string) => {
    setSelectedLanguage(lang);
    setLanguageMenuOpen(false);
    toast.info(`Language changed to ${lang}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117] text-slate-900 dark:text-[#c9d1d9] font-sans flex flex-col justify-between overflow-x-hidden selection:bg-[#1f6feb]/40 selection:text-white transition-colors duration-500">
      <SEO 
        title="404: This page is not the web page you are looking for" 
        description="The requested page could not be found. Use the smart search or quick links to return to the EduSpace LMS platform."
      />

      {/* DESKTOP VIEW (hidden on mobile) */}
      <div className="hidden md:flex flex-grow flex-col">
        
        {/* REDESIGNED TATOOINE PARALLAX BANNER */}
        <div 
          className="w-full h-[320px] sm:h-[380px] md:h-[420px] overflow-hidden relative cursor-default bg-gradient-to-b from-[#8ec1da] to-[#d6e7f0] border-b border-[#30363d] select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Layer 1: Sky & Binary Suns */}
          <div className="absolute inset-0 pointer-events-none" style={getTranslationStyle(-2)}>
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {/* Binary Suns */}
              <circle cx="15%" cy="25%" r="30" fill="#ff7b25" className="opacity-90 blur-[1px] filter drop-shadow-[0_0_20px_rgba(255,123,37,0.7)]" />
              <circle cx="21%" cy="32%" r="18" fill="#e03e3e" className="opacity-80 blur-[0.5px] filter drop-shadow-[0_0_15px_rgba(224,62,62,0.6)]" />
            </svg>
          </div>

          {/* Layer 2: Tatooine Academic Observatory Dome */}
          <div className="absolute inset-0 pointer-events-none" style={getTranslationStyle(-6)}>
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" preserveAspectRatio="none">
              {/* Far background hills */}
              <path d="M-100,320 Q150,220 400,320 T900,320 T1300,320 L1300,450 L-100,450 Z" fill="#ebd3b2" opacity="0.3" />
              
              {/* Far Dome Building */}
              <g transform="translate(680, 190) scale(0.75)" opacity="0.85">
                {/* Main Dome */}
                <path d="M 40,110 C 40,60 110,60 110,110 Z" fill="#e5d0b3" stroke="#d5bf9f" strokeWidth="1.5" />
                {/* Lower base */}
                <rect x="25" y="110" width="100" height="25" rx="3" fill="#dec4a1" stroke="#ccb28f" strokeWidth="1.5" />
                {/* Left side arch */}
                <path d="M 5,135 Q 20,115 35,135 Z" fill="#d2b896" />
                {/* Top tower antenna */}
                <line x1="75" y1="60" x2="75" y2="25" stroke="#ccb28f" strokeWidth="2.5" />
                <circle cx="75" cy="22" r="4" fill="#ff7b25" />
                {/* Door shade */}
                <path d="M 65,135 Q 75,115 85,135 Z" fill="#b09674" />
              </g>

              {/* Moisture Vaporator / Antenna */}
              <g transform="translate(850, 160) scale(0.65)" opacity="0.8">
                <line x1="20" y1="160" x2="20" y2="40" stroke="#ccb28f" strokeWidth="3" />
                <line x1="5" y1="100" x2="35" y2="100" stroke="#ccb28f" strokeWidth="2.5" />
                <line x1="8" y1="70" x2="32" y2="70" stroke="#ccb28f" strokeWidth="2.5" />
                <circle cx="20" cy="30" r="6" fill="#e5d0b3" stroke="#ccb28f" strokeWidth="2" />
                <path d="M 10,160 L 20,135 L 30,160 Z" fill="#d2b896" />
              </g>
            </svg>
          </div>

          {/* Layer 3: Midground sand dunes */}
          <div className="absolute inset-0 pointer-events-none" style={getTranslationStyle(-10)}>
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" preserveAspectRatio="none">
              <path d="M-100,340 Q250,230 600,330 T1300,320 L1300,450 L-100,450 Z" fill="#dfc19c" />
            </svg>
          </div>

          {/* Layer 4: Interactive Hover Speeder / Study Desk */}
          <div className="absolute inset-0 pointer-events-none" style={getTranslationStyle(-14)}>
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid meet">
              <g transform="translate(750, 215) scale(0.9)">
                {/* Shadow/Glow underneath */}
                <ellipse cx="140" cy="115" rx="80" ry="12" fill="rgba(43, 145, 191, 0.15)" className="blur-[5px]" />
                
                {/* Speeder Body */}
                <path d="M 50,75 L 180,68 C 220,68 250,85 240,105 L 230,110 L 40,110 L 30,95 Z" fill="#b0c5d4" stroke="#8da8bd" strokeWidth="2" />
                {/* Accent lines */}
                <path d="M 60,82 L 175,76" stroke="#1f6feb" strokeWidth="3" strokeLinecap="round" />
                <rect x="75" y="90" width="45" height="15" rx="2" fill="#58a6ff" opacity="0.8" />
                
                {/* Hover Engines */}
                <rect x="25" y="92" width="22" height="14" rx="2" fill="#6e7681" />
                <path d="M 12,96 L 25,93 L 25,105 L 12,102 Z" fill="#ff7b25" className="blur-[0.5px]" />
                
                {/* Solar Wind Shield */}
                <path d="M 175,68 L 190,40 L 220,40 L 210,68 Z" fill="rgba(88, 166, 255, 0.35)" stroke="#58a6ff" strokeWidth="1.5" />
                
                {/* Holographic Glowing Books */}
                <g transform="translate(130, 42)">
                  {/* Floating blue neon book */}
                  <rect x="0" y="10" width="36" height="10" rx="1.5" fill="rgba(88, 166, 255, 0.4)" stroke="#00f0ff" strokeWidth="1.5" className="animate-pulse" />
                  <rect x="5" y="4" width="30" height="7" rx="1.5" fill="rgba(88, 166, 255, 0.5)" stroke="#00f0ff" strokeWidth="1" />
                  <rect x="2" y="-1" width="34" height="6" rx="1" fill="rgba(88, 166, 255, 0.6)" stroke="#00f0ff" strokeWidth="1" />
                  
                  {/* Holographic vertical rays */}
                  <line x1="18" y1="-8" x2="18" y2="20" stroke="#00f0ff" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.7" />
                </g>
              </g>
            </svg>
          </div>

          {/* Layer 5: Cute Academic Obi-Wan Owl Mascot */}
          <div className="absolute inset-0 pointer-events-none" style={getTranslationStyle(-18)}>
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid meet">
              <g transform="translate(570, 160) scale(1.15)">
                
                {/* Wizard Jedi Robe Cloak (Back Hood) */}
                <path d="M 22,90 C -10,90 -2,12 -2,12 C -2,12 8,-20 45,-20 C 82,-20 92,12 92,12 C 92,12 100,90 68,90 Z" fill="#5c4033" />
                
                {/* Robe Shoulders */}
                <path d="M -5,80 C -5,55 95,55 95,80 L 100,140 L -10,140 Z" fill="#6f4e37" stroke="#4a3329" strokeWidth="1.5" />
                
                {/* Owl Body */}
                <ellipse cx="45" cy="85" rx="35" ry="42" fill="#e5d0b3" stroke="#ccb28f" strokeWidth="2" />
                {/* Owl Chest (light feathers) */}
                <ellipse cx="45" cy="94" rx="22" ry="24" fill="#fcf6ec" />
                
                {/* Owl Big Wise Eyes */}
                <circle cx="28" cy="65" r="14" fill="#ffffff" stroke="#4a3329" strokeWidth="1.5" />
                <circle cx="28" cy="65" r="7" fill="#0d1117" />
                <circle cx="31" cy="62" r="3" fill="#ffffff" /> {/* shine */}
                
                <circle cx="62" cy="65" r="14" fill="#ffffff" stroke="#4a3329" strokeWidth="1.5" />
                <circle cx="62" cy="65" r="7" fill="#0d1117" />
                <circle cx="65" cy="62" r="3" fill="#ffffff" /> {/* shine */}
                
                {/* Beak */}
                <polygon points="45,74 41,83 49,83" fill="#ff7b25" />
                
                {/* Graduation / Wizard Cap peeking out */}
                <polygon points="45,26 15,36 45,46 75,36" fill="#1f2937" />
                <rect x="42" y="36" width="6" height="8" fill="#1f2937" />
                <line x1="70" y1="38" x2="80" y2="56" stroke="#ff7b25" strokeWidth="1.5" />
                <circle cx="80" cy="57" r="2.5" fill="#ff7b25" />

                {/* Robe Front Lapels */}
                <path d="M 22,78 L 45,130 L 68,78" fill="none" stroke="#4a3329" strokeWidth="2" />
                
                {/* Cute Wing sleeves holding Glowing Stylus */}
                {/* Left wing sleeve */}
                <path d="M 8,82 C -4,82 -2,105 10,105 Z" fill="#6f4e37" />
                
                {/* Right wing sleeve holding glowing digital stylus pencil */}
                <path d="M 82,82 C 94,82 92,105 80,105 Z" fill="#6f4e37" />
                
                {/* Glowing Stylus (Jedi Academic Wand) */}
                <g transform="translate(80, 75) rotate(-35)">
                  {/* Glowing stylus ray */}
                  <line x1="0" y1="-35" x2="0" y2="40" stroke="#00f0ff" strokeWidth="4.5" strokeLinecap="round" className="blur-[1px] filter drop-shadow-[0_0_12px_rgba(0,240,255,1)]" />
                  <line x1="0" y1="-35" x2="0" y2="40" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                  {/* Handle */}
                  <rect x="-3" y="10" width="6" height="20" rx="1.5" fill="#30363d" stroke="#c9d1d9" strokeWidth="1" />
                </g>
              </g>
            </svg>
          </div>

          {/* Layer 6: Precise Speech Bubble (Styled exactly like image) */}
          <div className="absolute inset-0 pointer-events-none" style={getTranslationStyle(-20)}>
            <div className="absolute left-[8%] sm:left-[15%] md:left-[22%] bottom-[32%] sm:bottom-[34%] md:bottom-[36%] max-w-[260px] sm:max-w-[310px]">
              
              {/* Bubble Body */}
              <div className="relative bg-white text-[#24292e] px-6 py-5 rounded-[22px] shadow-[0_12px_40px_rgba(15,23,42,0.18)] border border-white/60 select-text pointer-events-auto">
                <h1 className="text-[44px] font-black leading-none tracking-tight text-[#24292e] mb-1 font-mono text-center">404</h1>
                <p className="text-sm font-semibold leading-snug text-[#586069] text-center px-1">
                  This is not the web page you are looking for.
                </p>
                
                {/* Speech Bubble Arrow pointing right towards Owl */}
                <div className="absolute right-[-10px] top-[50%] -translate-y-1/2 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[12px] border-l-white drop-shadow-[4px_0_4px_rgba(0,0,0,0.05)]" />
              </div>
            </div>
          </div>

          {/* Layer 7: Foreground sand dunes */}
          <div className="absolute inset-0 pointer-events-none" style={getTranslationStyle(-24)}>
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" preserveAspectRatio="none">
              <path d="M-100,365 Q350,270 800,355 T1300,340 L1300,450 L-100,450 Z" fill="#d2af82" />
            </svg>
          </div>
        </div>

        {/* SEARCH AND QUICK NAVIGATION CONTAINER */}
        <div className="bg-[#0d1117] flex-grow flex flex-col items-center justify-center px-4 py-12 md:py-16">
          <div className="w-full max-w-2xl text-center space-y-6">
            
            {/* SEARCH FORM */}
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <label 
                htmlFor="search-box" 
                className="block text-base font-semibold text-[#8b949e] tracking-wide"
              >
                Find courses, assignments, and resources on EduSpace:
              </label>
              
              <div className="flex items-center gap-2 max-w-xl mx-auto relative group">
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8b949e] group-focus-within:text-[#58a6ff] transition-colors" />
                  <input
                    id="search-box"
                    type="text"
                    placeholder="Search e.g. schedule, assignments, ai tutor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#010409] border border-[#30363d] rounded-lg text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#1f6feb] focus:ring-1 focus:ring-[#1f6feb] transition-all text-sm sm:text-base"
                    autoComplete="off"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] font-medium border border-[#30363d] hover:border-[#8b949e] rounded-lg transition-all text-sm shrink-0 active:bg-[#161b22]"
                >
                  Search
                </button>
              </div>
            </form>

            {/* DIRECT LINKS BELOW SEARCH (Contact / Status / FAQ) */}
            <div className="flex items-center justify-center flex-wrap gap-x-2 gap-y-1 text-sm font-medium text-[#8b949e] pt-2">
              <Link to="/help" className="text-[#58a6ff] hover:underline transition-all">Contact Support</Link>
              <span className="text-[#30363d]">•</span>
              <a href="#" onClick={(e) => { e.preventDefault(); toast.success("All systems are fully operational"); }} className="text-[#58a6ff] hover:underline transition-all">EduSpace Status</a>
              <span className="text-[#30363d]">•</span>
              <Link to="/help" className="text-[#58a6ff] hover:underline transition-all">Help Center</Link>
            </div>

          </div>
        </div>

      </div>

      {/* MOBILE VIEW (hidden on desktop) */}
      <div className="flex md:hidden flex-grow flex-col items-center justify-between p-6 text-slate-800 dark:text-white transition-all duration-500">
        <style>{`
          @keyframes floatMobile {
            0%, 100% { transform: translate(60px, 80px) scale(0.85); }
            50% { transform: translate(60px, 72px) scale(0.85); }
          }
          .animate-float-owl {
            animation: floatMobile 4s ease-in-out infinite;
            transform-origin: center;
          }
          @keyframes pulseGlow {
            0%, 100% { opacity: 0.1; transform: scale(1); }
            50% { opacity: 0.22; transform: scale(1.06); }
          }
          .animate-glow-pulse {
            animation: pulseGlow 4s ease-in-out infinite;
          }
          @keyframes themePop {
            from { transform: scale(0.96); opacity: 0.7; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-theme-pop {
            animation: themePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
        `}</style>

        {/* Header/Top Area */}
        <div className="w-full flex justify-between items-center py-2">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg overflow-hidden border border-slate-200/50 dark:border-white/20">
              <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-cover" width="28" height="28" />
            </div>
            <span className="text-base font-semibold text-slate-900 dark:text-white">Eduspace</span>
          </div>
          <ThemeToggle />
        </div>

        {/* Center Illustration and Action */}
        <div key={actualTheme} className="flex-grow flex flex-col items-center justify-center max-w-sm w-full text-center space-y-8 my-auto animate-theme-pop">
          {/* Glassmorphic Rounded Illustration Container */}
          <div className="relative w-full aspect-square max-w-[280px] mx-auto bg-gradient-to-b from-sky-100/50 to-slate-50/10 dark:from-[#1a2333]/50 dark:to-[#0d1117]/10 rounded-full border border-slate-200 dark:border-slate-800 p-6 shadow-lg dark:shadow-2xl flex items-center justify-center transition-all duration-500">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-blue-500/10 dark:bg-[#1f6feb]/10 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
            
            <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Sky Background */}
              <circle cx="100" cy="100" r="85" fill="url(#mobileSkyGrad)" className="opacity-90" />
              
              {/* Suns and Cloud based on theme */}
              {isDark ? (
                <>
                  {/* Dark Mode Binary Suns */}
                  <circle cx="60" cy="50" r="14" fill="#ff7b25" className="opacity-90 filter drop-shadow-[0_0_10px_rgba(255,123,37,0.7)] transition-all duration-500" />
                  <circle cx="85" cy="58" r="8" fill="#e03e3e" className="opacity-80 filter drop-shadow-[0_0_8px_rgba(224,62,62,0.6)] transition-all duration-500" />
                </>
              ) : (
                <>
                  {/* Light Mode Sun */}
                  <circle cx="95" cy="48" r="16" fill="#fbbf24" className="opacity-95 filter drop-shadow-[0_0_12px_rgba(251,191,36,0.6)] transition-all duration-500" />
                  {/* Cloud */}
                  <path d="M 45 60 C 45 52, 58 46, 68 50 C 74 44, 90 44, 96 50 C 106 46, 116 52, 116 60 Z" fill="#ffffff" className="opacity-85 transition-all duration-500" />
                </>
              )}
              
              {/* Dunes */}
              <path 
                d="M 15 130 C 45 110 95 130 145 115 C 165 110 180 120 185 130 L 185 185 L 15 185 Z" 
                fill={isDark ? "#d2af82" : "#e9c496"} 
                className="transition-all duration-500" 
              />
              <path 
                d="M 15 145 C 65 130 115 155 185 140 L 185 185 L 15 185 Z" 
                fill={isDark ? "#dfc19c" : "#f3ddc2"} 
                className="transition-all duration-500" 
                opacity={isDark ? 0.8 : 0.9}
              />
              
              {/* Small Observatory Dome */}
              <g transform="translate(130, 95) scale(0.4)">
                <path 
                  d="M 40,110 C 40,60 110,60 110,110 Z" 
                  fill={isDark ? "#e5d0b3" : "#cbd5e1"} 
                  stroke={isDark ? "#d5bf9f" : "#94a3b8"} 
                  strokeWidth="1" 
                  className="transition-all duration-500"
                />
                <rect 
                  x="25" 
                  y="110" 
                  width="100" 
                  height="20" 
                  rx="2" 
                  fill={isDark ? "#dec4a1" : "#94a3b8"} 
                  className="transition-all duration-500"
                />
              </g>

              {/* Obi-Wan Owl Mascot */}
              <g className="animate-float-owl">
                {/* Cloak */}
                <path d="M 22,90 C -10,90 -2,12 -2,12 C -2,12 8,-20 45,-20 C 82,-20 92,12 92,12 C 92,12 100,90 68,90 Z" fill="#5c4033" />
                {/* Shoulders */}
                <path d="M -5,80 C -5,55 95,55 95,80 L 100,120 L -10,120 Z" fill="#6f4e37" stroke="#4a3329" strokeWidth="1" />
                {/* Owl Body */}
                <ellipse cx="45" cy="85" rx="35" ry="42" fill="#e5d0b3" stroke="#ccb28f" strokeWidth="1.5" />
                {/* Owl Chest */}
                <ellipse cx="45" cy="94" rx="22" ry="24" fill="#fcf6ec" />
                {/* Eyes */}
                <circle cx="28" cy="65" r="14" fill="#ffffff" stroke="#4a3329" strokeWidth="1" />
                <circle cx="28" cy="65" r="7" fill="#0d1117" />
                <circle cx="31" cy="62" r="3" fill="#ffffff" />
                
                <circle cx="62" cy="65" r="14" fill="#ffffff" stroke="#4a3329" strokeWidth="1" />
                <circle cx="62" cy="65" r="7" fill="#0d1117" />
                <circle cx="65" cy="62" r="3" fill="#ffffff" />
                {/* Beak */}
                <polygon points="45,74 41,83 49,83" fill="#ff7b25" />
                {/* Hat */}
                <polygon points="45,26 15,36 45,46 75,36" fill="#1f2937" />
                {/* Glowing stylus */}
                <g transform="translate(80, 75) rotate(-35)">
                  <line x1="0" y1="-25" x2="0" y2="30" stroke="#00f0ff" strokeWidth="3" className="blur-[0.5px] filter drop-shadow-[0_0_8px_rgba(0,240,255,1)]" />
                  <line x1="0" y1="-25" x2="0" y2="30" stroke="#ffffff" strokeWidth="1" />
                </g>
              </g>
              
              <line x1="100" y1="165" x2="100" y2="190" stroke="#00f0ff" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
              
              <defs>
                <linearGradient id="mobileSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: isDark ? "#0f172a" : "#bae6fd", transition: "stop-color 0.5s ease" }} />
                  <stop offset="100%" style={{ stopColor: isDark ? "#0d1117" : "#e0f2fe", transition: "stop-color 0.5s ease" }} />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Typography */}
          <div className="space-y-3 px-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ff7b25]/10 border border-[#ff7b25]/20 rounded-full text-xs font-semibold text-[#ff7b25] tracking-wide animate-pulse">
              ERROR CODE: 404
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
              Lost in Space
            </h2>
            <p className="text-sm text-slate-500 dark:text-[#8b949e] leading-relaxed">
              This page is not the web page you are looking for. Let's get you back to the safe zone.
            </p>
          </div>

          {/* Swipe to Return Redirect Slider */}
          <div className="w-full px-4">
            <div 
              ref={trackRef}
              className={`relative w-full h-14 bg-slate-200/50 dark:bg-slate-900/60 border ${isSuccess ? 'bg-emerald-500/20 dark:bg-emerald-500/10 border-emerald-500/50' : 'border-slate-300 dark:border-slate-800/80'} rounded-full p-1 flex items-center justify-between select-none overflow-hidden transition-all duration-300 shadow-inner`}
            >
              {/* Sliding Circular Knob */}
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className={`absolute left-1 top-1 w-12 h-12 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center transition-all select-none shadow-md z-10 ${
                  isSuccess 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600' 
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-[#1f6feb] dark:to-[#58a6ff]'
                }`}
                style={{
                  transform: `translate3d(${dragX}px, 0, 0)`,
                  transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  touchAction: 'none' // Prevent screen-scrolling interference while dragging
                }}
              >
                {isSuccess ? (
                  /* Success State */
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  /* Swipe Arrow Icon */
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-white transition-transform ${isDragging ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                )}
              </div>

              {/* Centered instruction text */}
              <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-500 dark:text-slate-400 font-extrabold text-[10px] sm:text-xs tracking-widest uppercase transition-opacity"
                style={{ 
                  opacity: Math.max(0, 1 - (dragX / (trackRef.current ? trackRef.current.clientWidth - 56 : 220)) * 2)
                }}
              >
                <span>Swipe right to return</span>
              </div>

              {/* Target Chevron indicators */}
              <div 
                className="absolute right-4 flex items-center gap-0.5 text-slate-400 dark:text-slate-600 font-extrabold pointer-events-none transition-opacity"
                style={{ 
                  opacity: Math.max(0, 0.8 - (dragX / (trackRef.current ? trackRef.current.clientWidth - 56 : 220)) * 2)
                }}
              >
                <span className="animate-pulse">≫</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer/Bottom spacing */}
        <div className="w-full text-center py-4 text-[10px] text-slate-400 dark:text-[#484f58] border-t border-slate-200 dark:border-[#30363d]/30 mt-auto transition-all duration-500">
          © 2024 Eduspace. All rights reserved.
        </div>
      </div>

      {/* COMPLETE DETAILED SITE FOOTER (Populated with Landing Page Footer Details) */}
      <footer className="hidden md:block bg-[#010409] border-t border-[#30363d] py-12 md:py-16 px-6 lg:px-16 text-sm font-normal text-[#8b949e] selection:bg-[#1f6feb]/30">
        
        {/* Upper Columns and Information Area */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-12">
          
          {/* Column 1: Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg overflow-hidden border border-white/20">
                <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-cover" width="32" height="32" />
              </div>
              <span className="text-lg font-semibold text-white dark:text-white">
                Eduspace
              </span>
            </div>
            <p className="text-sm text-slate-300 dark:text-slate-400 leading-relaxed">
              Your comprehensive academic platform for seamless learning and teaching. Empowering education through technology.
            </p>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <span className="text-xs text-slate-400 dark:text-slate-400">Theme</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white dark:text-white text-base">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <a href="/#features" className="text-sm text-slate-300 dark:text-slate-400 hover:text-blue-400 transition-colors hover:underline">
                  Features
                </a>
              </li>
              <li>
                <a href="/#students" className="text-sm text-slate-300 dark:text-slate-400 hover:text-blue-400 transition-colors hover:underline">
                  For Students
                </a>
              </li>
              <li>
                <a href="/#lecturers" className="text-sm text-slate-300 dark:text-slate-400 hover:text-blue-400 transition-colors hover:underline">
                  For Lecturers
                </a>
              </li>
              <li>
                <Link to="/help" className="text-sm text-slate-300 dark:text-slate-400 hover:text-blue-400 transition-colors hover:underline">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white dark:text-white text-base">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy-policy" className="text-sm text-slate-300 dark:text-slate-400 hover:text-blue-400 transition-colors hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-sm text-slate-300 dark:text-slate-400 hover:text-blue-400 transition-colors hover:underline">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-sm text-slate-300 dark:text-slate-400 hover:text-blue-400 transition-colors hover:underline">
                  Contact Support
                </Link>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); toast.success("All systems operational"); }} className="text-sm text-slate-300 dark:text-slate-400 hover:text-blue-400 transition-colors hover:underline">
                  System Status
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Us */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white dark:text-white text-base">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-slate-300 dark:text-slate-400">
                <Mail className="size-4 mt-0.5 flex-shrink-0 text-blue-400 dark:text-blue-400" />
                <a href="mailto:eduspacelearning8@gmail.com" className="hover:text-blue-400 transition-colors break-all">
                  eduspacelearning8@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-300 dark:text-slate-400">
                <Phone className="size-4 mt-0.5 flex-shrink-0 text-blue-400 dark:text-blue-400" />
                <a href="tel:+917670895485" className="hover:text-blue-400 transition-colors">
                  +91 7670895485
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-300 dark:text-slate-400">
                <MapPin className="size-4 mt-0.5 flex-shrink-0 text-blue-400 dark:text-blue-400" />
                <span className="leading-snug">
                  1-194, Mannam Bazar, SN Padu Mandal,<br />
                  Endluru, Prakasam District,<br />
                  Andhra Pradesh - 523225, India
                </span>
              </li>
            </ul>

            {/* Social Links & Follow Us */}
            <div className="pt-2">
              <h4 className="text-sm font-semibold text-white dark:text-white mb-3">Follow Us</h4>
              <div className="flex items-center gap-3">
                <a
                  href="https://x.com/Ganeshbabu_13"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-[#161b22] border border-[#30363d] text-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
                  aria-label="Follow us on Twitter"
                >
                  <Twitter className="size-4" />
                </a>
                <a
                  href="https://www.linkedin.com/in/mannam-ganeshbabu-5a19ab291/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-[#161b22] border border-[#30363d] text-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
                  aria-label="Connect with us on LinkedIn"
                >
                  <Linkedin className="size-4" />
                </a>
                <a
                  href="https://github.com/codergangganesh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-[#161b22] border border-[#30363d] text-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
                  aria-label="View our GitHub profile"
                >
                  <Github className="size-4" />
                </a>
                
                {/* Globe Language Selector Dropdown (Aligned next to socials) */}
                <div className="relative">
                  <button 
                    onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161b22] border border-[#30363d] hover:border-[#8b949e] rounded-lg text-[#c9d1d9] hover:text-[#f0f6fc] transition-colors focus:outline-none text-xs"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>{selectedLanguage}</span>
                  </button>

                  {languageMenuOpen && (
                    <div className="absolute right-0 bottom-full mb-2 w-32 bg-[#161b22] border border-[#30363d] rounded-md shadow-lg py-1 z-50 animate-fadeIn">
                      {languages.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => handleLanguageSelect(lang)}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-[#1f6feb] hover:text-white transition-colors ${selectedLanguage === lang ? "text-[#58a6ff] font-semibold" : "text-[#c9d1d9]"}`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright, Legal & Made with heart details */}
        <div className="max-w-7xl mx-auto pt-8 border-t border-[#30363d] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#8b949e]">
          <p className="text-sm text-slate-400 dark:text-slate-400">
            © 2024 Eduspace. All rights reserved.
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-400">
            Made with ❤️ for Education
          </p>
        </div>

      </footer>
    </div>
  );
};

export default NotFound;
