import {
    TrendingUp,
    Users,
    Shield,
    Award,
    Clock,
    Zap
} from "lucide-react";

export function BenefitsSection() {
    return (
        <section className="py-24 lg:py-40 bg-transparent dark:bg-slate-900/50">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
                <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
                    {/* Left - Visual (Matched to Hero Style) */}
                    <div className="w-full lg:w-1/2 relative order-last lg:order-first">
                        <div className="relative z-10 bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 dark:border-slate-700 p-8">
                            {/* Stats Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-white dark:text-white">Platform Growth</h3>
                                    <p className="text-sm text-slate-300 dark:text-slate-400">Weekly Activity</p>
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-medium">
                                    <TrendingUp className="size-4" />
                                    +24.5%
                                </div>
                            </div>

                            {/* Custom Graph Visualization */}
                            <div className="h-48 mb-8 relative w-full group overflow-hidden">
                                {/* Grid Lines */}
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="w-full h-px bg-slate-100 dark:bg-slate-700/50" />
                                    ))}
                                </div>

                                {/* SVG Graph */}
                                <svg className="w-full h-full overflow-visible relative z-10" viewBox="0 0 400 200" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                        </linearGradient>
                                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                            <feMerge>
                                                <feMergeNode in="coloredBlur" />
                                                <feMergeNode in="SourceGraphic" />
                                            </feMerge>
                                        </filter>
                                    </defs>

                                    {/* Area Fill */}
                                    <path
                                        d="M0,160 C50,140 80,160 120,100 C160,40 200,80 240,60 C280,40 320,100 400,20 V200 H0 Z"
                                        fill="url(#curveGradient)"
                                        className="transition-all duration-1000 ease-out origin-bottom scale-y-90 group-hover:scale-y-100"
                                    />

                                    {/* Main Line with Glow */}
                                    <path
                                        d="M0,160 C50,140 80,160 120,100 C160,40 200,80 240,60 C280,40 320,100 400,20"
                                        fill="none"
                                        stroke="#2563eb"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        className="dark:stroke-blue-400 transition-all duration-1000 ease-out origin-bottom scale-y-90 group-hover:scale-y-100"
                                        filter="url(#glow)"
                                    />

                                    {/* Animated Data Points */}
                                    {[
                                        { cx: 120, cy: 100 },
                                        { cx: 240, cy: 60 },
                                        { cx: 400, cy: 20 }
                                    ].map((point, i) => (
                                        <circle
                                            key={i}
                                            cx={point.cx}
                                            cy={point.cy}
                                            r="4"
                                            className="fill-white stroke-blue-600 dark:stroke-blue-400 stroke-2 transition-all duration-1000 ease-out origin-bottom scale-y-90 group-hover:scale-y-100"
                                        />
                                    ))}
                                </svg>

                                {/* Hover Indicator Line (Visual Polish) */}
                                <div className="absolute top-0 bottom-0 w-px bg-blue-500/20 left-[60%] hidden group-hover:block backdrop-blur-sm" />
                            </div>

                            {/* Floating Stat Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            <Users className="size-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-200 dark:text-slate-400">Users</span>
                                    </div>
                                    <div className="text-2xl font-bold text-white dark:text-white">50k+</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                            <Shield className="size-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-200 dark:text-slate-400">Security</span>
                                    </div>
                                    <div className="text-2xl font-bold text-white dark:text-white">100%</div>
                                </div>
                            </div>
                        </div>

                        {/* Decorative Blur */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-sm max-h-sm bg-blue-500/20 rounded-full blur-3xl -z-10" />
                    </div>

                    {/* Right - Content */}
                    <div className="w-full lg:w-1/2">
                        <div className="mb-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
                                <Award className="size-4" />
                                Why Eduspace
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-bold text-white dark:text-white mb-6 leading-tight">
                                Everything you need to run your institution efficiently
                            </h2>
                            <p className="text-lg text-slate-200 dark:text-slate-400 leading-relaxed">
                                We've streamlined every aspect of educational management so you can focus on teaching and learning.
                            </p>
                        </div>

                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="flex items-center justify-center size-12 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                                        <Clock className="size-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white dark:text-white mb-2">Save Valuable Time</h3>
                                    <p className="text-slate-200 dark:text-slate-400 leading-relaxed">
                                        Automate attendance, grading, and reporting. Decrease administrative workload by up to 70%.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="flex items-center justify-center size-12 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                                        <TrendingUp className="size-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white dark:text-white mb-2">Data-Driven Insights</h3>
                                    <p className="text-slate-200 dark:text-slate-400 leading-relaxed">
                                        Get real-time analytics on student performance and engagement to identify areas for improvement.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="flex items-center justify-center size-12 rounded-xl bg-green-100 dark:bg-green-900/30">
                                        <Zap className="size-6 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white dark:text-white mb-2">Seamless Experience</h3>
                                    <p className="text-slate-200 dark:text-slate-400 leading-relaxed">
                                        A modern, lightning-fast interface that works perfectly on any device, anywhere, anytime.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
