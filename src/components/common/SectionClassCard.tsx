import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    ClipboardList,
    FileCheck,
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

export interface ClassData {
    id: string;
    class_name: string;
    course_code: string;
    lecturer_department?: string;
    student_count?: number;
    [key: string]: any;
}

export interface SectionClassCardProps {
    classData: ClassData;
    variant?: 'assignments' | 'schedule' | 'students' | 'quizzes';
    onAction?: (id: string, actionType?: string) => void;
    index?: number;
    onEdit?: (classData: ClassData) => void;
    onDelete?: (classData: ClassData) => void;
}

export const SectionClassCard = ({
    classData,
    variant = 'assignments',
    onAction,
    index,
    onEdit,
    onDelete
}: SectionClassCardProps) => {
    const colors = index !== undefined ? getCardColorByIndex(index) : getCardColor(classData.id);

    const getIcon = () => {
        switch (variant) {
            case 'assignments': return ClipboardList;
            case 'schedule': return Calendar;
            case 'students': return Users;
            case 'quizzes': return FileCheck;
            default: return BookOpen;
        }
    };

    const VariantIcon = getIcon();

    return (
        <Card
            className={cn(
                "relative overflow-hidden border-none rounded-3xl transition-all duration-500 group cursor-pointer shadow-lg hover:shadow-2xl hover:-translate-y-1",
                colors.bg
            )}
            onClick={() => onAction && onAction(classData.id)}
        >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-10 group-hover:scale-125 transition-transform duration-700 pointer-events-none">
                <VariantIcon className={cn("size-32", colors.accent)} />
            </div>

            {/* Gradient Overlay */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-br transition-all duration-500",
                "from-white/40 to-transparent dark:from-white/5",
                "group-hover:from-white/60 dark:group-hover:from-white/10",
                "pointer-events-none"
            )} />

            <CardContent className="p-4 md:p-6 relative z-10 flex flex-col h-full min-h-[140px] md:min-h-[180px]">
                {/* Header */}
                <div className="flex justify-between items-start mb-3 md:mb-6">
                    <div className={cn(
                        "p-2 md:p-3 rounded-xl md:rounded-2xl border backdrop-blur-md shadow-inner group-hover:scale-110 transition-transform duration-300",
                        "bg-white/40 dark:bg-white/10 border-white/40 dark:border-white/20"
                    )}>
                        <VariantIcon className={cn("size-4 md:size-6", colors.accent)} />
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge
                            className={cn(
                                "border-0 backdrop-blur-md px-2 md:px-3 font-bold text-[8px] md:text-[10px] tracking-wider py-0.5 md:py-1 rounded-lg shadow-sm",
                                "bg-white/60 dark:bg-white/20 text-slate-700 dark:text-white"
                            )}
                        >
                            {classData.course_code}
                        </Badge>

                        {(onEdit || onDelete) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 md:h-8 md:w-8 -mr-1 text-slate-400 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-white/20 z-40 relative rounded-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
                                    >
                                        <MoreVertical className="size-3.5 md:size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl shadow-xl border-none backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
                                    {onEdit && (
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(classData);
                                        }} className="h-10 rounded-xl cursor-pointer">
                                            <Edit className="size-4 mr-2" />
                                            Edit Class
                                        </DropdownMenuItem>
                                    )}
                                    {onDelete && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="h-10 rounded-xl cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
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
                <div className="flex-1">
                    <h3 className="font-black text-lg md:text-2xl text-slate-800 dark:text-white leading-tight mb-1 md:mb-2 group-hover:translate-x-1 transition-transform line-clamp-2">
                        {classData.class_name}
                    </h3>
                    {classData.lecturer_department && (
                        <p className="text-[10px] md:text-sm font-bold text-slate-500 dark:text-white/60 line-clamp-1 flex items-center gap-1.5 md:gap-2">
                            <span className={cn("size-1.5 md:size-2 rounded-full", colors.accent.replace('text-', 'bg-'), "opacity-40")} />
                            {classData.lecturer_department}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-4 md:mt-8 pt-4 md:pt-6 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-black text-slate-500 dark:text-white/70 uppercase tracking-tight">
                        <Users className="size-3 md:size-4" />
                        <span>{classData.student_count || 0} <span className="hidden xs:inline">Students</span></span>
                    </div>

                    <div className={cn(
                        "flex items-center gap-1 md:gap-1.5 text-[8px] md:text-[10px] font-black uppercase tracking-widest px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-lg transition-all",
                        "bg-white/60 dark:bg-white/10 text-slate-700 dark:text-white backdrop-blur-md border border-white/40 dark:border-white/20",
                        "group-hover:scale-105 active:scale-95"
                    )}>
                        {variant === 'assignments' ? 'Assignments' : variant === 'students' ? 'Students' : variant === 'quizzes' ? 'Quizzes' : 'Schedule'}
                        <ArrowRight className="size-2.5 md:size-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>

            </CardContent>
        </Card>
    );
};

export default SectionClassCard;
