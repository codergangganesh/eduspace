import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ContactSupportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ContactSupportDialog({ open, onOpenChange }: ContactSupportDialogProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSubmitting(false);
        setIsSubmitted(true);
        toast.success("Support request submitted successfully!");

        // Reset form after 3 seconds
        setTimeout(() => {
            setIsSubmitted(false);
            setFormData({ name: "", email: "", subject: "", message: "" });
            onOpenChange(false);
        }, 3000);
    };

    const handleChange = (field: string) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Contact Support</DialogTitle>
                    <DialogDescription>
                        Have a question or need assistance? We're here to help!
                    </DialogDescription>
                </DialogHeader>

                {isSubmitted ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/20">
                            <CheckCircle2 className="size-12 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-semibold">Request Submitted!</h3>
                            <p className="text-muted-foreground">
                                Thank you for contacting us. Our support team will respond within 24 hours.
                            </p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Contact Methods */}
                        <div className="grid grid-cols-1 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-start gap-3 text-sm">
                                <Mail className="size-4 text-primary mt-0.5" />
                                <div className="flex-1">
                                    <div className="font-medium mb-1">Email</div>
                                    <div className="text-muted-foreground">mannamganeshbabu8@gmail.com</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <MessageSquare className="size-4 text-primary mt-0.5" />
                                <div className="flex-1">
                                    <div className="font-medium mb-1">Phone</div>
                                    <div className="text-muted-foreground">+91 7670895485</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <MessageSquare className="size-4 text-primary mt-0.5" />
                                <div className="flex-1">
                                    <div className="font-medium mb-1">Address</div>
                                    <div className="text-muted-foreground">1-194, Mannam Bazar, SN Padu Mandal, Endluru, Prakasam District, Andhra Pradesh - 523225, India</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <MessageSquare className="size-4 text-primary mt-0.5" />
                                <div className="flex-1">
                                    <div className="font-medium mb-1">Response Time</div>
                                    <div className="text-muted-foreground">Within 24 hours</div>
                                </div>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="Your name"
                                        value={formData.name}
                                        onChange={handleChange("name")}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={handleChange("email")}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject *</Label>
                                <Input
                                    id="subject"
                                    placeholder="Brief description of your issue"
                                    value={formData.subject}
                                    onChange={handleChange("subject")}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message *</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Please provide detailed information about your question or issue..."
                                    className="min-h-[150px] resize-none"
                                    value={formData.message}
                                    onChange={handleChange("message")}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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

                        {/* Additional Info */}
                        <div className="text-xs text-muted-foreground text-center">
                            By submitting this form, you agree to our{" "}
                            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
