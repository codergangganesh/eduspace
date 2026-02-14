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
    MoreVertical,
    Plus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ImportStudentsModal } from "@/components/lecturer/ImportStudentsModal";
import { AddStudentModal } from "@/components/lecturer/AddStudentModal";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

export default function AllStudents() {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (searchParams.get('action') === 'import') {
            setShowImportModal(true);
        }
    }, [searchParams]);
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
        resendAccessRequest,
        resendAccessRequestToAll,
        getAccessRequests,
    } = useAccessRequests();

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showImportModal, setShowImportModal] = useState(false);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
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

        const request = accessRequests.find(r =>
            (student.student_id && r.student_id === student.student_id) ||
            (r.student_email === student.email)
        );
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

    const handleResendRequest = async (studentEmail: string) => {
        if (!classId) return;

        try {
            await resendAccessRequest(classId, studentEmail);
            await loadAccessRequests();
            toast({
                title: "Request Resent",
                description: "Access request has been resent to the student",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to resend access request",
                variant: "destructive",
            });
        }
    };

    const handleResendAllRequests = async () => {
        if (!classId) return;

        try {
            setSendingRequests(true);
            const result = await resendAccessRequestToAll(classId);
            await loadAccessRequests();
            toast({
                title: "Requests Resent",
                description: result.message,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to resend access requests",
                variant: "destructive",
            });
        } finally {
            setSendingRequests(false);
        }
    };

    const handleImport = async (studentsData: any[]) => {
        try {
            const result = await importStudents(studentsData);
            await loadAccessRequests();
            return {
                success: result.imported,
                failed: result.failed,
                errors: result.errors
            };
        } catch (error) {
            throw error;
        }
    };

    const handleAddStudent = async (studentData: any) => {
        if (!classId) return;

        try {
            // Add student to class_students table
            const result = await addStudent({
                class_id: classId,
                student_id: null, // Will be filled when student accepts
                register_number: studentData.registerNumber,
                student_name: studentData.studentName,
                email: studentData.email,
                department: studentData.department || null,
                course: null,
                year: studentData.year || null,
                section: studentData.section || null,
                phone: studentData.phone || null,
                import_source: 'manual'
            });

            if (!result.success) {
                throw new Error(result.error || 'Failed to add student');
            }

            // Automatically send access request
            await sendAccessRequest(classId, studentData.email);
            await loadAccessRequests();

            toast({
                title: "Student Added",
                description: `${studentData.studentName} has been added and a join request has been sent.`,
            });
        } catch (error) {
            console.error('Error adding student:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to add student",
                variant: "destructive",
            });
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

    const getAccessStatus = (student: any) => {
        const request = accessRequests.find(r =>
            (student.student_id && r.student_id === student.student_id) ||
            (r.student_email === student.email)
        );
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
                        {/* Desktop View Buttons */}
                        <Button
                            variant="outline"
                            onClick={() => setShowAddStudentModal(true)}
                            className="hidden sm:flex rounded-xl h-10 px-4 md:h-12 border-slate-200 dark:border-slate-800 font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm gap-2"
                        >
                            <UserPlus className="size-4" />
                            Add Student
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="hidden sm:flex rounded-xl h-10 px-4 md:h-12 border-none font-bold transition-all shadow-lg hover:shadow-primary/20 bg-primary text-white gap-2">
                                    <Plus className="size-5" />
                                    <span>Manage Students</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-none backdrop-blur-xl bg-white/95 dark:bg-slate-900/95">
                                <DropdownMenuItem onClick={() => setShowImportModal(true)} className="h-12 rounded-xl cursor-pointer gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                        <FileSpreadsheet className="size-4 text-emerald-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm">Import Excel</span>
                                        <span className="text-[10px] text-muted-foreground">Bulk upload data</span>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                                <DropdownMenuItem onClick={handleSendAllRequests} disabled={students.length === 0 || sendingRequests} className="h-12 rounded-xl cursor-pointer gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Send className="size-4 text-blue-600" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="font-bold text-sm">Send Requests</span>
                                        <span className="text-[10px] text-muted-foreground">Invite all students</span>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleResendAllRequests} disabled={students.length === 0 || sendingRequests} className="h-12 rounded-xl cursor-pointer gap-3">
                                    <div className="p-2 bg-amber-500/10 rounded-lg">
                                        <Users className="size-4 text-amber-600" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="font-bold text-sm">Resend Requests</span>
                                        <span className="text-[10px] text-muted-foreground">Remind pending students</span>
                                    </div>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Mobile view handled by FAB or simple header icon could remain here if specifically asked */}
                    </div>
                </div>

                {/* Stats Cards - Premium Design */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <Card className="border-none bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl rounded-2xl overflow-hidden group">
                        <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-5 relative text-white">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Users className="size-12 sm:size-20" />
                            </div>
                            <div className="p-2 sm:p-4 bg-white/10 rounded-xl sm:rounded-2xl border border-white/20 relative z-10 backdrop-blur-sm shrink-0">
                                <Users className="size-5 sm:size-7" />
                            </div>
                            <div className="relative z-10 min-w-0">
                                <p className="text-[10px] sm:text-sm text-blue-100/80 font-semibold uppercase tracking-wider truncate">
                                    Total Students
                                </p>
                                <p className="text-xl sm:text-3xl font-black">{totalStudents}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-gradient-to-br from-emerald-600 to-teal-700 shadow-xl rounded-2xl overflow-hidden group">
                        <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-5 relative text-white">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Users className="size-12 sm:size-20" />
                            </div>
                            <div className="p-2 sm:p-4 bg-white/10 rounded-xl sm:rounded-2xl border border-white/20 relative z-10 backdrop-blur-sm shrink-0">
                                <Users className="size-5 sm:size-7" />
                            </div>
                            <div className="relative z-10 min-w-0">
                                <p className="text-[10px] sm:text-sm text-emerald-100/80 font-semibold uppercase tracking-wider truncate">
                                    Accepted
                                </p>
                                <p className="text-xl sm:text-3xl font-black">{acceptedStudents}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl rounded-2xl overflow-hidden group col-span-2 sm:col-span-1">
                        <CardContent className="p-3 sm:p-6 flex items-center gap-2 sm:gap-5 relative text-white">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Send className="size-12 sm:size-20" />
                            </div>
                            <div className="p-2 sm:p-4 bg-white/10 rounded-xl sm:rounded-2xl border border-white/20 relative z-10 backdrop-blur-sm shrink-0">
                                <Send className="size-5 sm:size-7" />
                            </div>
                            <div className="relative z-10 min-w-0">
                                <p className="text-[10px] sm:text-sm text-amber-100/80 font-semibold uppercase tracking-wider truncate">
                                    Pending Requests
                                </p>
                                <p className="text-xl sm:text-3xl font-black">{pendingRequests}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <Card className="bg-card border-border">
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-4">
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
                        </div>
                    </CardContent>
                </Card>

                {/* Students Table */}
                <Card className="bg-card border-border">
                    <CardContent className="p-0">
                        {loading ? (
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
                                <TableSkeleton columns={7} rows={10} />
                            </Table>
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
                                        const status = getAccessStatus(student);
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
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {status === "not_sent" && (
                                                                <DropdownMenuItem onClick={() => handleSendIndividualRequest(student.student_id, student.email)}>
                                                                    <Send className="mr-2 h-4 w-4" />
                                                                    Send Request
                                                                </DropdownMenuItem>
                                                            )}
                                                            {(status === "rejected" || status === "pending") && (
                                                                <DropdownMenuItem onClick={() => handleResendRequest(student.email)}>
                                                                    <Send className="mr-2 h-4 w-4" />
                                                                    Resend Request
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem onClick={() => handleEditStudent(student)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteClick(student)}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Remove Student
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
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
            <AddStudentModal
                open={showAddStudentModal}
                onOpenChange={setShowAddStudentModal}
                classId={classId}
                onStudentAdded={handleAddStudent}
            />

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

            {/* Mobile FAB for Add Student */}
            <div className="fixed bottom-6 right-6 sm:hidden z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <Button
                    onClick={() => setShowAddStudentModal(true)}
                    size="icon"
                    className="size-16 rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-all active:scale-95 border-4 border-background text-primary-foreground"
                    title="Add Student"
                >
                    <Plus className="size-8 text-white" />
                </Button>
            </div>
            {/* Mobile FAB Menu */}
            <div className="fixed bottom-6 right-6 sm:hidden z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="icon"
                            className="size-16 rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-all active:scale-95 border-4 border-background text-primary-foreground"
                            title="Actions"
                        >
                            <Plus className="size-8 text-white" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" className="w-64 p-2 rounded-2xl shadow-2xl border-none backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 mb-4">
                        <DropdownMenuItem onClick={() => setShowAddStudentModal(true)} className="h-14 rounded-xl cursor-pointer gap-3 px-4">
                            <div className="p-2.5 bg-primary/10 rounded-xl">
                                <UserPlus className="size-5 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-base">Add Student</span>
                                <span className="text-[11px] text-muted-foreground leading-tight">Add a single student manually</span>
                            </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowImportModal(true)} className="h-14 rounded-xl cursor-pointer gap-3 px-4">
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                                <FileSpreadsheet className="size-5 text-emerald-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-base">Import Excel</span>
                                <span className="text-[11px] text-muted-foreground leading-tight">Bulk upload student data</span>
                            </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                        <DropdownMenuItem onClick={handleSendAllRequests} disabled={students.length === 0 || sendingRequests} className="h-14 rounded-xl cursor-pointer gap-3 px-4">
                            <div className="p-2.5 bg-blue-500/10 rounded-xl">
                                <Send className="size-5 text-blue-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-base">Send All Requests</span>
                                <span className="text-[11px] text-muted-foreground leading-tight">Invite all pending students</span>
                            </div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </DashboardLayout>
    );
}
