import { useState } from "react";
import { Mail, Send, Loader2 } from "lucide-react";
import { Drawer } from "vaul";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
                        className="pr-10"
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
                    className="min-h-[100px] resize-none"
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
                    className="flex-1"
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
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
                    <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[10001] flex flex-col bg-surface rounded-t-[32px] outline-none max-h-[92vh]">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 cursor-grab rounded-full bg-border mt-4 mb-2" />
                        <div className="p-6 overflow-y-auto">
                            <div className="mb-6">
                                <Drawer.Title className="text-2xl font-black text-foreground tracking-tight">Invite User</Drawer.Title>
                                <Drawer.Description className="text-muted-foreground text-sm font-medium mt-1">
                                    Send an invitation email to join Eduspace.
                                </Drawer.Description>
                            </div>
                            {renderForm()}
                        </div>
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px] z-[10001]" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>Invite User to Eduspace</DialogTitle>
                    <DialogDescription>
                        Send an invitation email to invite someone to join the Eduspace platform.
                    </DialogDescription>
                </DialogHeader>
                {renderForm()}
            </DialogContent>
        </Dialog>
    );
}
