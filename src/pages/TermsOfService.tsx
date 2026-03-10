import { motion } from "framer-motion";
import { FileText, Terminal, CheckCircle2, AlertCircle } from "lucide-react";
import SEO from "@/components/SEO";
import { LegalHeader } from "@/components/layout/LegalHeader";
import { LegalFooter } from "@/components/layout/LegalFooter";

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <LegalHeader />
            <SEO
                title="Terms of Service"
                description="EduSpace Terms of Service - A simple guide to the rules for using our platform."
                keywords={["Terms of Service", "Conditions of Use", "Legal Terms", "EduSpace"]}
            />

            <main className="max-w-4xl mx-auto py-16 px-6 md:px-12 flex-grow">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <header className="mb-12 border-b border-border/50 pb-8">
                        <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-4 text-center sm:text-left">Terms of Service</h1>
                        <p className="text-muted-foreground text-lg italic text-center sm:text-left">Last Updated: March 10, 2026</p>
                    </header>

                    <div className="space-y-16">
                        {/* Intro Section */}
                        <section>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <FileText className="size-6 text-primary" />
                                Simple Rules for Success
                            </h2>
                            <p className="text-muted-foreground leading-relaxed text-lg">
                                Welcome to Eduspace! These terms are the "rules of the road" for our platform. By signing up, you agree to follow these simple guidelines to keep Eduspace a great place for everyone to learn.
                            </p>
                        </section>

                        {/* Acceptance Section */}
                        <section className="bg-primary/5 p-8 rounded-3xl border border-primary/10">
                            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                <CheckCircle2 className="size-5 text-primary" />
                                The Bottom Line
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                When you create an account, you're telling us that you've read these rules and agree to play by them. If you don't agree, please don't use the app. It's as simple as that!
                            </p>
                        </section>

                        {/* Section 1: Account */}
                        <section className="pt-8 border-t border-border/50">
                            <h3 className="text-xl font-bold mb-4">1. Your account</h3>
                            <div className="space-y-4 text-muted-foreground leading-relaxed">
                                <p>To use Eduspace, you need to create an account. Here is what we expect:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li><strong className="text-foreground text-base">Be Honest:</strong> Use your real name and correct role (Student or Teacher).</li>
                                    <li><strong className="text-foreground text-base">Stay Safe:</strong> Don't share your password with anyone else. You're responsible for everything that happens on your account.</li>
                                    <li><strong className="text-foreground text-base">One Account:</strong> Please don't create multiple accounts or use someone else's.</li>
                                </ul>
                            </div>
                        </section>

                        {/* Section 2: Conduct */}
                        <section className="pt-8 border-t border-border/50">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                                <AlertCircle className="size-5 text-primary" />
                                2. How to behave
                            </h3>
                            <p className="text-muted-foreground mb-4 text-base">We want Eduspace to be a friendly and helpful place. You agree not to:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 rounded-xl border border-border/50 bg-secondary/10">
                                    <p className="text-sm leading-relaxed">Don't be mean, bully others, or post inappropriate content.</p>
                                </div>
                                <div className="p-5 rounded-xl border border-border/50 bg-secondary/10">
                                    <p className="text-sm leading-relaxed">Don't try to hack the platform or break our systems.</p>
                                </div>
                                <div className="p-5 rounded-xl border border-border/50 bg-secondary/10">
                                    <p className="text-sm leading-relaxed">Don't use bots or scripts to copy our content or quizzes.</p>
                                </div>
                                <div className="p-5 rounded-xl border border-border/50 bg-secondary/10">
                                    <p className="text-sm leading-relaxed">Don't spam other users with unwanted messages.</p>
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Ownership */}
                        <section className="pt-8 border-t border-border/50">
                            <h3 className="text-xl font-bold mb-4">3. Who owns what</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                You own the content you create (like your assignments). Eduspace owns the app itself, including the design, code, and features we've built for you. Please don't copy our work without asking!
                            </p>
                        </section>

                        {/* Section 4: Responsibility */}
                        <section className="pt-8 border-t border-border/50">
                            <h3 className="text-xl font-bold mb-4">4. Our responsibility</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                We work hard to make Eduspace perfect, but we can't guarantee it will never have a glitch. We aren't responsible for any loss of data if something unexpected happens, though we'll always do our best to fix it.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </main>
            <LegalFooter />
        </div>
    );
};

export default TermsOfService;
