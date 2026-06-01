import { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Plus, Minus, HelpCircle, Square, Triangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { RainbowButton } from "@/components/ui/rainbow-borders-button";

const faqs = [
    {
        question: "Is EduSpace free for students?",
        answer: "Yes, the basic version of EduSpace is completely free for students. You can join classes, track your grades, and submit assignments at no cost."
    },
    {
        question: "How do I create a class as a lecturer?",
        answer: "Once you log in as a lecturer, you'll see a 'Create Class' button on your dashboard. Simply fill in the details, and you'll get a unique join code to share with your students."
    },
    {
        question: "Can I use EduSpace on my phone?",
        answer: "Absolutely! EduSpace is fully responsive and works perfectly on mobile browsers. We also offer a desktop-like experience for tablets and laptops."
    },
    {
        question: "Is my academic data secure?",
        answer: "Security is our top priority. We use industry-standard encryption to protect your records, and your data is never shared with third parties without your permission."
    },
    {
        question: "Does EduSpace support AI-powered learning?",
        answer: "Yes! We have integrated AI coaches and smart analytics that help you identify your strengths and weaknesses in real-time."
    }
];

interface FAQSectionProps {
    onContactSupport?: () => void;
}

export function FAQSection({ onContactSupport }: FAQSectionProps = {}) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="py-24 lg:py-40 relative bg-slate-950 overflow-hidden">
            <style dangerouslySetInnerHTML={{
                __html: `
                .faq-rainbow-card {
                  position: relative;
                  background: transparent;
                }
                .faq-rainbow-card::before,
                .faq-rainbow-card::after {
                  content: '';
                  position: absolute;
                  left: 0;
                  top: 0;
                  border-radius: 16px;
                  background: linear-gradient(90deg, #fb0094, #0000ff, #00ff00, #ffff00, #ff0000, #fb0094);
                  background-size: 200% auto;
                  width: 100%;
                  height: 100%;
                  z-index: -1;
                  animation: rainbow-flow 6s linear infinite;
                  opacity: 0.15;
                  transition: opacity 0.3s;
                }
                .faq-rainbow-card::after {
                  filter: blur(15px);
                  opacity: 0.05;
                }
                .faq-rainbow-card:hover::before,
                .faq-rainbow-card.is-open::before {
                  opacity: 0.90;
                }
                .faq-rainbow-card:hover::after,
                .faq-rainbow-card.is-open::after {
                  opacity: 0.60;
                }
                @keyframes rainbow-flow {
                  0% { background-position: 0% center; }
                  100% { background-position: 200% center; }
                }
            `}} />
            {/* Background Decorations matching landing page */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
                <motion.div
                    animate={{ rotate: 360, y: [0, -20, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[10%] -left-20 text-blue-500/5"
                >
                    <Square size={400} strokeWidth={1} />
                </motion.div>
                <motion.div
                    animate={{ rotate: -360, y: [0, 20, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[20%] -right-20 text-indigo-500/5"
                >
                    <Triangle size={300} strokeWidth={1} />
                </motion.div>
            </div>

            <div className="max-w-[1200px] mx-auto px-6">
                <div className="text-center space-y-4 mb-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 text-blue-400 text-sm font-black uppercase tracking-widest"
                    >
                        FAQ
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl lg:text-7xl font-black text-white leading-tight tracking-tight"
                    >
                        Common Questions <br />
                        <span className="text-blue-500">Answered.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed"
                    >
                        Find answers to the most common questions about the EduSpace platform.
                    </motion.p>
                </div>

                <div className="grid gap-6 max-w-4xl mx-auto pb-20">
                    {faqs.map((faq, index) => (
                        <FAQStackCard
                            key={index}
                            faq={faq}
                            index={index}
                            isOpen={activeIndex === index}
                            onToggle={() => setActiveIndex(activeIndex === index ? null : index)}
                        />
                    ))}
                </div>

                {/* Reusable Rainbow Button CTA block at the bottom */}
                <div className="flex flex-col items-center justify-center pt-10 text-center space-y-4 relative z-10">
                    <p className="text-slate-400 text-sm font-medium">Still have questions?</p>
                    <RainbowButton onClick={onContactSupport}>
                        Contact Support
                    </RainbowButton>
                </div>
            </div>
        </section>
    );
}

function FAQStackCard({
    faq,
    index,
    isOpen,
    onToggle
}: {
    faq: typeof faqs[0];
    index: number;
    isOpen: boolean;
    onToggle: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={cn(
                "w-full rounded-2xl faq-rainbow-card p-[1px] transition-all duration-300",
                isOpen ? "is-open shadow-lg shadow-blue-500/10" : "shadow-md"
            )}
        >
            <div className="w-full rounded-[15px] overflow-hidden bg-slate-950/95 backdrop-blur-xl">
                <button
                    onClick={onToggle}
                    className="w-full flex items-center justify-between p-6 lg:p-8 text-left outline-none group"
                >
                    <div className="flex items-center gap-6">
                        <div className={cn(
                            "flex-shrink-0 size-10 rounded-xl flex items-center justify-center font-bold text-lg border transition-all duration-300",
                            isOpen ? "bg-blue-600 border-blue-600 text-white" : "bg-white/5 border-white/10 text-slate-500 group-hover:bg-white/10 group-hover:text-white"
                        )}>
                            {index + 1}
                        </div>
                        <span className={cn(
                            "text-lg lg:text-2xl font-bold transition-colors duration-300 leading-tight tracking-tight",
                            isOpen ? "text-white" : "text-slate-300 group-hover:text-white"
                        )}>
                            {faq.question}
                        </span>
                    </div>

                    <div className={cn(
                        "flex-shrink-0 size-10 rounded-full flex items-center justify-center transition-all duration-500",
                        isOpen ? "bg-blue-600 text-white rotate-90" : "bg-white/5 text-slate-500 group-hover:text-white"
                    )}>
                        {isOpen ? <Minus className="size-5" /> : <Plus className="size-5" />}
                    </div>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            <div className="px-8 pb-8 pt-0 text-base lg:text-lg text-slate-400 font-medium leading-relaxed">
                                <div className="h-px w-full bg-white/5 mb-6" />
                                {faq.answer}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
