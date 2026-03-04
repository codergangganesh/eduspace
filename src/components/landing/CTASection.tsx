import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CTASectionProps {
    onOpenRoleSelection: (open: boolean) => void;
    onOpenHelp: (open: boolean) => void;
}

export function CTASection({ onOpenRoleSelection, onOpenHelp }: CTASectionProps) {
    return (
        <section className="py-20 lg:py-32">
            <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
                <div className="bg-transparent dark:bg-slate-900/50 rounded-3xl p-12 lg:p-16 relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-lg bg-blue-500/10 blur-[100px] -z-10 rounded-full" />
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-white dark:text-white">
                        Ready to Transform Your Educational Experience?
                    </h2>
                    <p className="text-xl text-slate-200 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
                        Join thousands of students and lecturers already using Eduspace to achieve their goals
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                        <Button
                            size="lg"
                            onClick={() => onOpenRoleSelection(true)}
                            className="bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all gap-2 px-8 shadow-xl shadow-blue-500/20 forced-colors:bg-blue-600"
                        >
                            Get Started Free
                            <ArrowRight className="size-5" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => onOpenHelp(true)}
                            className="bg-transparent border-white/30 text-white hover:bg-white hover:text-blue-600 hover:scale-105 active:scale-95 transition-all px-8 shadow-lg"
                        >
                            Learn More
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
