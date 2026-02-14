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
        <Card className="group relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 w-full flex flex-col h-full rounded-[2rem] bg-white dark:bg-slate-900">
            {/* Header Section - Premium Gradient */}
            <div className="relative h-24 sm:h-32 bg-gradient-to-br from-indigo-500 via-purple-600 to-fuchsia-600 p-4 sm:p-6 flex flex-col justify-between overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute -top-10 -right-10 size-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

                <div className="flex justify-between items-start relative z-10">
                    <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md font-bold tracking-wider uppercase text-[8px] sm:text-[10px] px-2 md:px-2.5 py-1 sm:py-1.5 rounded-lg truncate max-w-[100px] sm:max-w-none">
                        {quiz.classes?.course_code || 'COURSE'}
                    </Badge>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Badge className={cn("border-none font-bold shadow-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[8px] sm:text-[10px]", getStatusColor(quiz.status))}>
                            {quiz.status.toUpperCase()}
                        </Badge>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8 rounded-full hover:bg-white/20 text-white -mr-1 sm:-mr-2">
                                    <MoreVertical className="size-3.5 sm:size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-2xl border-none backdrop-blur-xl bg-white/95 dark:bg-slate-900/95">
                                <DropdownMenuItem onClick={() => onEdit(quiz.id)} className="rounded-xl h-10 px-3 cursor-pointer">
                                    <Edit2 className="size-4 mr-2" />
                                    Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {quiz.status === 'draft' && (
                                    <DropdownMenuItem onClick={() => onStatusChange(quiz.id, 'published')} className="text-emerald-600 rounded-xl h-10 px-3 cursor-pointer">
                                        <Globe className="size-4 mr-2" />
                                        Publish Quiz
                                    </DropdownMenuItem>
                                )}
                                {quiz.status === 'published' && (
                                    <DropdownMenuItem onClick={() => onStatusChange(quiz.id, 'closed')} className="text-red-600 rounded-xl h-10 px-3 cursor-pointer">
                                        <Lock className="size-4 mr-2" />
                                        Close Access
                                    </DropdownMenuItem>
                                )}
                                {quiz.status === 'closed' && (
                                    <DropdownMenuItem onClick={() => onStatusChange(quiz.id, 'published')} className="text-emerald-600 rounded-xl h-10 px-3 cursor-pointer">
                                        <Globe className="size-4 mr-2" />
                                        Re-open Query
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onDelete(quiz.id)} className="text-red-600 focus:text-red-600 rounded-xl h-10 px-3 cursor-pointer">
                                    <Trash2 className="size-4 mr-2" />
                                    Delete Quiz
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <CardContent className="p-4 sm:p-6 flex flex-col h-full gap-4 sm:gap-6">
                {/* Title */}
                <div>
                    <h3 className="font-black text-base sm:text-2xl leading-tight line-clamp-2 mb-2 sm:mb-3 text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">
                        {quiz.title}
                    </h3>

                    {/* Instructor Info */}
                    {instructor && (
                        <div className="flex items-center gap-2 sm:gap-2.5">
                            <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-background shadow-md">
                                <AvatarImage src={instructor.avatar_url || ''} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-[8px] sm:text-xs">
                                    {instructor.full_name?.charAt(0) || 'L'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
                                {instructor.full_name}
                            </span>
                        </div>
                    )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    {/* Questions */}
                    <div className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 shadow-inner">
                        <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-1 sm:mb-1.5">
                            <FileText className="size-3 sm:size-4" />
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-200">{quiz._count?.questions || 0}</span>
                            <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tight">Quest</span>
                        </div>
                    </div>

                    {/* Submissions */}
                    <div className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 shadow-inner">
                        <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-1 sm:mb-1.5">
                            <Users className="size-3 sm:size-4" />
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-200">{quiz._count?.submissions || 0}</span>
                            <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tight">Subs</span>
                        </div>
                    </div>

                    {/* Points */}
                    <div className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 shadow-inner">
                        <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-1 sm:mb-1.5">
                            <Trophy className="size-3 sm:size-4" />
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-200">{quiz.total_marks}</span>
                            <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tight">Pts</span>
                        </div>
                    </div>
                </div>

                {/* Action Area */}
                <div className="mt-auto pt-2">
                    <Button
                        onClick={() => onViewResults(quiz.id)}
                        className="w-full rounded-2xl font-black text-xs sm:text-base h-10 sm:h-14 shadow-lg shadow-amber-400/20 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-900 border-none transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <BarChart className="size-4 sm:size-5 mr-1.5 sm:mr-2" />
                        View Results
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
