import { motion } from "framer-motion";
import { Shield, Mail, Lock, UserCheck } from "lucide-react";
import SEO from "@/components/SEO";
import { LegalHeader } from "@/components/layout/LegalHeader";
import { LegalFooter } from "@/components/layout/LegalFooter";

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <LegalHeader />
            <SEO
                title="Privacy Policy"
                description="EduSpace Privacy Policy - Learn how we collect, use, and protect your personal data in simple terms."
                keywords={["Privacy Policy", "Data Protection", "Privacy", "EduSpace"]}
            />

            <main className="max-w-4xl mx-auto py-16 px-6 md:px-12 flex-grow">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <header className="mb-12 border-b border-border/50 pb-8">
                        <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-4 text-center sm:text-left">Privacy Policy</h1>
                        <p className="text-muted-foreground text-lg italic text-center sm:text-left">Last Updated: March 10, 2026</p>
                    </header>

                    <div className="space-y-16">
                        {/* Section 1: Intro */}
                        <section>
                            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-3">
                                <Shield className="size-6 text-primary" />
                                Our Privacy Promise
                            </h2>
                            <p className="text-muted-foreground leading-relaxed text-lg">
                                At Eduspace, we value your trust. This policy explains what happens to your info when you use our platform. We keep things simple and clear—no confusing legal jargon.
                            </p>
                        </section>

                        {/* Section 2: Info We Collect */}
                        <section className="pt-8 border-t border-border/50">
                            <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-3">
                                <Mail className="size-5 text-primary" />
                                1. What information we collect
                            </h3>
                            <p className="text-muted-foreground mb-4">We only collect what we really need to make the platform work for you:</p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <li className="bg-secondary/20 p-4 rounded-xl border border-border/50">
                                    <strong className="block text-foreground mb-1 text-base">Account Info</strong>
                                    <span className="text-sm text-muted-foreground leading-relaxed">Your name, email, and whether you're a student or teacher.</span>
                                </li>
                                <li className="bg-secondary/20 p-4 rounded-xl border border-border/50">
                                    <strong className="block text-foreground mb-1 text-base">Your Content</strong>
                                    <span className="text-sm text-muted-foreground leading-relaxed">Quizzes you create, assignments you submit, and messages you send.</span>
                                </li>
                                <li className="bg-secondary/20 p-4 rounded-xl border border-border/50">
                                    <strong className="block text-foreground mb-1 text-base">Login Tools</strong>
                                    <span className="text-sm text-muted-foreground leading-relaxed">If you use Google or GitHub to log in, we get your profile picture and email from them.</span>
                                </li>
                                <li className="bg-secondary/20 p-4 rounded-xl border border-border/50">
                                    <strong className="block text-foreground mb-1 text-base">App Usage</strong>
                                    <span className="text-sm text-muted-foreground leading-relaxed">We track things like which features you use most to help improve the app.</span>
                                </li>
                            </ul>
                        </section>

                        {/* Section 3: Why we use it */}
                        <section className="pt-8 border-t border-border/50">
                            <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-3">
                                <UserCheck className="size-5 text-primary" />
                                2. Why we collect this info
                            </h3>
                            <div className="space-y-3 text-muted-foreground leading-relaxed">
                                <p>We use your information for 3 main reasons:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li><strong className="text-foreground">To make it work:</strong> Keeping your classes organized and grades safe.</li>
                                    <li><strong className="text-foreground">To keep you safe:</strong> Making sure nobody else logs into your account.</li>
                                    <li><strong className="text-foreground">To help you out:</strong> Sending you updates about your classes and helping when you have questions.</li>
                                </ul>
                            </div>
                        </section>

                        {/* Section 4: Security */}
                        <section className="pt-8 border-t border-border/50 bg-primary/5 p-8 rounded-[2rem] border border-primary/20">
                            <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-3">
                                <Lock className="size-5 text-primary" />
                                3. Keeping your data safe
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                We treat your data with extreme care. We use industry-standard encryption (like high-tech digital locks) to protect your quizzes and grades. We don't sell your data to anyone, ever.
                            </p>
                        </section>

                        {/* Section 5: Rights */}
                        <section className="pt-8 border-t border-border/50">
                            <h3 className="text-xl font-bold mb-4 text-foreground">4. Your control</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                You are in charge of your data. You can always update your profile, change your password, or delete your account whenever you want. If you need help, just ask!
                            </p>
                        </section>
                    </div>
                </motion.div>
            </main>
            <LegalFooter />
        </div>
    );
};

export default PrivacyPolicy;
