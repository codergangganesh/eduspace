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
        <Card className="group relative overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 w-full max-w-sm mx-auto flex flex-col h-full rounded-2xl bg-white dark:bg-slate-900">
            {/* Header Section - Blue Gradient */}
            <div className="relative h-32 bg-gradient-to-br from-blue-500 to-indigo-600 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm font-bold tracking-wider uppercase text-[10px] px-2.5 py-1">
                        {quiz.classes?.course_code || 'COURSE'}
                    </Badge>

                    <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(quiz.status)} hover:bg-opacity-90 border-none font-bold shadow-sm`}>
                            {quiz.status.toUpperCase()}
                        </Badge>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-white/20 text-white -mr-2">
                                    <MoreVertical className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => onEdit(quiz.id)}>
                                    <Edit2 className="size-4 mr-2" />
                                    Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {quiz.status === 'draft' && (
                                    <DropdownMenuItem onClick={() => onStatusChange(quiz.id, 'published')} className="text-emerald-600">
                                        <Globe className="size-4 mr-2" />
                                        Publish Quiz
                                    </DropdownMenuItem>
                                )}
                                {quiz.status === 'published' && (
                                    <DropdownMenuItem onClick={() => onStatusChange(quiz.id, 'closed')} className="text-red-600">
                                        <Lock className="size-4 mr-2" />
                                        Close Access
                                    </DropdownMenuItem>
                                )}
                                {quiz.status === 'closed' && (
                                    <DropdownMenuItem onClick={() => onStatusChange(quiz.id, 'published')} className="text-emerald-600">
                                        <Globe className="size-4 mr-2" />
                                        Re-open Query
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onDelete(quiz.id)} className="text-red-600">
                                    <Trash2 className="size-4 mr-2" />
                                    Delete Quiz
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <CardContent className="p-6 pt-6 flex flex-col h-full gap-6">
                {/* Title */}
                <div>
                    <h3 className="font-extrabold text-2xl leading-tight line-clamp-2 mb-3 text-slate-900 dark:text-slate-100">
                        {quiz.title}
                    </h3>

                    {/* Instructor Info */}
                    {instructor && (
                        <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-800 shadow-sm">
                                <AvatarImage src={instructor.avatar_url || ''} />
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-xs">
                                    {instructor.full_name?.charAt(0) || 'L'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                                {instructor.full_name}
                            </span>
                        </div>
                    )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-3">
                    {/* Questions */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="p-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 mb-1.5">
                            <FileText className="size-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{quiz._count?.questions || 0} Qs</span>
                    </div>

                    {/* Submissions */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="p-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 mb-1.5">
                            <Users className="size-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{quiz._count?.submissions || 0} Subs</span>
                    </div>

                    {/* Points */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="p-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 mb-1.5">
                            <Trophy className="size-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{quiz.total_marks} Pts</span>
                    </div>
                </div>

                {/* Action Area */}
                <div className="mt-auto">
                    <Button
                        onClick={() => onViewResults(quiz.id)}
                        className="w-full rounded-xl font-extrabold text-base h-14 shadow-lg shadow-amber-400/20 bg-[#FCD34D] hover:bg-[#FBBF24] text-slate-900 border-none transition-transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <BarChart className="size-5 mr-2" />
                        Explore Results
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
