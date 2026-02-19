import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Send } from "lucide-react";

interface ContactSupportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ContactSupportDialog({ open, onOpenChange }: ContactSupportDialogProps) {
    const { profile } = useAuth();
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Contact Support</DialogTitle>
                    <DialogDescription>
                        Have a question or run into an issue? Send us a message and we'll get back to you as soon as possible.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid w-full gap-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            placeholder="What is this regarding?"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="grid w-full gap-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            placeholder="Describe your issue or question..."
                            className="min-h-[120px] resize-none"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Message
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
