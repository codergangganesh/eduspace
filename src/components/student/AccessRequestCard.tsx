import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, GraduationCap, Calendar, User } from "lucide-react";
import { useState } from "react";
import { useAccessRequests } from "@/hooks/useAccessRequests";
import { toast } from "sonner";

interface AccessRequestCardProps {
    request: any;
    onRespond: () => void;
}

export function AccessRequestCard({ request, onRespond }: AccessRequestCardProps) {
    const { respondToAccessRequest, loading } = useAccessRequests();
    const [responding, setResponding] = useState(false);

    const handleAccept = async () => {
        try {
            setResponding(true);
            await respondToAccessRequest(request.id, 'accepted');
            toast.success("Access request accepted! You've been added to the class.");
            onRespond();
        } catch (error) {
            toast.error("Failed to accept request");
        } finally {
            setResponding(false);
        }
    };

    const handleReject = async () => {
        try {
            setResponding(true);
            await respondToAccessRequest(request.id, 'rejected');
            toast.success("Access request rejected");
            onRespond();
        } catch (error) {
            toast.error("Failed to reject request");
        } finally {
            setResponding(false);
        }
    };

    const classInfo = request.classes;

    return (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <GraduationCap className="size-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Class Access Request</h3>
                                <p className="text-sm text-muted-foreground">
                                    You've been invited to join a class
                                </p>
                            </div>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                            Pending
                        </Badge>
                    </div>

                    {/* Class Details */}
                    <div className="bg-background/50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="size-4 text-muted-foreground" />
                            <span className="font-medium">{classInfo?.course_code || 'Unknown Course'}</span>
                            {classInfo?.class_name && (
                                <>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-sm text-muted-foreground">{classInfo.class_name}</span>
                                </>
                            )}
                        </div>

                        {classInfo?.semester && classInfo?.academic_year && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="size-4" />
                                <span>{classInfo.semester} • {classInfo.academic_year}</span>
                            </div>
                        )}

                        {classInfo?.lecturer_name && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="size-4" />
                                <span>Lecturer: {classInfo.lecturer_name}</span>
                                {classInfo.lecturer_department && (
                                    <>
                                        <span>•</span>
                                        <span>{classInfo.lecturer_department}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Message */}
                    <div className="bg-background/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">
                            <strong>{classInfo?.lecturer_name || 'A lecturer'}</strong> has invited you to join this class.
                            By accepting, you'll get access to assignments, schedules, and can communicate with your lecturer.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            onClick={handleAccept}
                            disabled={responding || loading}
                            className="flex-1 gap-2"
                        >
                            <Check className="size-4" />
                            {responding ? "Accepting..." : "Accept"}
                        </Button>
                        <Button
                            onClick={handleReject}
                            disabled={responding || loading}
                            variant="outline"
                            className="flex-1 gap-2 text-destructive hover:text-destructive"
                        >
                            <X className="size-4" />
                            {responding ? "Rejecting..." : "Reject"}
                        </Button>
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-muted-foreground text-center">
                        Sent {new Date(request.sent_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
