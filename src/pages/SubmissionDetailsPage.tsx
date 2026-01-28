import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    ArrowLeft,
    Download,
    Search,
    FileText,
    Users,
    CheckCircle,
    Clock,
    Eye,
    Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { useAssignmentSubmissions } from '@/hooks/useAssignmentSubmissions';
import { useClasses } from '@/hooks/useClasses';
import { supabase } from '@/integrations/supabase/client';
import { formatFileSize, getFileExtension, getFileTypeDisplay } from '@/lib/fileUtils';

export default function SubmissionDetailsPage() {
    const { classId, assignmentId } = useParams<{ classId: string; assignmentId: string }>();
    const navigate = useNavigate();
    const { classes } = useClasses();
    const { submissions, loading } = useAssignmentSubmissions(assignmentId || '', classId || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [assignment, setAssignment] = useState<any>(null);

    const currentClass = classes.find((c) => c.id === classId);

    // Fetch assignment details
    useEffect(() => {
        if (!assignmentId) return;

        const fetchAssignment = async () => {
            const { data, error } = await supabase
                .from('assignments')
                .select('*')
                .eq('id', assignmentId)
                .single();

            if (!error && data) {
                setAssignment(data);
            }
        };

        fetchAssignment();

        // Subscribe to assignment changes for real-time status updates
        const subscription = supabase
            .channel(`assignment_page_${assignmentId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'assignments',
                    filter: `id=eq.${assignmentId}`,
                },
                () => {
                    fetchAssignment();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [assignmentId]);

    const filteredSubmissions = submissions.filter(
        (student) =>
            student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.register_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const submittedCount = submissions.filter((s) => s.status === 'submitted').length;
    const pendingCount = submissions.filter((s) => s.status === 'pending').length;

    const handleDownloadReport = () => {
        const data = submissions.map((item) => ({
            'Assignment Title': assignment?.title || '',
            'Class Name': currentClass?.class_name || currentClass?.course_code || '',
            'Student Name': item.student_name,
            'Register Number': item.register_number,
            Email: item.email,
            Status: item.status === 'submitted' ? 'Submitted' : 'Not Submitted',
            'Submission Date': item.submitted_at ? format(new Date(item.submitted_at), 'yyyy-MM-dd') : '',
            'Submission Time': item.submitted_at ? format(new Date(item.submitted_at), 'HH:mm:ss') : '',
            'File Name': item.file_name || '',
            'File Type': getFileTypeDisplay(item.file_type) || getFileExtension(item.file_name) || '',
            'File Size': item.file_size ? formatFileSize(item.file_size) : '',
            'File Download URL': item.file_url || '',
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        ws['!cols'] = [
            { wch: 30 },
            { wch: 25 },
            { wch: 25 },
            { wch: 15 },
            { wch: 30 },
            { wch: 15 },
            { wch: 15 },
            { wch: 12 },
            { wch: 30 },
            { wch: 15 },
            { wch: 12 },
            { wch: 60 },
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Submissions');

        const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
        const fileName = `${(assignment?.title || 'Assignment').replace(/[^a-z0-9]/gi, '_')}_Submissions_${timestamp}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    if (!classId || !assignmentId) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground mb-4">Invalid assignment or class</p>
                    <Button onClick={() => navigate('/lecturer/assignments')}>
                        <ArrowLeft className="size-4 mr-2" />
                        Back to Classes
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Header with Back Button */}
                <div className="flex flex-col gap-4">
                    <Button
                        variant="ghost"
                        className="w-fit gap-2"
                        onClick={() => navigate(`/lecturer/assignments/${classId}`)}
                    >
                        <ArrowLeft className="size-4" />
                        Back to Assignments
                    </Button>

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                                {assignment?.title || 'Loading...'}
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Submission details for {currentClass?.class_name || currentClass?.course_code || 'Class'}
                            </p>
                            {assignment?.status && (
                                <Badge
                                    className={`mt-2 ${assignment.status === 'completed'
                                            ? 'bg-blue-600'
                                            : assignment.status === 'active'
                                                ? 'bg-green-600'
                                                : ''
                                        }`}
                                >
                                    {assignment.status === 'completed' ? 'Completed' : assignment.status}
                                </Badge>
                            )}
                        </div>

                        <Button onClick={handleDownloadReport} variant="outline" className="gap-2">
                            <Download className="size-4" />
                            Download Report
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <Users className="size-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Total Students</p>
                                <p className="text-2xl font-bold">{submissions.length}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 rounded-lg">
                                <CheckCircle className="size-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Submitted</p>
                                <p className="text-2xl font-bold text-green-600">{submittedCount}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-orange-500/10 rounded-lg">
                                <Clock className="size-6 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Pending</p>
                                <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Progress Bar */}
                <div className="w-full">
                    <div className="flex items-center justify-between text-sm mb-2 text-muted-foreground">
                        <span>Submission Progress</span>
                        <span className="font-medium">
                            {submittedCount} / {submissions.length} submitted
                        </span>
                    </div>
                    <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{
                                width: `${Math.min(100, (submittedCount / (submissions.length || 1)) * 100)}%`,
                            }}
                        />
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, register number, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Submissions Table */}
                <Card>
                    <CardContent className="p-0">
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
                                            {searchQuery
                                                ? 'No students found matching your search.'
                                                : 'No students in this class.'}
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
                                                    <Badge className="bg-green-500 hover:bg-green-600">Submitted</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Not Submitted</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {student.submitted_at ? (
                                                    <div className="flex flex-col text-sm">
                                                        <span>{format(new Date(student.submitted_at), 'MMM d, yyyy')}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {format(new Date(student.submitted_at), 'h:mm a')}
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
                                                                {getFileTypeDisplay(student.file_type) ||
                                                                    getFileExtension(student.file_name)}
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
                                                        <Button variant="ghost" size="sm" className="gap-1" asChild>
                                                            <a href={student.file_url} target="_blank" rel="noreferrer">
                                                                <Eye className="size-4" />
                                                                View
                                                            </a>
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="gap-1" asChild>
                                                            <a
                                                                href={student.file_url}
                                                                download={student.file_name}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                <Download className="size-4" />
                                                                Download
                                                            </a>
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">No file</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
