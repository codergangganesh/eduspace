import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { FileText, Trophy, BarChart, MoreVertical, Edit2, Trash2, Globe, Lock, Users } from 'lucide-react';
import { Quiz } from '@/types/quiz';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface LecturerQuizCardProps {
    quiz: Quiz;
    instructor?: {
        full_name: string | null;
        avatar_url: string | null;
    } | null;
    onViewResults: (quizId: string) => void;
    onEdit: (quizId: string) => void;
    onDelete: (quizId: string) => void;
    onStatusChange: (quizId: string, status: 'published' | 'closed') => void;
}

export function LecturerQuizCard({
    quiz,
    instructor,
    onViewResults,
    onEdit,
    onDelete,
    onStatusChange
}: LecturerQuizCardProps) {

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'bg-emerald-400 text-emerald-950';
            case 'closed': return 'bg-red-400 text-red-950';
            default: return 'bg-yellow-400 text-yellow-950';
        }
    };

    return (
        <Card className={cn(
            "group relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 w-full flex flex-col h-full rounded-2xl bg-white dark:bg-[#1a1625] text-slate-900 dark:text-white",
            "border border-slate-200 dark:border-white/5"
        )}>
            {/* Header Section - Compact Gradient */}
            <div className="relative h-16 bg-gradient-to-br from-blue-600 to-blue-800 p-3 flex flex-col justify-between overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute -top-6 -right-6 size-20 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

                <div className="flex justify-between items-start relative z-10">
                    <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md font-bold tracking-wider uppercase text-[8px] px-2 py-1 rounded-md truncate max-w-[90px] shrink-0">
                        {quiz.classes?.course_code || 'COURSE'}
                    </Badge>

                    <div className="flex gap-1">
                        <Badge className={cn("border-none font-bold shadow-lg backdrop-blur-md px-2 py-0.5 rounded-md text-[8px]", getStatusColor(quiz.status))}>
                            {quiz.status.toUpperCase()}
                        </Badge>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-white hover:bg-white/20 hover:text-white rounded-full -mt-0.5 -mr-0.5"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreVertical className="size-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl p-2 shadow-2xl border-border">
                                <DropdownMenuItem onClick={() => onEdit(quiz.id)} className="rounded-xl h-10 px-3 cursor-pointer">
                                    <Edit2 className="size-4 mr-2" /> Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {quiz.status === 'draft' && (
                                    <DropdownMenuItem onClick={() => onStatusChange(quiz.id, 'published')} className="text-emerald-600 rounded-xl h-10 px-3 cursor-pointer">
                                        <Globe className="size-4 mr-2" /> Publish Quiz
                                    </DropdownMenuItem>
                                )}
                                {quiz.status === 'published' && (
                                    <DropdownMenuItem onClick={() => onStatusChange(quiz.id, 'closed')} className="text-red-600 rounded-xl h-10 px-3 cursor-pointer">
                                        <Lock className="size-4 mr-2" /> Close Access
                                    </DropdownMenuItem>
                                )}
                                {quiz.status === 'closed' && (
                                    <DropdownMenuItem onClick={() => onStatusChange(quiz.id, 'published')} className="text-emerald-600 rounded-xl h-10 px-3 cursor-pointer">
                                        <Globe className="size-4 mr-2" /> Re-open Quiz
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onDelete(quiz.id)} className="text-red-600 focus:text-red-600 rounded-xl h-10 px-3 cursor-pointer">
                                    <Trash2 className="size-4 mr-2" /> Delete Quiz
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Content Body - Compact */}
            <CardContent className="p-3 flex flex-col h-full gap-3 relative">
                {/* Title */}
                <div>
                    <h3 className="font-black text-sm leading-snug line-clamp-2 mb-2 text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors" title={quiz.title}>
                        {quiz.title}
                    </h3>

                    {/* Instructor Info */}
                    {instructor && (
                        <div className="flex items-center gap-1.5">
                            <Avatar className="h-5 w-5 border border-background shadow-sm shrink-0">
                                <AvatarImage src={instructor.avatar_url || ''} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-[8px]">
                                    {instructor.full_name?.charAt(0) || 'L'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 line-clamp-1">
                                {instructor.full_name}
                            </span>
                        </div>
                    )}
                </div>

                {/* Metrics Grid - Stacked for Consistency */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1.5">
                        <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5">
                            <FileText className="size-3 text-blue-500 shrink-0" />
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{quiz._count?.questions || 0} Questions</span>
                        </div>
                        <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5">
                            <Trophy className="size-3 text-amber-500 shrink-0" />
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{quiz.total_marks} Pts</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10">
                        <Users className="size-3 text-indigo-500 shrink-0" />
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                            {quiz._count?.submissions || 0} Submissions
                        </span>
                    </div>
                </div>

                {/* Action Area */}
                <div className="mt-auto">
                    <Button
                        onClick={() => onViewResults(quiz.id)}
                        className="w-full rounded-xl font-bold text-xs h-8 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 shadow transition-all flex items-center justify-center gap-1"
                    >
                        <BarChart className="size-3" />
                        Review Results
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
