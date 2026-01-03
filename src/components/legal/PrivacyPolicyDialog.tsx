import { useState, useRef, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronDown } from "lucide-react";

interface PrivacyPolicyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAgree?: () => void;
    showAgreeButton?: boolean;
}

export function PrivacyPolicyDialog({ open, onOpenChange, onAgree, showAgreeButton = false }: PrivacyPolicyDialogProps) {
    const [canAgree, setCanAgree] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setCanAgree(false);
        }
    }, [open]);

    const handleScroll = () => {
        if (!contentRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        // Allow a small buffer (e.g., 20px) for floating point inaccuracies or zoom levels
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

        if (isAtBottom) {
            setCanAgree(true);
        }
    };

    const handleAgree = () => {
        if (canAgree && onAgree) {
            onAgree();
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-border bg-background/95 backdrop-blur-xl z-10">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        Privacy Policy
                        {!canAgree && showAgreeButton && (
                            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                Scroll to read
                            </span>
                        )}
                        {canAgree && showAgreeButton && (
                            <span className="text-xs font-normal text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="size-3" />
                                Read
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div
                    ref={contentRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-foreground/80 leading-relaxed scroll-smooth"
                >
                    <div>
                        <p className="text-muted-foreground mb-4">
                            <strong>Last Updated:</strong> January 2, 2026
                        </p>
                        <p className="text-muted-foreground">
                            Welcome to EduSpace. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our educational platform.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">1. Information We Collect</h3>
                        <div className="space-y-2">
                            <p><strong>Personal Information:</strong></p>
                            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                                <li>Name, email address, and institutional affiliation</li>
                                <li>Profile information including profile picture and bio</li>
                                <li>Academic records, assignments, and course materials</li>
                                <li>Communication data including messages and notifications</li>
                            </ul>
                            <p className="mt-3"><strong>Usage Information:</strong></p>
                            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                                <li>Device information and IP address</li>
                                <li>Browser type and operating system</li>
                                <li>Pages visited and time spent on platform</li>
                                <li>Interaction with courses and assignments</li>
                            </ul>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">2. How We Use Your Information</h3>
                        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                            <li>Provide and maintain our educational services</li>
                            <li>Process assignments and track academic progress</li>
                            <li>Facilitate communication between students and lecturers</li>
                            <li>Send important notifications and updates</li>
                            <li>Improve our platform and user experience</li>
                            <li>Ensure platform security and prevent fraud</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">3. Information Sharing</h3>
                        <p className="mb-2">We may share your information with:</p>
                        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                            <li><strong>Educational Institutions:</strong> Your enrolled institution and authorized personnel</li>
                            <li><strong>Service Providers:</strong> Third-party services that help us operate our platform</li>
                            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                            <li><strong>With Your Consent:</strong> Any other sharing with your explicit permission</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">4. Data Security</h3>
                        <p>
                            We implement industry-standard security measures to protect your data, including encryption, secure servers, and regular security audits. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">5. Your Rights</h3>
                        <p className="mb-2">You have the right to:</p>
                        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                            <li>Access your personal information</li>
                            <li>Correct inaccurate data</li>
                            <li>Request deletion of your data (subject to legal requirements)</li>
                            <li>Opt-out of marketing communications</li>
                            <li>Export your data in a portable format</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">6. Cookies and Tracking</h3>
                        <p>
                            We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and maintain your session. You can control cookie preferences through your browser settings.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">7. Children's Privacy</h3>
                        <p>
                            EduSpace is designed for educational institutions. Users under 13 must have parental consent. We comply with COPPA and similar regulations regarding children's data.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">8. Changes to Privacy Policy</h3>
                        <p>
                            We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notification. Continued use of EduSpace after changes constitutes acceptance.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">9. Contact Us</h3>
                        <p className="mb-2">
                            For privacy-related questions or concerns, contact us at:
                        </p>
                        <ul className="list-none pl-0 space-y-1 text-muted-foreground">
                            <li><strong>Name:</strong> EduSpace</li>
                            <li><strong>Email:</strong> mannamganeshbabu8@gmail.com</li>
                            <li><strong>Phone:</strong> +91 7670895485</li>
                            <li><strong>Address:</strong> 1-194, Mannam Bazar, SN Padu Mandal, Endluru, Prakasam District, Andhra Pradesh - 523225, India</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter className="p-6 border-t border-border bg-background/95 backdrop-blur-xl z-10 flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                        {!canAgree && showAgreeButton && (
                            <span className="flex items-center animate-pulse">
                                Scroll down to accept <ChevronDown className="ml-1 size-4" />
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        {showAgreeButton && (
                            <Button
                                onClick={handleAgree}
                                disabled={!canAgree}
                                className="bg-primary hover:bg-primary/90 min-w-[100px]"
                            >
                                I Agree
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
