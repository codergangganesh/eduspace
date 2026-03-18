import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    ChevronDown,
    BookOpen,
    ClipboardList,
    LineChart,
    MessageSquare,
    LifeBuoy,
    Shield,
    Gavel,
    ExternalLink,
    Menu,
} from "lucide-react";
import { useState } from "react";
import { RoleSelectionDialog } from "@/components/auth/RoleSelectionDialog";
import { HelpCenterDialog } from "@/components/support/HelpCenterDialog";
import { ContactSupportDialog } from "@/components/support/ContactSupportDialog";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type MobileNavItem = {
    label: string;
    path: string;
};

export function LegalHeader() {
    const [showRoleDialog, setShowRoleDialog] = useState(false);
    const [roleMode, setRoleMode] = useState<"login" | "register">("login");
    const { isAuthenticated } = useAuth();
    const [showHelpDialog, setShowHelpDialog] = useState(false);
    const [showContactDialog, setShowContactDialog] = useState(false);

    const openRoleDialog = (mode: "login" | "register") => {
        setRoleMode(mode);
        setShowRoleDialog(true);
    };

    return (
        <>
            <RoleSelectionDialog
                open={showRoleDialog}
                onOpenChange={setShowRoleDialog}
                mode={roleMode}
            />
            <HelpCenterDialog
                open={showHelpDialog}
                onOpenChange={setShowHelpDialog}
            />
            <ContactSupportDialog
                open={showContactDialog}
                onOpenChange={setShowContactDialog}
            />
            <header className="w-full bg-black text-white px-4 lg:px-8 py-3 sticky top-0 z-50 border-b border-white/10">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                            <div className="size-8 rounded-lg overflow-hidden bg-white p-0.5 shadow-sm">
                                <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-contain" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white">Eduspace</span>
                        </Link>

                        {/* Desktop Nav Items */}
                        <nav className="hidden lg:flex items-center gap-4">
                            {/* Product Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="text-sm font-medium text-white/70 hover:text-white flex items-center gap-1 transition-colors outline-none pb-0.5 border-b border-transparent hover:border-white/20">
                                        Product <ChevronDown className="size-3.5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-80 p-3 bg-[#1C1C1C] border-white/10 text-white translate-y-1">
                                    <DropdownMenuLabel className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 px-2">Core Features</DropdownMenuLabel>
                                    <div className="grid gap-1">
                                        <DropdownMenuItem
                                            onClick={() => openRoleDialog("login")}
                                            className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5"
                                        >
                                            <div className="size-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border-none">
                                                <BookOpen className="size-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold mb-0.5">Exams & Quizzes</div>
                                                <div className="text-xs text-white/50 leading-relaxed">Secure online testing with AI monitoring.</div>
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => openRoleDialog("login")}
                                            className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5"
                                        >
                                            <div className="size-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border-none">
                                                <ClipboardList className="size-5 text-emerald-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold mb-0.5">Assignments</div>
                                                <div className="text-xs text-white/50 leading-relaxed">Submit work and track feedback easily.</div>
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => openRoleDialog("login")}
                                            className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5"
                                        >
                                            <div className="size-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 border-none">
                                                <LineChart className="size-5 text-orange-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold mb-0.5">GPA Tracker</div>
                                                <div className="text-xs text-white/50 leading-relaxed">Monitor your academic performance.</div>
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => openRoleDialog("login")}
                                            className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5"
                                        >
                                            <div className="size-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 border-none">
                                                <MessageSquare className="size-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold mb-0.5">Class Chat</div>
                                                <div className="text-xs text-white/50 leading-relaxed">Collaborate with peers in real-time.</div>
                                            </div>
                                        </DropdownMenuItem>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Resources Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="text-sm font-medium text-white/70 hover:text-white flex items-center gap-1 transition-colors outline-none pb-0.5 border-b border-transparent hover:border-white/20">
                                        Resources <ChevronDown className="size-3.5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64 p-2 bg-[#1C1C1C] border-white/10 text-white translate-y-1">
                                    <DropdownMenuItem
                                        onClick={() => setShowHelpDialog(true)}
                                        className="flex items-center gap-3 p-2.5 rounded-md hover:bg-white/5 transition-colors cursor-pointer border-none"
                                    >
                                        <LifeBuoy className="size-4 text-white/60" />
                                        <span className="text-sm font-medium">Help Center</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/5 my-1" />
                                    <DropdownMenuItem asChild>
                                        <Link to="/privacy-policy" className="flex items-center gap-3 p-2.5 rounded-md hover:bg-white/5 transition-colors border-none">
                                            <Shield className="size-4 text-white/60" />
                                            <span className="text-sm font-medium">Privacy Policy</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to="/terms-of-service" className="flex items-center gap-3 p-2.5 rounded-md hover:bg-white/5 transition-colors border-none">
                                            <Gavel className="size-4 text-white/60" />
                                            <span className="text-sm font-medium">Terms of Service</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <button
                                onClick={() => setShowContactDialog(true)}
                                className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-1 hover:border-b hover:border-white/20 pb-0.5 outline-none"
                            >
                                Support <ExternalLink className="size-3 text-white/40" />
                            </button>
                        </nav>
                    </div>

                    {/* Action Buttons & Mobile Menu */}
                    <div className="flex items-center gap-3">
                        {!isAuthenticated && (
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={() => openRoleDialog("login")}
                                    className="hidden lg:inline-flex text-white hover:bg-white/10 text-sm font-bold tracking-tight"
                                >
                                    Sign in
                                </Button>
                                <Button
                                    onClick={() => openRoleDialog("register")}
                                    className="hidden lg:inline-flex bg-[#3ECF8E] hover:bg-[#34b27b] text-black font-black text-sm px-5 h-9 rounded-md transition-all active:scale-95 shadow-lg shadow-[#3ECF8E]/20"
                                >
                                    Join EduSpace
                                </Button>
                            </>
                        )}

                        {/* Mobile Navigation Drawer */}
                        <div className="lg:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <button className="p-2 -mr-2 text-white/70 hover:text-white transition-colors outline-none">
                                        <Menu className="size-7" />
                                    </button>
                                </SheetTrigger>
                                <SheetContent
                                    side="right"
                                    className="w-full sm:max-w-md bg-[#0A0A0A] border-l border-white/10 p-0 flex flex-col pt-[calc(1.5rem+var(--safe-top,0px))]"
                                >
                                    {/* Logo & Close Branding Header */}
                                    <div className="px-6 pb-6 border-b border-white/5">
                                        <Link to="/" className="flex items-center gap-2.5">
                                            <div className="size-8 rounded-lg overflow-hidden bg-white p-0.5 shadow-sm">
                                                <img src="/favicon.png" alt="Eduspace Logo" className="size-full object-contain" />
                                            </div>
                                            <span className="text-xl font-bold tracking-tight text-white">Eduspace</span>
                                        </Link>
                                    </div>

                                    {/* Navigation List */}
                                    <div className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
                                        <div className="space-y-2">
                                            <MobileNavLink
                                                title="Product"
                                                items={[
                                                    { label: "Exams & Quizzes", description: "Secure online testing with AI monitoring", icon: BookOpen },
                                                    { label: "Assignments", description: "Submit work and track feedback easily", icon: ClipboardList },
                                                    { label: "GPA Tracker", description: "Monitor your academic performance", icon: LineChart },
                                                    { label: "Class Chat", description: "Collaborate with peers in real-time", icon: MessageSquare },
                                                ]}
                                                onClickItem={() => openRoleDialog("login")}
                                            />
                                            <MobileNavLink
                                                title="Resources"
                                                items={[
                                                    { label: "Help Center", icon: LifeBuoy, action: () => setShowHelpDialog(true) },
                                                    { label: "Privacy Policy", icon: Shield, link: "/privacy-policy" },
                                                    { label: "Terms of Service", icon: Gavel, link: "/terms-of-service" },
                                                ]}
                                            />
                                            <button
                                                onClick={() => setShowContactDialog(true)}
                                                className="w-full px-4 py-4 text-lg font-bold text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all text-left flex items-center justify-between group"
                                            >
                                                Support
                                                <ExternalLink className="size-4 text-white/20 group-hover:text-white/40 transition-colors" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Action Buttons at Bottom */}
                                    {!isAuthenticated && (
                                        <div className="p-6 pb-12 bg-[#0C0C0C] border-t border-white/5 grid grid-cols-2 gap-3">
                                            <Button
                                                onClick={() => openRoleDialog("login")}
                                                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold h-11 rounded-xl transition-all text-xs"
                                            >
                                                Sign in
                                            </Button>
                                            <Button
                                                onClick={() => openRoleDialog("register")}
                                                className="w-full bg-[#3ECF8E] hover:bg-[#34b27b] text-black font-black h-11 rounded-xl transition-all shadow-xl shadow-[#3ECF8E]/10 text-xs"
                                            >
                                                Start for Free
                                            </Button>
                                        </div>
                                    )}
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
}

// Helper component for mobile nav items with accordion effect
function MobileNavLink({ title, items, onClickItem }: { title: string; items: MobileNavItem[]; onClickItem?: () => void }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="w-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-4 text-lg font-bold text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all text-left flex items-center justify-between group"
            >
                {title}
                <ChevronDown className={cn("size-5 text-white/20 group-hover:text-white/40 transition-transform duration-300", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="px-2 pb-4 space-y-1">
                            {items.map((item, idx) => {
                                const Content = (
                                    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors group">
                                        <div className="size-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-white/10 group-hover:bg-white/10 transition-colors">
                                            <item.icon className="size-5 text-white/60 group-hover:text-white transition-colors" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white/90 group-hover:text-white mb-0.5">{item.label}</div>
                                            {item.description && (
                                                <div className="text-xs text-white/40 leading-relaxed font-medium">{item.description}</div>
                                            )}
                                        </div>
                                    </div>
                                );

                                if (item.link) {
                                    return (
                                        <Link key={idx} to={item.link} className="block">
                                            {Content}
                                        </Link>
                                    );
                                }

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            if (item.action) item.action();
                                            else if (onClickItem) onClickItem();
                                        }}
                                        className="cursor-pointer"
                                    >
                                        {Content}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
