import { Link } from "react-router-dom";
import { Shield, Gavel, Mail, MapPin, Phone, Github, Twitter, Linkedin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function LegalFooter() {
    return (
        <footer className="w-full bg-[#0A0A0A] text-white pt-24 pb-12 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand & Mission */}
                    <div className="md:col-span-2 space-y-6">
                        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity w-fit">
                            <div className="size-10 rounded-xl overflow-hidden bg-white p-1 shadow-sm">
                                <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-contain" />
                            </div>
                            <span className="text-2xl font-black tracking-tight text-white">Eduspace</span>
                        </Link>
                        <p className="text-white/50 text-lg leading-relaxed max-w-md">
                            Revolutionizing the academic experience with secure, AI-powered tools for students and educators worldwide.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="https://github.com/codergangganesh" target="_blank" rel="noopener noreferrer" className="size-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/5 group">
                                <Github className="size-5 text-white/40 group-hover:text-white transition-colors" />
                            </a>
                            <a href="https://x.com/Ganeshbabu_13" target="_blank" rel="noopener noreferrer" className="size-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/5 group">
                                <Twitter className="size-5 text-white/40 group-hover:text-white transition-colors" />
                            </a>
                            <a href="https://www.linkedin.com/in/mannam-ganeshbabu-5a19ab291/" target="_blank" rel="noopener noreferrer" className="size-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/5 group">
                                <Linkedin className="size-5 text-white/40 group-hover:text-white transition-colors" />
                            </a>
                        </div>
                    </div>

                    {/* Legal Links */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-white/40">Legal & Transparency</h4>
                        <ul className="space-y-4">
                            <li>
                                <Link to="/privacy-policy" className="text-white/60 hover:text-white flex items-center gap-2 transition-colors">
                                    <Shield className="size-4" /> Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms-of-service" className="text-white/60 hover:text-white flex items-center gap-2 transition-colors">
                                    <Gavel className="size-4" /> Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-white/40">Official Contact</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <Mail className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                                <span className="text-white/60 text-sm">eduspacelearning8@gmail.com</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Phone className="size-5 text-blue-400 shrink-0 mt-0.5" />
                                <span className="text-white/60 text-sm">+91 7670895485</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin className="size-5 text-purple-400 shrink-0 mt-0.5" />
                                <span className="text-white/60 text-xs leading-relaxed">
                                    1-194, Mannam Bazar, SN Padu Mandal, Endluru, Prakasam District, Andhra Pradesh - 523225, India
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                <Separator className="bg-white/5 mb-12" />

                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-white/30 text-sm font-medium">
                        © 2026 Eduspace Academy. All rights reserved.
                    </p>
                    <div className="flex items-center gap-8">
                        <Link to="#" className="text-white/30 hover:text-white text-xs transition-colors">Security</Link>
                        <Link to="#" className="text-white/30 hover:text-white text-xs transition-colors">Compliance</Link>
                        <Link to="#" className="text-white/30 hover:text-white text-xs transition-colors">Report Abuse</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
