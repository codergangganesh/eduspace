import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Download,
    Search,
    FileText,
    CheckCircle,
    Clock,
    XCircle,
    Loader2,
    Eye
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import * as XLSX from 'xlsx';
import { useAssignmentSubmissions } from "@/hooks/useAssignmentSubmissions";
import { formatFileSize, getFileExtension, getFileTypeDisplay } from "@/lib/fileUtils";

interface SubmissionDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    assignmentId: string;
    classId: string;
    assignmentTitle: string;
    className: string;
}

export function SubmissionDetailsDialog({
    open,
    onOpenChange,
    assignmentId,
    classId,
    assignmentTitle,
    className
}: SubmissionDetailsDialogProps) {
    const { submissions, loading } = useAssignmentSubmissions(assignmentId, classId);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredSubmissions = submissions.filter(student =>
        student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.register_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDownloadReport = () => {
        // Prepare data for Excel with comprehensive file information
        const data = submissions.map(item => ({
            "Assignment Title": assignmentTitle,
            "Class Name": className,
            "Student Name": item.student_name,
            "Register Number": item.register_number,
            "Email": item.email,
            "Status": item.status === 'submitted' ? "Submitted" : "Not Submitted",
            "Submission Date": item.submitted_at ? format(new Date(item.submitted_at), "yyyy-MM-dd") : "",
            "Submission Time": item.submitted_at ? format(new Date(item.submitted_at), "HH:mm:ss") : "",
            "File Name": item.file_name || "",
            "File Type": getFileTypeDisplay(item.file_type) || getFileExtension(item.file_name) || "",
            "File Size": item.file_size ? formatFileSize(item.file_size) : "",
            "File Download URL": item.file_url || ""
        }));

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(data);

        // Set column widths for better readability
        ws['!cols'] = [
            { wch: 30 }, // Assignment Title
            { wch: 25 }, // Class Name
            { wch: 25 }, // Student Name
            { wch: 15 }, // Register Number
            { wch: 30 }, // Email
            { wch: 15 }, // Status
            { wch: 15 }, // Submission Date
            { wch: 12 }, // Submission Time
            { wch: 30 }, // File Name
            { wch: 15 }, // File Type
            { wch: 12 }, // File Size
            { wch: 60 }  // File Download URL
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Submissions");

        // Download file with timestamp
        const timestamp = format(new Date(), "yyyy-MM-dd_HHmmss");
        const fileName = `${assignmentTitle.replace(/[^a-z0-9]/gi, '_')}_Submissions_${timestamp}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mr-8">
                        <div>
                            <DialogTitle className="text-xl">{assignmentTitle}</DialogTitle>
                            <DialogDescription>
                                Submission details for {className}
                            </DialogDescription>
                        </div>
                        <Button onClick={handleDownloadReport} variant="outline" className="gap-2">
                            <Download className="size-4" />
                            Download Report
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex items-center gap-2 py-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Register No</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Submitted At</TableHead>
                                <TableHead>File Details</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>Loading submissions...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredSubmissions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        {searchQuery ? "No students found matching your search." : "No students in this class."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSubmissions.map((student) => (
                                    <TableRow key={student.student_id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{student.student_name}</span>
                                                <span className="text-xs text-muted-foreground">{student.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{student.register_number}</TableCell>
                                        <TableCell>
                                            {student.status === 'submitted' ? (
                                                <Badge className="bg-green-500 hover:bg-green-600">
                                                    Submitted
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    Not Submitted
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {student.submitted_at ? (
                                                <div className="flex flex-col text-sm">
                                                    <span>{format(new Date(student.submitted_at), "MMM d, yyyy")}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(new Date(student.submitted_at), "h:mm a")}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {student.file_name ? (
                                                <div className="flex flex-col text-sm max-w-[200px]">
                                                    <span className="font-medium truncate" title={student.file_name}>
                                                        {student.file_name}
                                                    </span>
                                                    <div className="flex gap-2 text-xs text-muted-foreground">
                                                        <span className="uppercase font-medium">
                                                            {getFileTypeDisplay(student.file_type) || getFileExtension(student.file_name)}
                                                        </span>
                                                        {student.file_size && (
                                                            <span>• {formatFileSize(student.file_size)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">
                                                    No file uploaded
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {student.file_url ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-1"
                                                        asChild
                                                    >
                                                        <a href={student.file_url} target="_blank" rel="noreferrer">
                                                            <Eye className="size-4" />
                                                            View
                                                        </a>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-1"
                                                        asChild
                                                    >
                                                        <a href={student.file_url} download={student.file_name} target="_blank" rel="noreferrer">
                                                            <Download className="size-4" />
                                                            Download
                                                        </a>
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">
                                                    No file
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>

                <div className="pt-4 flex items-center justify-between text-sm text-muted-foreground border-t mt-4">
                    <span>
                        Total Students: {submissions.length}
                    </span>
                    <div className="flex gap-4">
                        <span className="text-green-600 font-medium">
                            Submitted: {submissions.filter(s => s.status === 'submitted').length}
                        </span>
                        <span className="text-orange-600 font-medium">
                            Pending: {submissions.filter(s => s.status === 'pending').length}
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
