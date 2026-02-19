import { Star } from "lucide-react";

export function TestimonialsSection() {
    return (
        <section className="py-24 lg:py-40 bg-transparent dark:bg-slate-900/50 overflow-hidden">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-sm font-medium mb-4">
                        <Star className="size-4" />
                        Testimonials
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-bold text-white dark:text-white mb-4">
                        What Our Users Say
                    </h2>
                    <p className="text-lg text-slate-200 dark:text-slate-400 max-w-2xl mx-auto">
                        Real experiences from students and lecturers using Eduspace
                    </p>
                </div>

                {/* Horizontal Scrolling Container */}
                <div className="relative w-full overflow-hidden mask-gradient-x">
                    {/* Gradient Masks */}
                    <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-100 dark:from-slate-900 to-transparent z-10" />
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-100 dark:from-slate-900 to-transparent z-10" />

                    <div className="flex w-max gap-6 animate-scroll hover:[animation-play-state:paused] will-change-transform gpu-accelerated">
                        {[...Array(2)].map((_, setIndex) => (
                            <div key={setIndex} className="flex gap-6">
                                {[
                                    { name: "Sarah Kumar", role: "Computer Science Student", initials: "SK", gradient: "from-blue-600 to-purple-600", quote: "This platform has completely transformed how I manage my coursework. The analytics feature helps me identify areas where I need to improve." },
                                    { name: "Dr. Robert Chen", role: "Mathematics Professor", initials: "DR", gradient: "from-green-600 to-blue-600", quote: "As a lecturer, this tool saves me hours every week. Grading and feedback are now streamlined, and I can focus more on teaching." },
                                    { name: "Maria Patel", role: "Engineering Student", initials: "MP", gradient: "from-purple-600 to-pink-600", quote: "The real-time notifications ensure I never miss a deadline. My GPA has improved significantly since I started using this platform!" },
                                    { name: "James Lee", role: "Business Student", initials: "JL", gradient: "from-orange-600 to-red-600", quote: "The assignment submission process is so smooth. I love how I can track all my submissions and grades in one place." },
                                    { name: "Prof. Emily Wilson", role: "History Department", initials: "EW", gradient: "from-teal-600 to-cyan-600", quote: "Creating and managing multiple classes has never been easier. The interface is intuitive and my students love it too!" },
                                    { name: "Alex Nguyen", role: "Design Student", initials: "AN", gradient: "from-indigo-600 to-blue-600", quote: "The collaboration features are fantastic. I can easily communicate with my classmates and work on group projects seamlessly." },
                                    { name: "Dr. Lisa Thompson", role: "Chemistry Professor", initials: "LT", gradient: "from-pink-600 to-rose-600", quote: "The grade export feature is a lifesaver at the end of each semester. Everything is organized and ready to submit to administration." },
                                    { name: "Rachel Kim", role: "Biology Student", initials: "RK", gradient: "from-amber-600 to-yellow-600", quote: "I appreciate how the platform keeps me organized. The calendar integration and deadline reminders are incredibly helpful." },
                                    { name: "Prof. Michael Singh", role: "Physics Department", initials: "MS", gradient: "from-violet-600 to-purple-600", quote: "The analytics dashboard gives me valuable insights into my students' performance. I can identify struggling students early and provide support." },
                                    { name: "David Martinez", role: "Economics Student", initials: "DM", gradient: "from-emerald-600 to-green-600", quote: "Best academic platform I've used! The mobile app works perfectly, so I can check my grades and assignments on the go." }
                                ].map((testimonial, index) => (
                                    <div key={index} className="flex-shrink-0 w-[350px] bg-white/10 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 dark:border-slate-700 snap-start shadow-sm hover:shadow-md transition-all">
                                        <div className="flex gap-1 mb-4">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="size-4 fill-yellow-500 text-yellow-500" />
                                            ))}
                                        </div>
                                        <p className="text-slate-200 dark:text-slate-400 mb-4 text-sm leading-relaxed">
                                            "{testimonial.quote}"
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <div className={`size-10 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                                                {testimonial.initials}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-white dark:text-white text-sm">{testimonial.name}</div>
                                                <div className="text-xs text-slate-300 dark:text-slate-400">{testimonial.role}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
