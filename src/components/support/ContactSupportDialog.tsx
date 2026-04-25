import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, Send, CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import DOMPurify from "dompurify";
import { contactSupportSchema, ContactSupportFormValues } from "@/lib/validations/support";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ContactSupportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ContactSupportDialog({ open, onOpenChange }: ContactSupportDialogProps) {
    const { register, handleSubmit: hookFormSubmit, formState: { errors }, reset } = useForm<ContactSupportFormValues>({
        resolver: zodResolver(contactSupportSchema),
        mode: "onChange",
        defaultValues: { name: "", email: "", subject: "", message: "" }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const onValidSubmit = async (data: ContactSupportFormValues) => {
        setIsSubmitting(true);
        try {
            const { error: fnError } = await supabase.functions.invoke('contact-support', {
                body: {
                    name: DOMPurify.sanitize(data.name.trim()),
                    email: DOMPurify.sanitize(data.email.trim()),
                    subject: DOMPurify.sanitize(data.subject.trim()),
                    message: DOMPurify.sanitize(data.message.trim()),
                },
            });

            if (fnError) throw fnError;

            setIsSubmitting(false);
            setIsSubmitted(true);
            toast.success("Support request sent successfully!");

            // Reset form after 3 seconds
            setTimeout(() => {
                setIsSubmitted(false);
                reset();
                onOpenChange(false);
            }, 3000);

        } catch (error: any) {
            console.error('FAILED...', error);
            toast.error("Failed to send message. Please ensure you are connected to the internet.");
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <div className={cn(
                    "fixed inset-0 z-[10005] flex justify-center pointer-events-none",
                    isMobile ? "items-end" : "items-center p-4 md:p-6"
                )}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onOpenChange(false)}
                        className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto"
                    />

                    <motion.div
                        initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 }}
                        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
                        exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={cn(
                            "border pointer-events-auto overflow-hidden max-h-[85vh] overflow-y-auto",
                            "bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800",
                            "border-slate-200/50 dark:border-slate-700/50",
                            "shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.9),inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(0,0,0,0.05)]",
                            "dark:shadow-[8px_8px_16px_rgba(0,0,0,0.35),-8px_-8px_16px_rgba(255,255,255,0.05),inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]",
                            isMobile
                                ? "fixed bottom-0 left-0 right-0 max-h-[92vh] rounded-t-[2rem] border-b-0"
                                : "relative w-full max-w-[900px] rounded-[2rem]"
                        )}
                    >
                        {isMobile && (
                            <div className="absolute top-3 left-1/2 z-50 h-1.5 w-12 -translate-x-1/2 rounded-full bg-muted-foreground/20" />
                        )}

                        {/* Close Button */}
                        <button
                            onClick={() => onOpenChange(false)}
                            className="absolute top-4 right-4 z-50 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-muted-foreground shadow-[2px_2px_4px_rgba(0,0,0,0.08),-2px_-2px_4px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[2px_2px_4px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.05),inset_1px_1px_2px_rgba(255,255,255,0.1)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15)] active:scale-95"
                        >
                            <X className="size-5" />
                        </button>

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
                            <div className="w-full md:w-3/5 bg-gradient-to-br from-white to-slate-50 p-6 pt-12 dark:from-slate-900 dark:to-slate-800 md:p-8 md:pt-8">
                                <div className="mb-6 text-left">
                                    <h2 className="text-2xl font-bold text-foreground">Get in Touch</h2>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        We'd love to hear from you. Please fill out this form.
                                    </p>
                                </div>

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
                                    <form onSubmit={hookFormSubmit(onValidSubmit)} className="space-y-5">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Name</Label>
                                                <Input
                                                    id="name"
                                                    placeholder="John Doe"
                                                    {...register("name")}
                                                    disabled={isSubmitting}
                                                    className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-slate-200/50 dark:border-slate-700/50 focus:ring-blue-500 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] rounded-xl"
                                                />
                                                {errors.name && <p className="text-red-500 text-[11px] font-medium pl-1">{errors.name.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="john@example.com"
                                                    {...register("email")}
                                                    disabled={isSubmitting}
                                                    className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-slate-200/50 dark:border-slate-700/50 focus:ring-blue-500 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] rounded-xl"
                                                />
                                                {errors.email && <p className="text-red-500 text-[11px] font-medium pl-1">{errors.email.message}</p>}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="subject">Subject</Label>
                                            <Input
                                                id="subject"
                                                placeholder="How can we help?"
                                                {...register("subject")}
                                                disabled={isSubmitting}
                                                className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-slate-200/50 dark:border-slate-700/50 focus:ring-blue-500 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] rounded-xl"
                                            />
                                            {errors.subject && <p className="text-red-500 text-[11px] font-medium pl-1">{errors.subject.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="message">Message</Label>
                                            <Textarea
                                                id="message"
                                                placeholder="Tell us more about your inquiry..."
                                                className="min-h-[120px] resize-none bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-slate-200/50 dark:border-slate-700/50 focus:ring-blue-500 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.06),inset_-3px_-3px_6px_rgba(255,255,255,0.9)] dark:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.2),inset_-3px_-3px_6px_rgba(255,255,255,0.05)] rounded-xl"
                                                {...register("message")}
                                                disabled={isSubmitting}
                                            />
                                            {errors.message && <p className="text-red-500 text-[11px] font-medium pl-1">{errors.message.message}</p>}
                                        </div>

                                        <div className="pt-2 flex gap-3 justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => onOpenChange(false)}
                                                disabled={isSubmitting}
                                                className="text-muted-foreground hover:text-foreground rounded-xl shadow-[3px_3px_6px_rgba(0,0,0,0.08),-3px_-3px_6px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.8)] dark:shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(255,255,255,0.05),inset_1px_1px_2px_rgba(255,255,255,0.1)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15)] active:scale-95"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="min-w-[140px] rounded-xl bg-gradient-to-br from-primary to-primary/90 shadow-[4px_4px_8px_rgba(0,0,0,0.15),inset_2px_2px_4px_rgba(255,255,255,0.3)] hover:shadow-[6px_6px_12px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.4)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.25)] active:scale-95"
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
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
