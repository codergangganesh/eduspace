import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Check,
    Lock,
    Zap,
    Sparkles,
    ArrowRight,
    Loader2,
    Shield,
    FileUp,
    Brain,
    ShieldCheck,
    CreditCard
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createCheckoutSession, getSubscription, simulateWebhookSuccess } from "@/lib/subscriptionService";
import { toast } from "sonner";

interface SubscriptionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SubscriptionModal({ open, onOpenChange }: SubscriptionModalProps) {
    const { user } = useAuth();
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<string>('free');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSubscription = async () => {
            if (!user) return;
            try {
                const sub = await getSubscription(user.id);
                setIsPremium(sub?.status === 'active' || sub?.plan_type === 'pro' || sub?.plan_type === 'pro_plus');
                setCurrentPlan(sub?.plan_type || 'free');
            } catch (error) {
                console.error('Error checking subscription:', error);
            } finally {
                setLoading(false);
            }
        };

        if (open) {
            checkSubscription();
        }
    }, [user, open]);

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

            // Re-check subscription status
            const sub = await getSubscription(user.id);
            setIsPremium(sub?.status === 'active' || sub?.plan_type === 'pro' || sub?.plan_type === 'pro_plus');
            setCurrentPlan(sub?.plan_type || 'free');

            if (sub?.status === 'active') {
                toast.success(`${planType.toUpperCase()} features unlocked!`);
                onOpenChange(false);
            }
        } catch (error: any) {
            console.error('Simulation error:', error);
            toast.error('Simulation failed. Check Supabase logs.', { id: loadingToast });
        } finally {
            setIsRedirecting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl p-0 overflow-hidden border-none bg-transparent shadow-none">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* FREE PLAN */}
                    <Card className="border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2rem] overflow-hidden flex flex-col shadow-xl">
                        <CardContent className="p-8 flex-1 flex flex-col">
                            <div className="mb-8">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold px-3 py-1 mb-4 text-xs">Student</Badge>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Free</h3>
                                <div className="flex items-baseline mt-2">
                                    <span className="text-3xl font-black italic">₹0</span>
                                    <span className="text-slate-400 font-bold ml-1">/mo</span>
                                </div>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                                <li className="flex items-center gap-2"><Check className="size-4 text-emerald-500" /> Manual Quiz Creation</li>
                                <li className="flex items-center gap-2"><Check className="size-4 text-emerald-500" /> Basic AI Assistance</li>
                                <li className="flex items-center gap-2 opacity-40"><Lock className="size-4" /> 5 AI Quizzes / month</li>
                                <li className="flex items-center gap-2 opacity-40"><Lock className="size-4" /> Limited PDF Size</li>
                            </ul>
                            <Button variant="outline" disabled className="h-14 w-full rounded-2xl border-slate-200 dark:border-slate-800 font-bold text-slate-400">
                                {currentPlan === 'free' ? "Current Plan" : "Basic Access"}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* PRO PLAN */}
                    <Card className="border-4 border-indigo-600 bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl relative z-10 scale-105">
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-indigo-600" />
                        <div className="absolute top-4 right-4">
                            <Badge className="bg-indigo-600 text-white border-none font-black px-3 py-1 animate-pulse text-[10px]">RELEVANT</Badge>
                        </div>
                        <CardContent className="p-8 flex-1 flex flex-col">
                            <div className="mb-8">
                                <Badge className="bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border-none font-bold px-3 py-1 mb-4 text-xs">Growth</Badge>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Pro Access</h3>
                                <div className="flex items-baseline mt-2">
                                    <span className="text-4xl font-black text-indigo-600">₹399</span>
                                    <span className="text-slate-400 font-bold ml-1">/mo</span>
                                </div>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1 text-sm font-bold text-slate-700 dark:text-slate-200">
                                <li className="flex items-center gap-3"><Zap className="size-5 text-indigo-500 fill-current" /> 50 AI Quizzes / month</li>
                                <li className="flex items-center gap-3"><FileUp className="size-5 text-indigo-500" /> Unlimited PDF Uploads</li>
                                <li className="flex items-center gap-3"><Brain className="size-5 text-indigo-500" /> Premium AI Models</li>
                                <li className="flex items-center gap-3"><ShieldCheck className="size-5 text-indigo-500" /> Priority Support</li>
                            </ul>
                            <Button
                                onClick={() => handleUpgrade('pro')}
                                disabled={isRedirecting || currentPlan === 'pro' || currentPlan === 'pro_plus'}
                                className="h-16 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-600/20 group mb-3 transition-all active:scale-95"
                            >
                                {isRedirecting ? <Loader2 className="animate-spin mr-2" /> : currentPlan === 'pro' || currentPlan === 'pro_plus' ? <ShieldCheck className="mr-2 size-5 fill-current" /> : <Sparkles className="mr-2 size-5 fill-current" />}
                                {currentPlan === 'pro' ? "Active Plan" : currentPlan === 'pro_plus' ? "Included" : "Get Pro"}
                            </Button>

                            {!isPremium && (
                                <button
                                    onClick={() => handleSimulatePayment('pro')}
                                    disabled={isRedirecting}
                                    className="w-full text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1.5 py-1"
                                >
                                    <Shield className="size-3" />
                                    Test Sub (Pro)
                                </button>
                            )}
                        </CardContent>
                    </Card>

                    {/* PRO PLUS PLAN */}
                    <Card className="border border-slate-200 dark:border-slate-800 bg-black text-white rounded-[2rem] overflow-hidden flex flex-col shadow-xl">
                        <CardContent className="p-8 flex-1 flex flex-col">
                            <div className="mb-8">
                                <Badge className="bg-amber-500 text-black border-none font-bold px-3 py-1 mb-4 text-xs">ELITE</Badge>
                                <h3 className="text-2xl font-black uppercase tracking-tight">Pro Plus</h3>
                                <div className="flex items-baseline mt-2">
                                    <span className="text-3xl font-black text-amber-500">₹999</span>
                                    <span className="text-slate-500 font-bold ml-1">/mo</span>
                                </div>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1 text-sm font-medium text-slate-300">
                                <li className="flex items-center gap-3"><Check className="size-5 text-amber-500" /> Everything in Pro</li>
                                <li className="flex items-center gap-3"><Sparkles className="size-5 text-amber-500 fill-current" /> Unlimited AI Quizzes</li>
                                <li className="flex items-center gap-3"><Zap className="size-5 text-amber-500 fill-current" /> Unlimited Course Generation</li>
                                <li className="flex items-center gap-3"><CreditCard className="size-5 text-amber-500" /> Early Access Features</li>
                            </ul>
                            <Button
                                onClick={() => handleUpgrade('pro_plus')}
                                disabled={isRedirecting || currentPlan === 'pro_plus'}
                                className="h-14 w-full bg-amber-500 hover:bg-amber-600 text-black font-black text-lg rounded-2xl shadow-xl shadow-amber-500/20 group mb-3 transition-all active:scale-95 border-none"
                            >
                                {isRedirecting ? <Loader2 className="animate-spin mr-2" /> : currentPlan === 'pro_plus' ? <ShieldCheck className="mr-2 size-5 fill-current" /> : <Zap className="mr-2 size-5 fill-current" />}
                                {currentPlan === 'pro_plus' ? "Active Elite" : "Get Pro Plus"}
                            </Button>

                            {currentPlan !== 'pro_plus' && (
                                <button
                                    onClick={() => handleSimulatePayment('pro_plus')}
                                    disabled={isRedirecting}
                                    className="w-full text-[10px] font-black uppercase tracking-widest text-amber-400/60 hover:text-amber-400 transition-colors flex items-center justify-center gap-1.5 py-1"
                                >
                                    <Shield className="size-3" />
                                    Test Sub (Plus)
                                </button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}
