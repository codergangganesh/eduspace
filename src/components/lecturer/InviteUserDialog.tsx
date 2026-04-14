import { useState } from "react";
import { Mail, Send, Loader2, X } from "lucide-react";
import { Drawer } from "vaul";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface InviteUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lecturerName: string;
    lecturerEmail: string;
}

export function InviteUserDialog({
    open,
    onOpenChange,
    lecturerName,
    lecturerEmail,
}: InviteUserDialogProps) {
    const [email, setEmail] = useState("");
    const [personalMessage, setPersonalMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const isMobile = useIsMobile();

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error("Please enter an email address");
            return;
        }

        if (!validateEmail(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        setIsLoading(true);

        try {
            console.log("📧 Sending invitation email...");

            // refresh session to ensure we have a valid token
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session) {
                console.error("Session Error:", sessionError);
                toast.error("Authentication error: Please sign in again.");
                return;
            }

            console.log("Session present, token length:", session.access_token.length);

            const { data, error } = await supabase.functions.invoke("send-invitation-email", {
                body: {
                    inviteeEmail: email,
                    lecturerName,
                    lecturerEmail,
                    personalMessage: personalMessage.trim() || undefined,
                },
            });

            console.log("🔍 Function Response:", data);

            if (error || (data && !data.success)) {
                console.error("❌ Failed to send invitation:", error);
                if (data) console.error("Function data:", data);

                // Check if it's our debug "Unauthorized" message
                if (data?.error?.includes("Unauthorized")) {
                    toast.error("Authentication Error: Please sign out and sign in again.");
                } else {
                    toast.error(data?.error || "Failed to send invitation. Please try again.");
                }
                return;
            }

            console.log("✅ Invitation sent successfully:", data);
            toast.success(`Invitation sent to ${email}!`);

            // Reset form and close dialog
            setEmail("");
            setPersonalMessage("");
            onOpenChange(false);
        } catch (err) {
            console.error("Error sending invitation:", err);
            toast.error("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setEmail("");
            setPersonalMessage("");
            onOpenChange(false);
        }
    };

    const renderForm = () => (
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Email Input */}
            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email Address <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                    <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pr-10 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-slate-200/50 dark:border-slate-700/50 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] rounded-xl"
                        disabled={isLoading}
                        required
                        autoFocus
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                        <Mail className="size-5" />
                    </div>
                </div>
            </div>

            {/* Personal Message (Optional) */}
            <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-foreground">
                    Personal Message <span className="text-muted-foreground text-xs">(Optional)</span>
                </label>
                <Textarea
                    id="message"
                    placeholder="Add a personal note to your invitation..."
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    className="min-h-[100px] resize-none bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-slate-200/50 dark:border-slate-700/50 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.06),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] dark:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.05)] rounded-xl"
                    disabled={isLoading}
                    maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                    {personalMessage.length}/500
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="flex-1 rounded-xl shadow-[3px_3px_6px_rgba(0,0,0,0.08),-3px_-3px_6px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(255,255,255,0.05),inset_1px_1px_2px_rgba(255,255,255,0.1)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15)] active:scale-95"
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 rounded-xl bg-gradient-to-br from-primary to-primary/90 shadow-[4px_4px_8px_rgba(0,0,0,0.15),inset_2px_2px_4px_rgba(255,255,255,0.3)] hover:shadow-[6px_6px_12px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.4)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.25)] active:scale-95">
                    {isLoading ? (
                        <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Send className="size-4 mr-2" />
                            Send Invitation
                        </>
                    )}
                </Button>
            </div>
        </form>
    );

    if (isMobile) {
        return (
            <Drawer.Root open={open} onOpenChange={onOpenChange}>
                <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-[2px]" />
                    <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[10001] flex flex-col bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-t-[2rem] outline-none max-h-[92vh] shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.9),inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(0,0,0,0.05)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.35),-8px_-8px_16px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 cursor-grab rounded-full bg-border mt-4 mb-2" />
                        <div className="p-6 overflow-y-auto">
                            <div className="mb-6">
                                {/* Header with Logo */}
                                <div className="flex items-start gap-4">
                                    {/* Logo */}
                                    <div className="size-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0 border border-primary/20 shadow-[4px_4px_8px_rgba(0,0,0,0.08),-4px_-4px_8px_rgba(255,255,255,0.9),inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(0,0,0,0.05)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.15)]">
                                        <img src="/favicon.png" alt="Eduspace" className="size-8 object-contain" />
                                    </div>
                                    
                                    {/* Title and Description */}
                                    <div className="space-y-1 flex-1">
                                        <Drawer.Title className="text-2xl font-black text-foreground tracking-tight">Invite User</Drawer.Title>
                                        <Drawer.Description className="text-muted-foreground text-sm font-medium mt-1">
                                            Send an invitation email to join Eduspace.
                                        </Drawer.Description>
                                    </div>
                                </div>
                            </div>
                            {renderForm()}
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        );
    }

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-6 pointer-events-none">
                    {/* Backdrop for Desktop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={cn(
                            "border pointer-events-auto overflow-hidden",
                            "bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800",
                            "border-slate-200/50 dark:border-slate-700/50",
                            "shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.9),inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(0,0,0,0.05)]",
                            "dark:shadow-[8px_8px_16px_rgba(0,0,0,0.35),-8px_-8px_16px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]",
                            "relative w-full max-w-md rounded-[2rem] p-8"
                        )}
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-muted-foreground shadow-[2px_2px_4px_rgba(0,0,0,0.08),-2px_-2px_4px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.05),inset_1px_1px_2px_rgba(255,255,255,0.1)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15)] active:scale-95"
                        >
                            <X className="size-5" />
                        </button>

                        {/* Content */}
                        <div className="space-y-6">
                            {/* Header with Logo */}
                            <div className="flex items-start gap-4">
                                {/* Logo */}
                                <div className="size-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0 border border-primary/20 shadow-[4px_4px_8px_rgba(0,0,0,0.08),-4px_-4px_8px_rgba(255,255,255,0.9),inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(0,0,0,0.05)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.15)]">
                                    <img src="/favicon.png" alt="Eduspace" className="size-8 object-contain" />
                                </div>
                                
                                {/* Title and Description */}
                                <div className="space-y-1 flex-1">
                                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                                        Invite User to Eduspace
                                    </h2>
                                    <p className="text-muted-foreground text-sm">
                                        Send an invitation email to invite someone to join the Eduspace platform.
                                    </p>
                                </div>
                            </div>

                            {renderForm()}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
