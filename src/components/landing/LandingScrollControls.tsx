import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function LandingScrollControls() {
    const [isAtTop, setIsAtTop] = useState(true);
    const [isAtBottom, setIsAtBottom] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = window.innerHeight;
            
            // Higher precision for instant feedback
            const atTop = scrollTop <= 50; // A bit more room for landing
            const atBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 100;
            
            setIsAtTop(atTop);
            setIsAtBottom(atBottom);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Initial check
        handleScroll();
        
        // Observe mutations in case content changes and affects scroll height (important for lazy loading)
        const observer = new MutationObserver(handleScroll);
        observer.observe(document.body, { childList: true, subtree: true });

        // Handle window resize as well
        window.addEventListener('resize', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
            observer.disconnect();
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const scrollToBottom = () => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    };

    return (
        <TooltipProvider delayDuration={0}>
            <div className="fixed bottom-6 right-6 md:right-8 z-[100] hidden md:flex flex-col gap-3 pointer-events-none">
                {/* Up Arrow */}
                <AnimatePresence>
                    {!isAtTop && (
                        <motion.div
                            initial={{ opacity: 0, x: 20, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.8 }}
                        >
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button 
                                        onClick={scrollToTop}
                                        className="pointer-events-auto size-14 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-white/20 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-all cursor-pointer group"
                                    >
                                        <ChevronUp className="size-7 transition-transform group-hover:-translate-y-1" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="bg-slate-900 text-white border-white/10 font-bold px-3 py-1.5 text-[10px] uppercase tracking-widest">
                                    Go Top
                                </TooltipContent>
                            </Tooltip>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* Down Arrow */}
                <AnimatePresence>
                    {!isAtBottom && (
                        <motion.div
                            initial={{ opacity: 0, x: 20, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.8 }}
                        >
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button 
                                        onClick={scrollToBottom}
                                        className="pointer-events-auto size-14 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-white/20 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-all cursor-pointer group"
                                    >
                                        <ChevronDown className="size-7 transition-transform group-hover:translate-y-1" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="bg-slate-900 text-white border-white/10 font-bold px-3 py-1.5 text-[10px] uppercase tracking-widest">
                                    Go Bottom
                                </TooltipContent>
                            </Tooltip>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </TooltipProvider>
    );
}
