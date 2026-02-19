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
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-12 lg:p-16 text-white">
                    <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                        Ready to Transform Your Educational Experience?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Join thousands of students and lecturers already using Eduspace to achieve their goals
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            onClick={() => onOpenRoleSelection(true)}
                            className="bg-white text-blue-600 hover:bg-blue-50 gap-2 px-8"
                        >
                            Get Started Free
                            <ArrowRight className="size-5" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => onOpenHelp(true)}
                            className="border-white text-white hover:bg-white/10 px-8"
                        >
                            Learn More
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
