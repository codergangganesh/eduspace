import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TermsDialog({ open, onOpenChange }: TermsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Terms and Conditions</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-6 text-sm">
                        <div>
                            <p className="text-muted-foreground mb-4">
                                <strong>Last Updated:</strong> January 2, 2026
                            </p>
                            <p className="text-muted-foreground">
                                Welcome to EduSpace. By accessing or using our platform, you agree to be bound by these Terms and Conditions. Please read them carefully before using our services.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h3>
                            <p className="text-muted-foreground">
                                By creating an account or using EduSpace, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions, as well as our Privacy Policy. If you do not agree, please do not use our platform.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">2. User Accounts</h3>
                            <div className="space-y-2 text-muted-foreground">
                                <p><strong>Account Creation:</strong></p>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>You must provide accurate and complete information</li>
                                    <li>You are responsible for maintaining account security</li>
                                    <li>You must be affiliated with an educational institution</li>
                                    <li>One person may not maintain multiple accounts</li>
                                </ul>
                                <p className="mt-3"><strong>Account Responsibilities:</strong></p>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Keep your password confidential</li>
                                    <li>Notify us immediately of unauthorized access</li>
                                    <li>You are liable for all activities under your account</li>
                                </ul>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">3. Acceptable Use</h3>
                            <p className="text-muted-foreground mb-2">You agree NOT to:</p>
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
                            <h3 className="text-lg font-semibold mb-2">4. Intellectual Property</h3>
                            <div className="space-y-2 text-muted-foreground">
                                <p><strong>Platform Content:</strong> All content, features, and functionality of EduSpace are owned by us and protected by copyright, trademark, and other intellectual property laws.</p>
                                <p><strong>User Content:</strong> You retain ownership of content you upload but grant us a license to use, store, and display it as necessary to provide our services.</p>
                                <p><strong>Course Materials:</strong> Course content belongs to the respective lecturers and institutions. Unauthorized distribution is prohibited.</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">5. Academic Integrity</h3>
                            <p className="text-muted-foreground">
                                Users must maintain academic honesty and integrity. Plagiarism, cheating, or any form of academic dishonesty is strictly prohibited and may result in account termination and reporting to your institution.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">6. Service Availability</h3>
                            <p className="text-muted-foreground">
                                We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue any part of the service with or without notice. We are not liable for any service interruptions.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">7. Termination</h3>
                            <p className="text-muted-foreground mb-2">We may terminate or suspend your account if you:</p>
                            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                                <li>Violate these Terms and Conditions</li>
                                <li>Engage in fraudulent or illegal activities</li>
                                <li>Compromise platform security</li>
                                <li>Are no longer affiliated with an educational institution</li>
                            </ul>
                            <p className="text-muted-foreground mt-2">
                                You may terminate your account at any time through account settings.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">8. Limitation of Liability</h3>
                            <p className="text-muted-foreground">
                                EduSpace is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, special, or consequential damages arising from your use of the platform. Our total liability shall not exceed the amount you paid for the service in the past 12 months.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">9. Indemnification</h3>
                            <p className="text-muted-foreground">
                                You agree to indemnify and hold harmless EduSpace from any claims, damages, or expenses arising from your use of the platform or violation of these terms.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">10. Changes to Terms</h3>
                            <p className="text-muted-foreground">
                                We reserve the right to modify these Terms at any time. We will notify users of significant changes. Continued use after changes constitutes acceptance of the new terms.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">11. Governing Law</h3>
                            <p className="text-muted-foreground">
                                These Terms are governed by the laws of the jurisdiction where EduSpace operates. Any disputes shall be resolved in the courts of that jurisdiction.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">12. Contact Information</h3>
                            <p className="text-muted-foreground">
                                For questions about these Terms, contact us at:
                            </p>
                            <ul className="list-none pl-0 space-y-1 text-muted-foreground mt-2">
                                <li><strong>Name:</strong> EduSpace</li>
                                <li><strong>Email:</strong> mannamganeshbabu8@gmail.com</li>
                                <li><strong>Phone:</strong> +91 7670895485</li>
                                <li><strong>Address:</strong> 1-194, Mannam Bazar, SN Padu Mandal, Endluru, Prakasam District, Andhra Pradesh - 523225, India</li>
                            </ul>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
