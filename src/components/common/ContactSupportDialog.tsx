import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, X, MessageSquare, Headset } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ContactSupportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ContactSupportDialog({ open, onOpenChange }: ContactSupportDialogProps) {
    const { profile } = useAuth();
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke("contact-support", {
                body: {
                    name: profile?.full_name || "Unknown User",
                    email: profile?.email || "No email",
                    subject: subject,
                    message: message,
                },
            });

            if (error) throw error;

            if (data && !data.success) {
                throw new Error(data.error || "Failed to send support request");
            }

            toast.success("Support request sent successfully!");
            setSubject("");
            setMessage("");
            onOpenChange(false);
        } catch (error) {
            console.error("Error sending support request:", error);
            toast.error("Failed to send support request. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 md:p-6 pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onOpenChange(false)}
                        className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto"
                    />

                    {/* Modal / Bottom Sheet */}
                    <motion.div
                        initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 }}
                        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
                        exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={cn(
                            "bg-surface border border-border shadow-2xl pointer-events-auto overflow-hidden",
                            isMobile
                                ? "fixed bottom-0 left-0 right-0 rounded-t-[2.5rem] p-6 pb-12 pt-8"
                                : "relative w-full max-w-md rounded-2xl p-8"
                        )}
                    >
                        {/* Drag Handle for Mobile */}
                        {isMobile && (
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted-foreground/20 rounded-full" />
                        )}

                        {/* Close Button */}
                        <button
                            onClick={() => onOpenChange(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground"
                        >
                            <X className="size-5" />
                        </button>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                    <Headset className="size-6 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                                        Contact Support
                                    </h2>
                                    <p className="text-muted-foreground text-xs leading-relaxed">
                                        Send us a message and we'll get back to you soon.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Subject</Label>
                                    <Input
                                        id="subject"
                                        placeholder="What is this regarding?"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        disabled={isLoading}
                                        className="h-12 bg-secondary/30 border-border focus:ring-primary/20 focus:border-primary rounded-xl"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Message</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Describe your issue or question..."
                                        className="min-h-[120px] bg-secondary/30 border-border focus:ring-primary/20 focus:border-primary resize-none p-4 rounded-xl"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        disabled={isLoading}
                                        required
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => onOpenChange(false)}
                                        disabled={isLoading}
                                        className="h-12 rounded-xl text-sm font-semibold flex-1 sm:flex-none"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={isLoading}
                                        className="h-12 rounded-xl text-sm font-semibold flex-1 shadow-lg shadow-primary/20 transition-all hover:shadow-xl active:scale-95 gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="size-4" />
                                                Send Message
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
