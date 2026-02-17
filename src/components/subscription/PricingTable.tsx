import { useState } from "react";
import { Check, Zap, Sparkles, FileUp, Brain, ShieldCheck, CreditCard, Star, Crown, Shield, ArrowRight, Loader2, Lock as LockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { createCheckoutSession, simulateWebhookSuccess, getSubscription } from "@/lib/subscriptionService";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useEffect } from "react";

interface PricingTableProps {
    onSuccess?: () => void;
    onClose?: () => void;
    isInline?: boolean;
}

export function PricingTable({ onSuccess, onClose, isInline = false }: PricingTableProps) {
    const { user, role } = useAuth();
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<string>('free');

    useEffect(() => {
        const checkSub = async () => {
            if (!user) return;
            try {
                const sub = await getSubscription(user.id);
                setCurrentPlan(sub?.plan_type || 'free');
            } catch (error) {
                console.error('Error checking subscription:', error);
            }
        };
        checkSub();
    }, [user, currentPlan]);

    const handleUpgrade = async (planType: 'pro' | 'pro_plus' = 'pro') => {
        if (!user || !user.email) {
            toast.error('You must be logged in to upgrade.');
            return;
        }
        setIsRedirecting(true);
        try {
            const url = await createCheckoutSession(user.id, user.email, planType);
            if (url) {
                window.location.href = url;
            } else {
                throw new Error("No checkout URL returned");
            }
        } catch (error: any) {
            console.error('Upgrade error:', error);
            toast.error(error.message || 'Failed to start checkout. Please try again.');
            setIsRedirecting(false);
        }
    };

    const handleSimulatePayment = async (planType: string = 'pro') => {
        if (!user || !user.email) return;
        setIsRedirecting(true);
        const loadingToast = toast.loading(`Simulating ${planType} payment...`);
        try {
            await simulateWebhookSuccess(user.id, user.email, planType);
            toast.success('Simulation successful!', { id: loadingToast });

            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error('Simulation error:', error);
            toast.error('Simulation failed. Check Supabase logs.', { id: loadingToast });
        } finally {
            setIsRedirecting(false);
        }
    };

    return (
        <div className={cn(
            "w-full mx-auto transition-all duration-500 relative",
            isInline ? "max-w-7xl px-2 sm:px-4 py-4 sm:py-12" : "max-w-5xl"
        )}>
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute -top-2 right-2 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors z-[60] md:hidden shadow-sm border border-slate-200 dark:border-slate-800"
                >
                    <X className="size-4" />
                </button>
            )}
            <div className="text-center mb-6 sm:mb-10">
                <Badge variant="outline" className="mb-2 sm:mb-4 bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-800 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-bold text-[10px] sm:text-xs">
                    UPGRADE YOUR ACCOUNT
                </Badge>
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-2 sm:mb-4">
                    Unlock <span className="text-indigo-600">AI Powers</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium text-sm sm:text-lg px-4 italic">
                    Start creating professional AI-generated quizzes in seconds.
                </p>
            </div>

            {/* Horizontal Scroll logic for mobile, Grid for desktop */}
            <div className="flex overflow-x-auto pb-4 md:pb-0 md:grid md:grid-cols-3 gap-4 sm:gap-8 items-stretch px-4 md:px-0 md:py-10 snap-x snap-mandatory no-scrollbar h-full">
                {/* FREE PLAN */}
                <Card className={cn(
                    "min-w-[280px] sm:min-w-0 snap-center group relative border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col shadow-lg transition-all h-full",
                    role === 'student' && "md:col-start-2"
                )}>
                    <CardContent className="p-6 sm:p-8 lg:p-10 flex-1 flex flex-col h-full">
                        <div className="md:min-h-[140px]">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 mb-6">
                                <Star className="size-5 sm:size-6" />
                            </div>
                            <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Student</h3>
                            <div className="flex items-baseline mt-2">
                                <span className="text-2xl sm:text-4xl font-black italic text-slate-900 dark:text-white">₹0</span>
                                <span className="text-slate-400 font-bold ml-1 text-xs sm:text-base">/mo</span>
                            </div>
                        </div>
                        <div className="h-px w-full bg-slate-100 dark:bg-slate-800 my-6" />
                        <ul className="space-y-4 mb-8 flex-1 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
                            <li className="flex items-center gap-3"><Check className="size-4 sm:size-5 text-emerald-500 shrink-0" /> Manual Quiz Creation</li>
                            <li className="flex items-center gap-3"><Check className="size-4 sm:size-5 text-emerald-500 shrink-0" /> Basic AI Assistance</li>
                            <li className="flex items-center gap-3 opacity-40"><LockIcon className="size-4 sm:size-5 shrink-0" /> 5 AI Quizzes / month</li>
                        </ul>
                        <div className="mt-auto">
                            <Button variant="outline" disabled className="h-12 sm:h-16 w-full rounded-xl sm:rounded-2xl border-slate-200 dark:border-slate-800 font-bold text-slate-400 bg-transparent text-sm sm:text-base">
                                Current Plan
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {role !== 'student' && (
                    <>
                        {/* PRO PLAN */}
                        <Card className="min-w-[280px] sm:min-w-0 snap-center group relative border-2 sm:border-4 border-indigo-600 bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl scale-100 md:scale-110 z-10 transition-transform h-full">
                            <div className="absolute top-0 inset-x-0 h-1.5 sm:h-2 bg-indigo-600" />
                            <div className="absolute top-4 right-4">
                                <Badge className="bg-indigo-600 text-white border-none font-black px-3 py-1 rounded-full shadow-lg shadow-indigo-600/20 text-[8px] sm:text-[10px] tracking-widest uppercase animate-pulse">
                                    MOST POPULAR
                                </Badge>
                            </div>
                            <CardContent className="p-6 sm:p-8 lg:p-10 flex-1 flex flex-col h-full">
                                <div className="md:min-h-[140px]">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner shrink-0 mb-6">
                                        <Zap className="size-6 sm:size-8 fill-current" />
                                    </div>
                                    <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Pro Access</h3>
                                    <div className="flex items-baseline mt-2">
                                        <span className="text-3xl sm:text-5xl font-black text-indigo-600">₹399</span>
                                        <span className="text-slate-400 font-bold ml-1 text-xs sm:text-base">/mo</span>
                                    </div>
                                </div>
                                <div className="h-px w-full bg-slate-100 dark:bg-slate-800 my-6" />
                                <ul className="space-y-4 mb-8 flex-1 text-xs sm:text-base font-bold text-slate-700 dark:text-slate-200">
                                    <li className="flex items-start gap-4"><Zap className="size-3 sm:size-4 text-indigo-500 fill-current mt-1" /> 50 AI Quizzes / month</li>
                                    <li className="flex items-start gap-4"><FileUp className="size-3 sm:size-4 text-indigo-500 mt-1" /> 30 PDF Uploads</li>
                                    <li className="flex items-start gap-4"><Brain className="size-3 sm:size-4 text-indigo-500 mt-1" /> 24/7 Support</li>
                                </ul>
                                <div className="space-y-3 mt-auto">
                                    <Button
                                        onClick={() => handleUpgrade('pro')}
                                        disabled={isRedirecting}
                                        className="h-14 sm:h-16 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm sm:text-lg rounded-xl sm:rounded-[1.25rem] shadow-xl shadow-indigo-600/30 transition-all active:scale-95 group flex items-center justify-center gap-3"
                                    >
                                        {isRedirecting ? <Loader2 className="animate-spin size-5 sm:size-6" /> : <Sparkles className="size-5 sm:size-6 fill-current" />}
                                        Upgrade
                                    </Button>
                                    <button
                                        onClick={() => handleSimulatePayment('pro')}
                                        disabled={isRedirecting}
                                        className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Shield className="size-3" />
                                        Test Payment
                                    </button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* PRO PLUS PLAN */}
                        <Card className="min-w-[280px] sm:min-w-0 snap-center group relative border border-slate-200 dark:border-slate-800 bg-slate-950 dark:bg-black text-white rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden flex flex-col shadow-xl transition-all h-full">
                            <CardContent className="p-6 sm:p-8 lg:p-10 flex-1 flex flex-col h-full">
                                <div className="md:min-h-[140px]">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner shrink-0 mb-6">
                                        <Crown className="size-6 sm:size-7 fill-current" />
                                    </div>
                                    <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white">Pro Plus</h3>
                                    <div className="flex items-baseline mt-2">
                                        <span className="text-2xl sm:text-4xl font-black text-amber-500">₹999</span>
                                        <span className="text-slate-500 font-bold ml-1 text-xs sm:text-base">/mo</span>
                                    </div>
                                </div>
                                <div className="h-px w-full bg-white/10 my-6" />
                                <ul className="space-y-4 mb-8 flex-1 text-xs sm:text-sm font-semibold text-slate-300">
                                    <li className="flex items-center gap-3"><Check className="size-4 sm:size-5 text-amber-500 shrink-0" /> Everything in Pro</li>
                                    <li className="flex items-center gap-3"><Sparkles className="size-4 sm:size-5 text-amber-500 fill-current shrink-0" /> Unlimited AI Quizzes</li>
                                    <li className="flex items-center gap-3"><CreditCard className="size-4 sm:size-5 text-amber-500 shrink-0" /> Early Access</li>
                                </ul>
                                <div className="space-y-3 mt-auto">
                                    <Button
                                        onClick={() => handleUpgrade('pro_plus')}
                                        disabled={isRedirecting}
                                        className="h-12 sm:h-16 w-full bg-amber-500 hover:bg-amber-600 text-black font-black text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        {isRedirecting ? <Loader2 className="animate-spin size-4 sm:size-5" /> : <Zap className="size-4 sm:size-5 fill-current" />}
                                        Get Elite
                                    </Button>
                                    <button
                                        onClick={() => handleSimulatePayment('pro_plus')}
                                        disabled={isRedirecting}
                                        className="w-full text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/40 hover:text-amber-500 transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <Shield className="size-3" />
                                        Test Plus
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}
