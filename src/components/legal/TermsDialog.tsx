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

interface TermsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAgree?: () => void;
    showAgreeButton?: boolean;
}

export function TermsDialog({ open, onOpenChange, onAgree, showAgreeButton = false }: TermsDialogProps) {
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
                        Terms and Conditions
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
                            Welcome to EduSpace. By accessing or using our platform, you agree to be bound by these Terms and Conditions. Please read them carefully before using our services.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">1. Acceptance of Terms</h3>
                        <p>
                            By creating an account or using EduSpace, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions, as well as our Privacy Policy. If you do not agree, please do not use our platform.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">2. User Accounts</h3>
                        <div className="space-y-2">
                            <p><strong>Account Creation:</strong></p>
                            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                                <li>You must provide accurate and complete information</li>
                                <li>You are responsible for maintaining account security</li>
                                <li>You must be affiliated with an educational institution</li>
                                <li>One person may not maintain multiple accounts</li>
                            </ul>
                            <p className="mt-3"><strong>Account Responsibilities:</strong></p>
                            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                                <li>Keep your password confidential</li>
                                <li>Notify us immediately of unauthorized access</li>
                                <li>You are liable for all activities under your account</li>
                            </ul>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">3. Acceptable Use</h3>
                        <p className="mb-2">You agree NOT to:</p>
                        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                            <li>Violate any laws or regulations</li>
                            <li>Infringe on intellectual property rights</li>
                            <li>Upload malicious code or viruses</li>
                            <li>Harass, bully, or threaten other users</li>
                            <li>Share inappropriate or offensive content</li>
                            <li>Attempt to gain unauthorized access to the platform</li>
                            <li>Use the platform for commercial purposes without permission</li>
                            <li>Impersonate others or misrepresent your affiliation</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">4. Intellectual Property</h3>
                        <div className="space-y-2">
                            <p><strong>Platform Content:</strong> All content, features, and functionality of EduSpace are owned by us and protected by copyright, trademark, and other intellectual property laws.</p>
                            <p><strong>User Content:</strong> You retain ownership of content you upload but grant us a license to use, store, and display it as necessary to provide our services.</p>
                            <p><strong>Course Materials:</strong> Course content belongs to the respective lecturers and institutions. Unauthorized distribution is prohibited.</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">5. Academic Integrity</h3>
                        <p>
                            Users must maintain academic honesty and integrity. Plagiarism, cheating, or any form of academic dishonesty is strictly prohibited and may result in account termination and reporting to your institution.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">6. Service Availability</h3>
                        <p>
                            We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue any part of the service with or without notice. We are not liable for any service interruptions.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">7. Termination</h3>
                        <p className="mb-2">We may terminate or suspend your account if you:</p>
                        <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                            <li>Violate these Terms and Conditions</li>
                            <li>Engage in fraudulent or illegal activities</li>
                            <li>Compromise platform security</li>
                            <li>Are no longer affiliated with an educational institution</li>
                        </ul>
                        <p className="mt-2">
                            You may terminate your account at any time through account settings.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">8. Limitation of Liability</h3>
                        <p>
                            EduSpace is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, special, or consequential damages arising from your use of the platform. Our total liability shall not exceed the amount you paid for the service in the past 12 months.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">9. Indemnification</h3>
                        <p>
                            You agree to indemnify and hold harmless EduSpace from any claims, damages, or expenses arising from your use of the platform or violation of these terms.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">10. Changes to Terms</h3>
                        <p>
                            We reserve the right to modify these Terms at any time. We will notify users of significant changes. Continued use after changes constitutes acceptance of the new terms.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-foreground">11. Governing Law</h3>
                        <p>
                            These Terms are governed by the laws of the jurisdiction where EduSpace operates. Any disputes shall be resolved in the courts of that jurisdiction.
                        </p>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-2 text-foreground">12. Contact Information</h3>
                        <p className="mb-2">
                            For questions about these Terms, contact us at:
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
