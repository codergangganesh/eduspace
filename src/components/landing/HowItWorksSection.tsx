import { Zap } from "lucide-react";

export function HowItWorksSection() {
    return (
        <section className="py-24 lg:py-40">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-medium mb-4">
                        <Zap className="size-4" />
                        Simple Process
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-bold text-white dark:text-white mb-4">
                        Get Started in Minutes
                    </h2>
                    <p className="text-lg text-slate-200 dark:text-slate-400 max-w-2xl mx-auto">
                        Three simple steps to transform your educational experience
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Step 1 */}
                    <div className="relative">
                        <div className="bg-white/10 dark:bg-slate-800/90 backdrop-blur-md p-8 rounded-2xl border border-white/10 dark:border-slate-700 text-center shadow-lg hover:shadow-xl transition-all">
                            <div className="inline-flex items-center justify-center size-16 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-2xl font-bold mb-6">
                                1
                            </div>
                            <h3 className="text-xl font-bold text-white dark:text-white mb-3">
                                Create Your Account
                            </h3>
                            <p className="text-slate-200 dark:text-slate-400">
                                Sign up as a student or lecturer in seconds. Choose your role and get started immediately.
                            </p>
                        </div>
                        <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600" />
                    </div>

                    {/* Step 2 */}
                    <div className="relative">
                        <div className="bg-white/10 dark:bg-slate-800/90 backdrop-blur-md p-8 rounded-2xl border border-white/10 dark:border-slate-700 text-center shadow-lg hover:shadow-xl transition-all">
                            <div className="inline-flex items-center justify-center size-16 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-2xl font-bold mb-6">
                                2
                            </div>
                            <h3 className="text-xl font-bold text-white dark:text-white mb-3">
                                Set Up Your Workspace
                            </h3>
                            <p className="text-slate-200 dark:text-slate-400">
                                Join classes, create courses, and customize your dashboard to fit your needs.
                            </p>
                        </div>
                        <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-purple-600 to-green-600" />
                    </div>

                    {/* Step 3 */}
                    <div className="bg-white/10 dark:bg-slate-800/90 backdrop-blur-md p-8 rounded-2xl border border-white/10 dark:border-slate-700 text-center shadow-lg hover:shadow-xl transition-all">
                        <div className="inline-flex items-center justify-center size-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-2xl font-bold mb-6">
                            3
                        </div>
                        <h3 className="text-xl font-bold text-white dark:text-white mb-3">
                            Start Achieving
                        </h3>
                        <p className="text-slate-200 dark:text-slate-400">
                            Track progress, submit assignments, and watch your academic success grow.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
