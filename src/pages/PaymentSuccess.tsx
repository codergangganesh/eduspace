import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="max-w-md w-full shadow-2xl border-none bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
                    <CardHeader className="text-center pb-2">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-emerald-500/10 rounded-full dark:bg-emerald-500/20">
                                <CheckCircle2 className="size-12 text-emerald-500" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                            Payment Successful!
                        </CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400">
                            Thank you for upgrading to Eduspace Premium.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4 text-center">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-2 text-left">
                                <Sparkles className="size-5 text-indigo-500" />
                                <span className="font-semibold text-sm">Now unlocked:</span>
                            </div>
                            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 text-left list-disc pl-5">
                                <li>Unlimited AI Quiz Generation</li>
                                <li>PDF-to-Quiz Conversion</li>
                                <li>Advanced Analytics & Trends</li>
                                <li>Priority Support</li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={() => navigate('/dashboard')}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl group"
                            >
                                Go to Dashboard
                                <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                Session ID: {sessionId?.substring(0, 15)}...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
