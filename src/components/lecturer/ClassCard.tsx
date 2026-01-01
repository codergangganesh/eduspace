import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Class } from "@/hooks/useClasses";
import { Users, MoreVertical, Eye, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useClasses } from "@/hooks/useClasses";
import { useState } from "react";
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
import { ImageUploadButton } from "@/components/common/ImageUploadButton";
import { getOptimizedImageUrl } from "@/utils/cloudinaryUpload";

interface ClassCardProps {
    classData: Class;
}

export function ClassCard({ classData }: ClassCardProps) {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { deleteClass, updateClassImage } = useClasses();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleViewStudents = () => {
        navigate(`/classes/${classData.id}/students`);
    };

    const handleEdit = () => {
        toast({
            title: "Edit Class",
            description: "Edit functionality coming soon",
        });
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await deleteClass(classData.id);
            toast({
                title: "Class Deleted",
                description: "The class has been successfully deleted",
            });
            setShowDeleteDialog(false);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete class",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleImageUpload = async (imageUrl: string) => {
        try {
            await updateClassImage(classData.id, imageUrl);
        } catch (error) {
            throw error;
        }
    };

    const handleImageRemove = async () => {
        try {
            await updateClassImage(classData.id, null);
        } catch (error) {
            throw error;
        }
    };

    const classImageUrl = classData.class_image_url
        ? getOptimizedImageUrl(classData.class_image_url, { width: 400, height: 300 })
        : null;

    return (
        <>
            <Card
                className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden"
                onClick={handleViewStudents}
            >
                {classImageUrl && (
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-20"
                        style={{ backgroundImage: `url(${classImageUrl})` }}
                    />
                )}

                <CardContent className="p-6 relative z-10">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="size-12">
                                    <AvatarImage src={classData.lecturer_profile_image || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                        {classData.lecturer_name?.slice(0, 2).toUpperCase() || "LC"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <p className="text-sm font-medium text-foreground">
                                        {classData.lecturer_name || "Lecturer"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {classData.lecturer_department || "Department"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div onClick={(e) => e.stopPropagation()}>
                                    <ImageUploadButton
                                        currentImageUrl={classData.class_image_url}
                                        onImageUpload={handleImageUpload}
                                        onImageRemove={handleImageRemove}
                                        size="sm"
                                    />
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <MoreVertical className="size-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewStudents();
                                        }}>
                                            <Eye className="size-4 mr-2" />
                                            View Students
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit();
                                        }}>
                                            <Edit className="size-4 mr-2" />
                                            Edit Class
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowDeleteDialog(true);
                                            }}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="size-4 mr-2" />
                                            Delete Class
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-foreground">
                                    {classData.course_code}
                                </h3>
                                {classData.class_name && (
                                    <Badge variant="secondary" className="text-xs">
                                        {classData.class_name}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {classData.semester && <span>{classData.semester}</span>}
                                {classData.semester && classData.academic_year && <span>•</span>}
                                {classData.academic_year && <span>{classData.academic_year}</span>}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-border">
                            <div className="flex items-center gap-2 text-sm">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Users className="size-4 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-foreground">
                                        {classData.student_count || 0}
                                    </span>
                                    <span className="text-xs text-muted-foreground">Students</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Class</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{classData.course_code}</strong>
                            {classData.class_name && ` - ${classData.class_name}`}? This action cannot be undone.
                            All students and data associated with this class will be removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
