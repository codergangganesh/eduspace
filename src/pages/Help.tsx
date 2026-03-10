import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
    HelpCircle,
    MessageSquare,
    Book,
    Mail,
    ShieldQuestion,
    ChevronRight,
    LifeBuoy,
    Sparkles,
    Layout,
    Smile
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEO from "@/components/SEO";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedback } from "@/hooks/useFeedback";
import { ContactSupportDialog } from "@/components/support/ContactSupportDialog";

export default function HelpPage() {
    const [supportOpen, setSupportOpen] = useState(false);
    const { setShowPrompt } = useFeedback();
    const navigate = useNavigate();
    const { role } = useAuth();

    const faqs = [
        {
            question: "How do I track my study streak?",
            answer: "Your streak is automatically tracked when you perform academic actions like submitting assignments, taking quizzes, or participating in class feeds. You can view your current streak on the Dashboard or the dedicated Streak page."
        },
        {
            question: "How can I invite other students?",
            answer: "If you are a lecturer or have permission, you can use the 'Invite' button in the top navigation bar to send invitation links via email."
        },
        {
            question: "Is there a mobile app available?",
            answer: "EduSpace is a Progressive Web App (PWA). You can install it on your home screen directly from your browser on both iOS and Android for a native app-like experience."
        },
        {
            question: "How do I use the AI Chat?",
            answer: "Click on the 'AI Chat' option in the sidebar or use the Alt + J shortcut. You can ask the AI questions about your courses, assignments, or general academic topics."
        }
    ];

    return (
        <DashboardLayout>
            <SEO
                title="Help Center"
                description="Get support and find answers to your questions about EduSpace."
            />

            <div className="max-w-4xl mx-auto space-y-12 pb-12">
                {/* Hero Section */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-2">
                        <LifeBuoy className="size-8" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        How can we help you?
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Browse our frequently asked questions or connect with our support team.
                    </p>
                </div>

                {/* Support Channels Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card
                        onClick={() => window.location.href = '#faqs'}
                        className="group hover:border-primary/40 transition-all cursor-pointer border-border/40 bg-surface/50 backdrop-blur-sm overflow-hidden"
                    >
                        <CardContent className="p-6 space-y-4">
                            <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                <Book className="size-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Quick Tutorials</h3>
                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                    Learn how to use EduSpace features with our step-by-step guides.
                                </p>
                            </div>
                            <div className="flex items-center text-xs font-semibold text-primary pt-2">
                                VIEW FAQS <ChevronRight className="size-3 ml-1" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        onClick={() => navigate(role === 'lecturer' ? '/lecturer-dashboard?test_tour=true' : '/dashboard?test_tour=true')}
                        className="group hover:border-purple-500/40 transition-all cursor-pointer border-border/40 bg-surface/50 backdrop-blur-sm overflow-hidden"
                    >
                        <CardContent className="p-6 space-y-4">
                            <div className="size-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                                <Layout className="size-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">App Tour</h3>
                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                    Take a guided tour of the EduSpace platform and core features.
                                </p>
                            </div>
                            <div className="flex items-center text-xs font-semibold text-primary pt-2">
                                START TOUR <ChevronRight className="size-3 ml-1" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card
                        onClick={() => setShowPrompt(true)}
                        className="group hover:border-emerald-500/40 transition-all cursor-pointer border-border/40 bg-surface/50 backdrop-blur-sm overflow-hidden"
                    >
                        <CardContent className="p-6 space-y-4">
                            <div className="size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                <Smile className="size-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Send Feedback</h3>
                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                    Have a suggestion? Let our team know how we can improve.
                                </p>
                            </div>
                            <div className="flex items-center text-xs font-semibold text-primary pt-2">
                                GIVE FEEDBACK <ChevronRight className="size-3 ml-1" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* FAQs Section */}
                <div id="faqs" className="space-y-6 scroll-mt-24">
                    <div className="flex items-center gap-2 px-1">
                        <ShieldQuestion className="size-5 text-primary" />
                        <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {faqs.map((faq, i) => (
                            <Card key={i} className="border-border/40 bg-surface/30 backdrop-blur-sm">
                                <CardContent className="p-5 space-y-2">
                                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                                        <span className="text-primary/40 font-mono text-sm">Q.</span>
                                        {faq.question}
                                    </h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                                        {faq.answer}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Footer Section */}
                <div className="rounded-3xl bg-primary p-12 text-primary-foreground flex flex-col items-center text-center space-y-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 size-60 rounded-full bg-white/10 blur-3xl opacity-50" />
                    <div className="absolute bottom-0 left-0 -ml-10 -mb-10 size-60 rounded-full bg-black/10 blur-3xl opacity-30" />

                    <div className="space-y-3 relative z-10">
                        <h2 className="text-3xl font-bold">Still need help?</h2>
                        <p className="text-primary-foreground/80 max-w-md text-lg">
                            Our support community is active 24/7 to help you with any further questions.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 relative z-10">
                        <Button
                            variant="secondary"
                            size="lg"
                            className="rounded-xl font-bold px-8 shadow-lg hover:scale-105 transition-transform"
                            onClick={() => setSupportOpen(true)}
                        >
                            Contact Support
                        </Button>
                    </div>
                </div>
            </div>

            <ContactSupportDialog
                open={supportOpen}
                onOpenChange={setSupportOpen}
            />
        </DashboardLayout>
    );
}
