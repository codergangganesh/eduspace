import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    BookOpen,
    Users,
    ArrowRight,
    MoreVertical,
    Edit,
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCardColor, getCardColorByIndex } from "@/lib/card-styles";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface ClassData {
    id: string;
    class_name: string;
    course_code: string;
    lecturer_department?: string;
    student_count?: number;
    [key: string]: any;
}

interface SectionClassCardProps {
    classData: ClassData;
    variant?: 'assignments' | 'schedule' | 'students';
    onAction?: (id: string) => void;
    index?: number;
    onEdit?: (classData: ClassData) => void;
    onDelete?: (classData: ClassData) => void;
}

export function SectionClassCard({
    classData,
    variant = 'assignments',
    onAction,
    index,
    onEdit,
    onDelete
}: SectionClassCardProps) {
    const colors = index !== undefined ? getCardColorByIndex(index) : getCardColor(classData.id);

    return (
        <Card
            className={cn(
                "relative overflow-hidden border rounded-2xl transition-all duration-300 group cursor-pointer",
                colors.bg,
                colors.border,
                "shadow-sm hover:shadow-md hover:scale-[1.01]"
            )}
            onClick={() => onAction && onAction(classData.id)}
        >
            {/* Gradient Overlay */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-50",
                "from-white/40 to-transparent dark:from-white/5",
                "pointer-events-none"
            )} />

            <CardContent className="p-5 relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-950/20 backdrop-blur-md shadow-sm">
                        <BookOpen className={cn("size-5", colors.accent)} />
                    </div>

                    <div className="flex gap-2">
                        <Badge
                            variant="secondary"
                            className="bg-white/60 dark:bg-slate-950/20 backdrop-blur-md border-0"
                        >
                            {classData.course_code}
                        </Badge>

                        {(onEdit || onDelete) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 -mr-2 text-muted-foreground hover:text-foreground z-20"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreVertical className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {onEdit && (
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(classData);
                                        }}>
                                            <Edit className="size-4 mr-2" />
                                            Edit Class
                                        </DropdownMenuItem>
                                    )}
                                    {onDelete && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(classData);
                                                }}
                                            >
                                                <Trash2 className="size-4 mr-2" />
                                                Delete Class
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                    <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {classData.class_name}
                    </h3>
                    {classData.lecturer_department && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                            {classData.lecturer_department}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Users className="size-3.5" />
                        <span>{classData.student_count || 0} Students</span>
                    </div>

                    <div className={cn(
                        "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-white/50 dark:bg-black/20",
                        colors.accent
                    )}>
                        {variant === 'assignments' ? 'Assignments' : variant === 'students' ? 'Students' : 'Schedule'}
                        <ArrowRight className="size-3" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
