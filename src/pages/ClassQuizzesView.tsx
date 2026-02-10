import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, BarChart, FileText, LayoutGrid, List, Clock, MoreVertical, Edit2, Globe, Lock, Trash2, Sparkles } from 'lucide-react';
import { useQuizzes } from '@/hooks/useQuizzes';
import { useAuth } from '@/contexts/AuthContext';
import { LecturerQuizCard } from '@/components/lecturer/LecturerQuizCard';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';
import { GridSkeleton } from '@/components/skeletons/GridSkeleton';
import { DeleteConfirmDialog } from '@/components/layout/DeleteConfirmDialog';

export default function ClassQuizzesView() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { quizzes, loading, updateQuizStatus, deleteQuiz } = useQuizzes(classId);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [quizToDelete, setQuizToDelete] = useState<string | null>(null);

    const handleCreateQuiz = () => {
        navigate(`/lecturer/quizzes/${classId}/create`);
    };

    const handleCreateAIQuiz = () => {
        navigate(`/lecturer/quizzes/${classId}/create-ai`);
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
                        <Button onClick={handleCreateAIQuiz} variant="outline" className="hidden sm:flex gap-2 h-11 px-6 border-violet-500/30 text-violet-600 hover:bg-violet-500/10 transition-all hover:scale-105 active:scale-95">
                            <Sparkles className="size-5" />
                            Create with AI
                        </Button>
                        <Button onClick={handleCreateQuiz} className="hidden sm:flex gap-2 h-11 px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                            <Plus className="size-5" />
                            Create New Quiz
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <GridSkeleton count={4} />
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
                            <div className="flex items-center gap-3">
                                <Button onClick={handleCreateAIQuiz} variant="outline" size="lg" className="h-12 px-8 border-violet-500/30 text-violet-600 hover:bg-violet-500/10">
                                    <Sparkles className="size-5 mr-2" />
                                    Create with AI
                                </Button>
                                <Button onClick={handleCreateQuiz} variant="outline" size="lg" className="h-12 px-8">
                                    Create Manually
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className={cn(
                        viewMode === 'grid'
                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-5"
                            : "flex flex-col gap-4"
                    )}>
                        {quizzes.map((quiz) => (
                            viewMode === 'grid' ? (
                                <LecturerQuizCard
                                    key={quiz.id}
                                    quiz={quiz}
                                    instructor={profile ? { full_name: profile.full_name, avatar_url: profile.avatar_url } : null}
                                    onViewResults={() => handleViewResults(quiz.id)}
                                    onEdit={() => handleEditQuiz(quiz.id)}
                                    onDelete={() => setQuizToDelete(quiz.id)}
                                    onStatusChange={(id, status) => updateQuizStatus(id, status)}
                                />
                            ) : (
                                <Card
                                    key={quiz.id}
                                    className="group overflow-hidden border border-border/50 bg-card hover:shadow-xl transition-all duration-300 rounded-xl"
                                >
                                    <CardContent className="p-4">
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
                                                            onClick={() => setQuizToDelete(quiz.id)}
                                                        >
                                                            <Trash2 className="size-4 mr-2" />
                                                            Delete Quiz
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        ))}
                    </div>
                )}
            </div>

            {/* Mobile FABs */}
            <div className="fixed bottom-6 right-6 sm:hidden z-40 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <Button
                    onClick={handleCreateAIQuiz}
                    size="icon"
                    className="size-14 rounded-full shadow-2xl bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all active:scale-95 border-4 border-background text-white"
                    title="Create with AI"
                >
                    <Sparkles className="size-6" />
                </Button>
                <Button
                    onClick={handleCreateQuiz}
                    size="icon"
                    className="size-16 rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-all active:scale-95 border-4 border-background text-primary-foreground"
                    title="Create New Quiz"
                >
                    <Plus className="size-8 text-white" />
                </Button>
            </div>

            <DeleteConfirmDialog
                open={!!quizToDelete}
                onOpenChange={(open) => !open && setQuizToDelete(null)}
                onConfirm={() => {
                    if (quizToDelete) {
                        deleteQuiz(quizToDelete);
                        setQuizToDelete(null);
                    }
                }}
                title="Delete Quiz?"
                description="This will permanently remove the quiz and all associated student results. This action cannot be undone."
            />
        </DashboardLayout>
    );
}
