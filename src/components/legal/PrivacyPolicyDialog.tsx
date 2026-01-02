import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrivacyPolicyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PrivacyPolicyDialog({ open, onOpenChange }: PrivacyPolicyDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Privacy Policy</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-6 text-sm">
                        <div>
                            <p className="text-muted-foreground mb-4">
                                <strong>Last Updated:</strong> January 2, 2026
                            </p>
                            <p className="text-muted-foreground">
                                Welcome to EduSpace. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our educational platform.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">1. Information We Collect</h3>
                            <div className="space-y-2 text-muted-foreground">
                                <p><strong>Personal Information:</strong></p>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Name, email address, and institutional affiliation</li>
                                    <li>Profile information including profile picture and bio</li>
                                    <li>Academic records, assignments, and course materials</li>
                                    <li>Communication data including messages and notifications</li>
                                </ul>
                                <p className="mt-3"><strong>Usage Information:</strong></p>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Device information and IP address</li>
                                    <li>Browser type and operating system</li>
                                    <li>Pages visited and time spent on platform</li>
                                    <li>Interaction with courses and assignments</li>
                                </ul>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">2. How We Use Your Information</h3>
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
                            <h3 className="text-lg font-semibold mb-2">3. Information Sharing</h3>
                            <p className="text-muted-foreground mb-2">We may share your information with:</p>
                            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                                <li><strong>Educational Institutions:</strong> Your enrolled institution and authorized personnel</li>
                                <li><strong>Service Providers:</strong> Third-party services that help us operate our platform</li>
                                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                                <li><strong>With Your Consent:</strong> Any other sharing with your explicit permission</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">4. Data Security</h3>
                            <p className="text-muted-foreground">
                                We implement industry-standard security measures to protect your data, including encryption, secure servers, and regular security audits. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">5. Your Rights</h3>
                            <p className="text-muted-foreground mb-2">You have the right to:</p>
                            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                                <li>Access your personal information</li>
                                <li>Correct inaccurate data</li>
                                <li>Request deletion of your data (subject to legal requirements)</li>
                                <li>Opt-out of marketing communications</li>
                                <li>Export your data in a portable format</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">6. Cookies and Tracking</h3>
                            <p className="text-muted-foreground">
                                We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and maintain your session. You can control cookie preferences through your browser settings.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">7. Children's Privacy</h3>
                            <p className="text-muted-foreground">
                                EduSpace is designed for educational institutions. Users under 13 must have parental consent. We comply with COPPA and similar regulations regarding children's data.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">8. Changes to Privacy Policy</h3>
                            <p className="text-muted-foreground">
                                We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notification. Continued use of EduSpace after changes constitutes acceptance.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">9. Contact Us</h3>
                            <p className="text-muted-foreground">
                                For privacy-related questions or concerns, contact us at:
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
