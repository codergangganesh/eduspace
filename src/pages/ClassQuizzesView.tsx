import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, BarChart, FileText, MoreVertical, Trash2, Globe, Clock, Lock, Edit2, LayoutGrid, List, TrendingUp, CheckCircle } from 'lucide-react';
import { useQuizzes } from '@/hooks/useQuizzes';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';

export default function ClassQuizzesView() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { quizzes, loading, updateQuizStatus, deleteQuiz } = useQuizzes(classId);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const handleCreateQuiz = () => {
        navigate(`/lecturer/quizzes/${classId}/create`);
    };

    const handleViewResults = (quizId: string) => {
        // Navigate to results page (to be implemented)
        navigate(`/lecturer/quizzes/${classId}/${quizId}/results`);
    };

    const handleEditQuiz = (quizId: string) => {
        navigate(`/lecturer/quizzes/${classId}/${quizId}/edit`);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20';
            case 'closed': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
            default: return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
        }
    };

    return (
        <DashboardLayout>
            <div className="w-full flex flex-col gap-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Class Quizzes</h1>
                        <p className="text-muted-foreground mt-1 text-lg">Manage and track quizzes for this class</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/50">
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className={cn("h-9 px-3 rounded-lg transition-all", viewMode === 'grid' && "shadow-sm")}
                            >
                                <LayoutGrid className="size-4 mr-2" />
                                <span className="text-xs font-semibold tracking-wide">Grid</span>
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className={cn("h-9 px-3 rounded-lg transition-all", viewMode === 'list' && "shadow-sm")}
                            >
                                <List className="size-4 mr-2" />
                                <span className="text-xs font-semibold tracking-wide">List</span>
                            </Button>
                        </div>
                        <Button onClick={handleCreateQuiz} className="gap-2 h-11 px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                            <Plus className="size-5" />
                            Create New Quiz
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : quizzes.length === 0 ? (
                    <Card className="border-dashed border-2 bg-muted/30">
                        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="p-6 rounded-full bg-primary/10 mb-6 group-hover:scale-110 transition-transform">
                                <FileText className="size-12 text-primary" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-3">No quizzes created yet</h3>
                            <p className="text-muted-foreground max-w-sm mb-8 text-lg">
                                Create your first quiz to assess student understanding and track performance.
                            </p>
                            <Button onClick={handleCreateQuiz} variant="outline" size="lg" className="h-12 px-8">
                                Create Your First Quiz
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className={cn(
                        viewMode === 'grid'
                            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                            : "flex flex-col gap-4"
                    )}>
                        {quizzes.map((quiz) => (
                            <Card
                                key={quiz.id}
                                className={cn(
                                    "group overflow-hidden border border-border/50 bg-card hover:shadow-xl transition-all duration-300",
                                    viewMode === 'grid' ? "rounded-2xl flex flex-col h-full" : "rounded-xl"
                                )}
                            >
                                <CardContent className={cn("p-0 h-full", viewMode === 'list' && "p-4")}>
                                    {viewMode === 'grid' ? (
                                        <div className="flex flex-col h-full">
                                            {/* Card Top Section */}
                                            <div className="p-6 flex-1 flex flex-col gap-5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("size-2 rounded-full animate-pulse",
                                                            quiz.status === 'published' ? "bg-emerald-500" :
                                                                quiz.status === 'closed' ? "bg-red-500" : "bg-yellow-500"
                                                        )} />
                                                        <Badge variant="secondary" className={cn(
                                                            "px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md border-none",
                                                            getStatusColor(quiz.status)
                                                        )}>
                                                            {quiz.status}
                                                        </Badge>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-muted transition-colors">
                                                                <MoreVertical className="size-3.5 text-muted-foreground" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl shadow-2xl border-border/50">
                                                            <DropdownMenuItem onClick={() => handleEditQuiz(quiz.id)} className="rounded-lg h-9 text-sm cursor-pointer">
                                                                <Edit2 className="size-3.5 mr-2 text-primary" />
                                                                Edit Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="my-1.5" />
                                                            {quiz.status === 'draft' && (
                                                                <DropdownMenuItem onClick={() => updateQuizStatus(quiz.id, 'published')} className="rounded-lg h-9 text-sm cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50/50">
                                                                    <Globe className="size-3.5 mr-2" />
                                                                    Publish Quiz
                                                                </DropdownMenuItem>
                                                            )}
                                                            {quiz.status === 'published' && (
                                                                <DropdownMenuItem onClick={() => updateQuizStatus(quiz.id, 'closed')} className="rounded-lg h-9 text-sm cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50/50">
                                                                    <Lock className="size-3.5 mr-2" />
                                                                    Close Access
                                                                </DropdownMenuItem>
                                                            )}
                                                            {quiz.status === 'closed' && (
                                                                <DropdownMenuItem onClick={() => updateQuizStatus(quiz.id, 'published')} className="rounded-lg h-9 text-sm cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50/50">
                                                                    <Globe className="size-3.5 mr-2" />
                                                                    Re-open Quiz
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator className="my-1.5" />
                                                            <DropdownMenuItem
                                                                className="rounded-lg h-9 text-sm cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                                                                onClick={() => {
                                                                    if (confirm('Permanently delete this quiz?')) {
                                                                        deleteQuiz(quiz.id);
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 className="size-3.5 mr-2" />
                                                                Delete Quiz
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                <div className="space-y-2 flex-1">
                                                    <h3 className="font-bold text-base leading-snug group-hover:text-primary transition-colors line-clamp-3 min-h-[3rem]">
                                                        {quiz.title}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80 font-medium">
                                                        <Clock className="size-2.5" />
                                                        {format(new Date(quiz.created_at), 'MMM d')}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-3 pt-5 border-t border-border/30">
                                                    <div className="flex items-center gap-2.5 bg-muted/20 p-2.5 rounded-xl border border-border/10">
                                                        <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                                                            <TrendingUp className="size-4" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-[10px] text-muted-foreground/60 uppercase font-black tracking-tighter">Stats</span>
                                                            <span className="font-black text-xs text-foreground truncate">{quiz._count?.submissions || 0} Students</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2.5 bg-muted/20 p-2.5 rounded-xl border border-border/10">
                                                        <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                                                            <CheckCircle className="size-4" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-[10px] text-muted-foreground/60 uppercase font-black tracking-tighter">Score</span>
                                                            <span className="font-black text-xs text-foreground truncate">{quiz.total_marks} Marks</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Action */}
                                            <div className="px-5 pb-5">
                                                <Button
                                                    variant="default"
                                                    className="w-full gap-2 h-10 shadow-lg shadow-primary/10 hover:shadow-primary/20 rounded-xl font-bold text-xs"
                                                    onClick={() => handleViewResults(quiz.id)}
                                                >
                                                    <BarChart className="size-3.5" />
                                                    Explore Results
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                                    <FileText className="size-6" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors truncate">{quiz.title}</h3>
                                                        <Badge variant="secondary" className={`${getStatusColor(quiz.status)} px-2 py-0 text-[10px] font-bold uppercase`}>
                                                            {quiz.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                            <Clock className="size-3" />
                                                            {format(new Date(quiz.created_at), 'MMM d, yyyy')}
                                                        </span>
                                                        <span className="text-xs font-bold text-foreground">
                                                            {quiz._count?.submissions || 0} Submissions
                                                        </span>
                                                        <span className="text-xs font-bold text-foreground">
                                                            {quiz.total_marks} Marks
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="flex-1 sm:flex-none h-10 px-4"
                                                    onClick={() => handleViewResults(quiz.id)}
                                                >
                                                    <BarChart className="size-4 mr-2" />
                                                    Results
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-10 w-10">
                                                            <MoreVertical className="size-5 text-muted-foreground" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 p-2">
                                                        <DropdownMenuItem onClick={() => handleEditQuiz(quiz.id)} className="h-10 cursor-pointer">
                                                            <Edit2 className="size-4 mr-2" />
                                                            Edit Quiz
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {quiz.status === 'draft' && (
                                                            <DropdownMenuItem onClick={() => updateQuizStatus(quiz.id, 'published')} className="h-10 cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50">
                                                                <Globe className="size-4 mr-2" />
                                                                Publish Now
                                                            </DropdownMenuItem>
                                                        )}
                                                        {quiz.status === 'published' && (
                                                            <DropdownMenuItem onClick={() => updateQuizStatus(quiz.id, 'closed')} className="h-10 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                                                                <Lock className="size-4 mr-2" />
                                                                Close Submissions
                                                            </DropdownMenuItem>
                                                        )}
                                                        {quiz.status === 'closed' && (
                                                            <DropdownMenuItem onClick={() => updateQuizStatus(quiz.id, 'published')} className="h-10 cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50">
                                                                <Globe className="size-4 mr-2" />
                                                                Re-open Quiz
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="h-10 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                                                            onClick={() => {
                                                                if (confirm('Are you sure you want to delete this quiz? This action is permanent.')) {
                                                                    deleteQuiz(quiz.id);
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="size-4 mr-2" />
                                                            Delete Quiz
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
