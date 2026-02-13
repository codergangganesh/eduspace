import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Users, FileText, Settings, HelpCircle, Shield } from "lucide-react";

interface HelpCenterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function HelpCenterDialog({ open, onOpenChange }: HelpCenterDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Help Center</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-8 text-sm">
                        {/* Getting Started */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <BookOpen className="size-5 text-primary" />
                                <h3 className="text-lg font-semibold">Getting Started</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2">How do I create an account?</h4>
                                    <p className="text-muted-foreground">
                                        Click on the role selection (Student or Lecturer) on the homepage, then choose "Create New Account". Fill in your details including your institutional email address. You'll receive a verification email to activate your account.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">What if I forget my password?</h4>
                                    <p className="text-muted-foreground">
                                        Click "Forgot Password?" on the login page. Enter your email address and we'll send you a password reset link. Follow the instructions in the email to create a new password.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Can I use social login?</h4>
                                    <p className="text-muted-foreground">
                                        Yes! Students can sign in using Google or GitHub. Lecturers currently use email/password authentication for enhanced security.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* For Students */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="size-5 text-primary" />
                                <h3 className="text-lg font-semibold">For Students</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2">How do I join a class?</h4>
                                    <p className="text-muted-foreground">
                                        Navigate to "Classes" in your dashboard. Click "Join Class" and enter the class code provided by your lecturer. Once approved, you'll have access to all class materials and assignments.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">How do I submit assignments?</h4>
                                    <p className="text-muted-foreground">
                                        Go to the assignment page, click "Submit Assignment", upload your files or enter your text response, and click "Submit". You'll receive a confirmation and can track your submission status.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Can I resubmit an assignment?</h4>
                                    <p className="text-muted-foreground">
                                        This depends on your lecturer's settings. If resubmissions are allowed, you'll see a "Resubmit" button on the assignment page before the deadline.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">How do I check my grades?</h4>
                                    <p className="text-muted-foreground">
                                        Visit the "Grades" section in your dashboard to see all your graded assignments and overall class performance. You can also view detailed feedback from your lecturers.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* For Lecturers */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="size-5 text-primary" />
                                <h3 className="text-lg font-semibold">For Lecturers</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2">How do I create a class?</h4>
                                    <p className="text-muted-foreground">
                                        Go to your dashboard and click "Create Class". Fill in the class details including name, description, and schedule. A unique class code will be generated for students to join.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">How do I create assignments?</h4>
                                    <p className="text-muted-foreground">
                                        Navigate to your class, click "Assignments", then "Create Assignment". Set the title, description, due date, points, and submission type. You can also attach resources and rubrics.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">How do I grade submissions?</h4>
                                    <p className="text-muted-foreground">
                                        Go to the assignment, view student submissions, enter grades and feedback, then click "Save Grade". Students will be notified once grades are published.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Can I invite students directly?</h4>
                                    <p className="text-muted-foreground">
                                        Yes! Use the "Invite Students" feature to send email invitations. Students will receive a direct link to join your class.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Account Settings */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Settings className="size-5 text-primary" />
                                <h3 className="text-lg font-semibold">Account Settings</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2">How do I update my profile?</h4>
                                    <p className="text-muted-foreground">
                                        Click on your profile icon in the top right, select "Profile Settings". You can update your name, bio, profile picture, and other personal information.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">How do I change my password?</h4>
                                    <p className="text-muted-foreground">
                                        Go to Settings → Security → Change Password. Enter your current password and your new password twice to confirm.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">How do I enable notifications?</h4>
                                    <p className="text-muted-foreground">
                                        Visit Settings → Notifications to customize your notification preferences for assignments, grades, announcements, and messages.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Troubleshooting */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <HelpCircle className="size-5 text-primary" />
                                <h3 className="text-lg font-semibold">Troubleshooting</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2">I can't log in to my account</h4>
                                    <p className="text-muted-foreground">
                                        Ensure you're using the correct email and password. Try resetting your password. Clear your browser cache and cookies. If the issue persists, contact support.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">My assignment won't upload</h4>
                                    <p className="text-muted-foreground">
                                        Check your file size (max 50MB) and format. Ensure you have a stable internet connection. Try a different browser. If problems continue, contact your lecturer.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">I'm not receiving email notifications</h4>
                                    <p className="text-muted-foreground">
                                        Check your spam/junk folder. Verify your email address in settings. Ensure notifications are enabled in your account preferences. Add noreply@eduspace.com to your contacts.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Security & Privacy */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Shield className="size-5 text-primary" />
                                <h3 className="text-lg font-semibold">Security & Privacy</h3>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2">Is my data secure?</h4>
                                    <p className="text-muted-foreground">
                                        Yes! We use industry-standard encryption, secure servers, and regular security audits. Your data is protected and never sold to third parties. Read our Privacy Policy for more details.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Who can see my information?</h4>
                                    <p className="text-muted-foreground">
                                        Your profile is visible to members of your classes. Lecturers can see your submissions and grades. Your email is private and only visible to administrators.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">How do I delete my account?</h4>
                                    <p className="text-muted-foreground">
                                        Go to Settings → Account → Delete Account. Note that this action is permanent and will remove all your data. Download any important information before deletion.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Still Need Help? */}
                        <div className="bg-muted/50 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">Still Need Help?</h3>
                            <p className="text-muted-foreground mb-4">
                                Can't find what you're looking for? Our support team is here to help!
                            </p>
                            <ul className="space-y-2 text-muted-foreground">
                                <li><strong>Email:</strong> eduspacelearning8@gmail.com</li>
                                <li><strong>Phone:</strong> +91 7670895485</li>
                                <li><strong>Address:</strong> 1-194, Mannam Bazar, SN Padu Mandal, Endluru, Prakasam District, Andhra Pradesh - 523225, India</li>
                                <li><strong>Response Time:</strong> Within 24 hours</li>
                            </ul>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
