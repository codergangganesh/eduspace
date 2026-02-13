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
import { Mail, MessageSquare, Send, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
        try {
            const { error: fnError } = await supabase.functions.invoke('contact-support', {
                body: {
                    name: formData.name,
                    email: formData.email,
                    subject: formData.subject,
                    message: formData.message,
                },
            });

            if (fnError) throw fnError;

            setIsSubmitting(false);
            setIsSubmitted(true);
            toast.success("Support request sent successfully!");

            // Reset form after 3 seconds
            setTimeout(() => {
                setIsSubmitted(false);
                setFormData({ name: "", email: "", subject: "", message: "" });
                onOpenChange(false);
            }, 3000);

        } catch (error: any) {
            console.error('FAILED...', error);
            toast.error("Failed to send message. Please ensure you are connected to the internet.");
            setIsSubmitting(false);
        }

    };

    const handleChange = (field: string) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden bg-background border-border max-h-[85vh] overflow-y-auto">
                <div className="flex flex-col-reverse md:flex-row h-full">
                    {/* Left Panel - Contact Information */}
                    <div className="w-full md:w-2/5 bg-slate-900 p-6 md:p-8 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 p-12 opacity-10 hidden md:block">
                            <MessageSquare className="size-64 text-white transform translate-x-1/3 -translate-y-1/3" />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div>
                                <h3 className="text-xl md:text-2xl font-bold mb-2">Contact Information</h3>
                                <p className="text-slate-300 text-sm md:text-base">
                                    Fill up the form and our team will get back to you within 24 hours.
                                </p>
                            </div>

                            <div className="space-y-4 md:space-y-6 mt-4 md:mt-8">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-white/10 rounded-lg shrink-0">
                                        <Mail className="size-4 md:size-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-blue-200 text-xs md:text-sm mb-1">Email</div>
                                        <div className="text-sm">eduspacelearning8@gmail.com</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-white/10 rounded-lg shrink-0">
                                        <MessageSquare className="size-4 md:size-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-purple-200 text-xs md:text-sm mb-1">Phone</div>
                                        <div className="text-xs md:text-sm">+91 7670895485</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-white/10 rounded-lg shrink-0">
                                        <MessageSquare className="size-4 md:size-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-indigo-200 text-xs md:text-sm mb-1">Address</div>
                                        <div className="text-xs md:text-sm leading-relaxed text-slate-300">
                                            1-194, Mannam Bazar, SN Padu Mandal, Endluru, Prakasam District,<br />
                                            Andhra Pradesh - 523225, India
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Decoration */}
                        <div className="relative z-10 mt-8 md:mt-12 hidden md:block">
                            <div className="flex gap-4">
                                <div className="size-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                                    <MessageSquare className="size-4" />
                                </div>
                                <div className="size-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                                    <Mail className="size-4" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Form */}
                    <div className="w-full md:w-3/5 p-8 bg-background">
                        <DialogHeader className="mb-6 text-left">
                            <DialogTitle className="text-2xl font-bold text-foreground">Get in Touch</DialogTitle>
                            <DialogDescription>
                                We'd love to hear from you. Please fill out this form.
                            </DialogDescription>
                        </DialogHeader>

                        {isSubmitted ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4 h-[400px]">
                                <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/20 animate-in zoom-in duration-300">
                                    <CheckCircle2 className="size-12 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-xl font-semibold text-foreground">Request Submitted!</h3>
                                    <p className="text-muted-foreground max-w-xs mx-auto">
                                        Thank you for contacting us. We'll be in touch shortly.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={handleChange("name")}
                                            disabled={isSubmitting}
                                            className="bg-background border-border focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={handleChange("email")}
                                            disabled={isSubmitting}
                                            className="bg-background border-border focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input
                                        id="subject"
                                        placeholder="How can we help?"
                                        value={formData.subject}
                                        onChange={handleChange("subject")}
                                        disabled={isSubmitting}
                                        className="bg-background border-border focus:ring-blue-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Tell us more about your inquiry..."
                                        className="min-h-[120px] resize-none bg-background border-border focus:ring-blue-500"
                                        value={formData.message}
                                        onChange={handleChange("message")}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="pt-2 flex gap-3 justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => onOpenChange(false)}
                                        disabled={isSubmitting}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="min-w-[140px]"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin mr-2" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                Send Message
                                                <Send className="size-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
