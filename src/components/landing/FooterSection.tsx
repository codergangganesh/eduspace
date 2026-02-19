import {
    Mail,
    Phone,
    MapPin,
    Twitter,
    Linkedin,
    Github
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface FooterSectionProps {
    onOpenPrivacy: (open: boolean) => void;
    onOpenTerms: (open: boolean) => void;
    onOpenContact: (open: boolean) => void;
    onOpenHelp: (open: boolean) => void;
}

export function FooterSection({ onOpenPrivacy, onOpenTerms, onOpenContact, onOpenHelp }: FooterSectionProps) {
    return (
        <footer className="bg-white/10 dark:bg-slate-900/90 backdrop-blur-lg border-t border-white/10 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="size-8 rounded-lg overflow-hidden border border-white/20">
                                <img src="/favicon.png" alt="Eduspace Academy Logo" className="size-full object-cover" width="32" height="32" />
                            </div>
                            <span className="text-lg font-semibold text-white dark:text-white">
                                Eduspace
                            </span>
                        </div>
                        <p className="text-sm text-slate-200 dark:text-slate-400">
                            Your comprehensive academic platform for seamless learning and teaching. Empowering education through technology.
                        </p>
                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <span className="text-xs text-slate-300 dark:text-slate-400">Theme</span>
                        </div>
                    </div>

                    {/* Quick Links Column */}
                    <div>
                        <h3 className="font-semibold text-white dark:text-white mb-4">Quick Links</h3>
                        <ul className="space-y-3">
                            <li>
                                <a href="#features" className="text-sm text-slate-200 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    Features
                                </a>
                            </li>
                            <li>
                                <a href="#students" className="text-sm text-slate-200 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    For Students
                                </a>
                            </li>
                            <li>
                                <a href="#lecturers" className="text-sm text-slate-200 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    For Lecturers
                                </a>
                            </li>
                            <li>
                                <button
                                    onClick={() => onOpenHelp(true)}
                                    className="text-sm text-slate-200 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    Help Center
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Legal Column */}
                    <div>
                        <h3 className="font-semibold text-white dark:text-white mb-4">Legal</h3>
                        <ul className="space-y-3">
                            <li>
                                <button
                                    onClick={() => onOpenPrivacy(true)}
                                    className="text-sm text-slate-200 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    Privacy Policy
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => onOpenTerms(true)}
                                    className="text-sm text-slate-200 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    Terms of Service
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => onOpenContact(true)}
                                    className="text-sm text-slate-200 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    Contact Support
                                </button>
                            </li>
                            <li>
                                <a href="#" className="text-sm text-slate-200 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    System Status
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Column */}
                    <div>
                        <h3 className="font-semibold text-white dark:text-white mb-4">Contact Us</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2 text-sm text-slate-200 dark:text-slate-400">
                                <Mail className="size-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                                <a href="mailto:eduspacelearning8@gmail.com" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors" aria-label="Email us at eduspacelearning8@gmail.com">
                                    eduspacelearning8@gmail.com
                                </a>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-200 dark:text-slate-400">
                                <Phone className="size-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                                <a href="tel:+917670895485" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors" aria-label="Call us at +91 7670895485">
                                    +91 7670895485
                                </a>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-slate-200 dark:text-slate-400">
                                <MapPin className="size-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                <span>
                                    1-194, Mannam Bazar, SN Padu Mandal,<br />
                                    Endluru, Prakasam District,<br />
                                    Andhra Pradesh - 523225, India
                                </span>
                            </li>
                        </ul>

                        {/* Social Links */}
                        <div className="mt-6">
                            <h4 className="text-sm font-semibold text-white dark:text-white mb-3">Follow Us</h4>
                            <div className="flex items-center gap-3">
                                <a
                                    href="https://x.com/Ganeshbabu_13"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-200 dark:text-slate-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-colors"
                                    aria-label="Follow us on Twitter"
                                >
                                    <Twitter className="size-4" />
                                </a>
                                <a
                                    href="https://www.linkedin.com/in/mannam-ganeshbabu-5a19ab291/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-200 dark:text-slate-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-colors"
                                    aria-label="Connect with us on LinkedIn"
                                >
                                    <Linkedin className="size-4" />
                                </a>
                                <a
                                    href="https://github.com/codergangganesh"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-200 dark:text-slate-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-colors"
                                    aria-label="View our GitHub profile"
                                >
                                    <Github className="size-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-slate-300 dark:text-slate-400">
                            © 2024 Eduspace. All rights reserved.
                        </p>
                        <p className="text-sm text-slate-300 dark:text-slate-400">
                            Made with ❤️ for Education
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
