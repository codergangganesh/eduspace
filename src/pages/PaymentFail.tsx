import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PaymentFail() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="max-w-md w-full shadow-2xl border-none bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-rose-400 to-red-500" />
                    <CardHeader className="text-center pb-2">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-rose-500/10 rounded-full dark:bg-rose-500/20">
                                <XCircle className="size-12 text-rose-500" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                            Payment Failed
                        </CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400">
                            We couldn't process your payment. Please try again.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4 text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Don't worry, you haven't been charged. This might be due to an expired card, insufficient funds, or a temporary connection issue.
                        </p>

                        <div className="space-y-3 pt-4">
                            <Button
                                onClick={() => navigate(-2)} // Go back to where they started payment
                                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-bold h-12 rounded-xl"
                            >
                                <RefreshCw className="mr-2 size-4" />
                                Try Again
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/dashboard')}
                                className="w-full h-12 rounded-xl group"
                            >
                                <ArrowLeft className="mr-2 size-4 group-hover:-translate-x-1 transition-transform" />
                                Back to Dashboard
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
