import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useClassStudents } from "@/hooks/useClassStudents";
import { useAccessRequests } from "@/hooks/useAccessRequests";
import { useClasses } from "@/hooks/useClasses";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Users,
    Search,
    Upload,
    UserPlus,
    Send,
    Edit,
    Trash2,
    ChevronLeft,
    FileSpreadsheet,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ImportStudentsModal } from "@/components/lecturer/ImportStudentsModal";
import { EditStudentModal } from "@/components/lecturer/EditStudentModal";
import { ImageUploadButton } from "@/components/common/ImageUploadButton";
import { getOptimizedImageUrl } from "@/utils/cloudinaryUpload";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function AllStudents() {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const { classes } = useClasses();
    const currentClass = classes.find(c => c.id === classId);

    const {
        students,
        loading,
        addStudent,
        importStudents,
        updateStudent,
        deleteStudent,
        updateStudentImage,
    } = useClassStudents(classId || "");

    const {
        sendAccessRequestToAll,
        sendAccessRequest,
        getAccessRequests,
    } = useAccessRequests();

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showImportModal, setShowImportModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<any>(null);
    const [sendingRequests, setSendingRequests] = useState(false);
    const [accessRequests, setAccessRequests] = useState<any[]>([]);

    // Fetch access requests
    useEffect(() => {
        if (classId) {
            loadAccessRequests();
        }
    }, [classId]);

    const loadAccessRequests = async () => {
        if (!classId) return;
        try {
            const requests = await getAccessRequests(classId);
            setAccessRequests(requests);
        } catch (error) {
            console.error("Error loading access requests:", error);
        }
    };

    // Filter students
    const filteredStudents = students.filter(student => {
        const matchesSearch =
            student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.register_number.toLowerCase().includes(searchQuery.toLowerCase());

        if (statusFilter === "all") return matchesSearch;

        const request = accessRequests.find(r => r.student_id === student.student_id);
        const status = request?.status || "not_sent";

        return matchesSearch && status === statusFilter;
    });

    // Calculate stats
    const totalStudents = students.length;
    const pendingRequests = accessRequests.filter(r => r.status === "pending").length;
    const acceptedStudents = accessRequests.filter(r => r.status === "accepted").length;

    const handleSendAllRequests = async () => {
        if (!classId) return;

        try {
            setSendingRequests(true);
            await sendAccessRequestToAll(classId);
            await loadAccessRequests();
            toast({
                title: "Requests Sent",
                description: `Access requests sent to ${students.length} students`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send access requests",
                variant: "destructive",
            });
        } finally {
            setSendingRequests(false);
        }
    };

    const handleSendIndividualRequest = async (studentId: string, studentEmail: string) => {
        if (!classId) return;

        try {
            await sendAccessRequest(classId, studentEmail);
            await loadAccessRequests();
            toast({
                title: "Request Sent",
                description: "Access request sent to student",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send access request",
                variant: "destructive",
            });
        }
    };

    const handleImport = async (studentsData: any[]) => {
        try {
            const result = await importStudents(studentsData);
            await loadAccessRequests();
            return result;
        } catch (error) {
            throw error;
        }
    };

    const handleEditStudent = (student: any) => {
        setSelectedStudent(student);
        setShowEditModal(true);
    };

    const handleSaveStudent = async (studentId: string, data: any) => {
        try {
            await updateStudent(studentId, data);
            setShowEditModal(false);
        } catch (error) {
            throw error;
        }
    };

    const handleDeleteClick = (student: any) => {
        setStudentToDelete(student);
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (!studentToDelete) return;

        try {
            await deleteStudent(studentToDelete.id);
            await loadAccessRequests();
            toast({
                title: "Student Deleted",
                description: "Student has been removed from the class",
            });
            setShowDeleteDialog(false);
            setStudentToDelete(null);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete student",
                variant: "destructive",
            });
        }
    };

    const handleImageUpload = async (studentId: string, imageUrl: string) => {
        try {
            await updateStudentImage(studentId, imageUrl);
        } catch (error) {
            throw error;
        }
    };

    const handleImageRemove = async (studentId: string) => {
        try {
            await updateStudentImage(studentId, null);
        } catch (error) {
            throw error;
        }
    };

    const getAccessStatus = (studentId: string) => {
        const request = accessRequests.find(r => r.student_id === studentId);
        return request?.status || "not_sent";
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; label: string; className: string }> = {
            pending: { variant: "secondary", label: "Pending", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
            accepted: { variant: "default", label: "Accepted", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
            rejected: { variant: "destructive", label: "Rejected", className: "bg-red-500/10 text-red-500 border-red-500/20" },
            not_sent: { variant: "outline", label: "Not Sent", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
        };

        const config = variants[status] || variants.not_sent;
        return (
            <Badge variant={config.variant} className={config.className}>
                {config.label}
            </Badge>
        );
    };

    if (!classId) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <p className="text-muted-foreground">Class not found</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/all-students")}
                        className="gap-2"
                    >
                        <ChevronLeft className="size-4" />
                        Back to Classes
                    </Button>
                </div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                            {currentClass?.course_code || "Class"} - Student Management
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {currentClass?.class_name && `${currentClass.class_name} • `}
                            {currentClass?.semester} {currentClass?.academic_year}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowImportModal(true)}
                            className="gap-2"
                        >
                            <Upload className="size-4" />
                            Import Excel
                        </Button>
                        <Button
                            onClick={handleSendAllRequests}
                            disabled={students.length === 0 || sendingRequests}
                            className="gap-2"
                        >
                            <Send className="size-4" />
                            {sendingRequests ? "Sending..." : "Send Requests to All"}
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-card border-border">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-muted-foreground font-medium">Total Students</p>
                                    <p className="text-3xl font-bold text-foreground">{totalStudents}</p>
                                </div>
                                <div className="p-3 bg-blue-500/10 rounded-lg">
                                    <Users className="size-6 text-blue-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-muted-foreground font-medium">Accepted</p>
                                    <p className="text-3xl font-bold text-foreground">{acceptedStudents}</p>
                                </div>
                                <div className="p-3 bg-emerald-500/10 rounded-lg">
                                    <Users className="size-6 text-emerald-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm text-muted-foreground font-medium">Pending Requests</p>
                                    <p className="text-3xl font-bold text-foreground">{pendingRequests}</p>
                                </div>
                                <div className="p-3 bg-yellow-500/10 rounded-lg">
                                    <Send className="size-6 text-yellow-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="bg-card border-border">
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, email, or register number..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="accepted">Accepted</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="not_sent">Not Sent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Students Table */}
                <Card className="bg-card border-border">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center h-96">
                                <p className="text-muted-foreground">Loading students...</p>
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-96 gap-4">
                                <FileSpreadsheet className="size-12 text-muted-foreground" />
                                <div className="text-center">
                                    <p className="text-lg font-semibold text-foreground">No Students Yet</p>
                                    <p className="text-sm text-muted-foreground">
                                        Import students using Excel or add them manually
                                    </p>
                                </div>
                                <Button onClick={() => setShowImportModal(true)} className="gap-2">
                                    <Upload className="size-4" />
                                    Import Students
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Register #</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Year</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStudents.map((student) => {
                                        const status = getAccessStatus(student.student_id);
                                        const imageUrl = student.student_image_url
                                            ? getOptimizedImageUrl(student.student_image_url, { width: 100, height: 100 })
                                            : null;

                                        return (
                                            <TableRow key={student.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <Avatar className="size-10">
                                                                <AvatarImage src={imageUrl || undefined} />
                                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                                    {student.student_name.slice(0, 2).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="absolute -bottom-1 -right-1">
                                                                <ImageUploadButton
                                                                    currentImageUrl={student.student_image_url}
                                                                    onImageUpload={(url) => handleImageUpload(student.id, url)}
                                                                    onImageRemove={() => handleImageRemove(student.id)}
                                                                    size="sm"
                                                                />
                                                            </div>
                                                        </div>
                                                        <span className="font-medium">{student.student_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">{student.register_number}</TableCell>
                                                <TableCell className="text-sm">{student.email}</TableCell>
                                                <TableCell>{student.department || "-"}</TableCell>
                                                <TableCell>{student.year || "-"}</TableCell>
                                                <TableCell>{getStatusBadge(status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {status === "not_sent" && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleSendIndividualRequest(student.student_id, student.email)}
                                                                className="gap-2"
                                                            >
                                                                <Send className="size-3" />
                                                                Send Request
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleEditStudent(student)}
                                                        >
                                                            <Edit className="size-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDeleteClick(student)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modals */}
            <ImportStudentsModal
                open={showImportModal}
                onOpenChange={setShowImportModal}
                classId={classId}
                onImport={handleImport}
            />

            <EditStudentModal
                open={showEditModal}
                onOpenChange={setShowEditModal}
                student={selectedStudent}
                onSave={handleSaveStudent}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Student</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove <strong>{studentToDelete?.student_name}</strong> from this class?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}
