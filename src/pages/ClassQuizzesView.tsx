import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, BarChart, FileText, MoreVertical, Trash2, Globe, Clock, Lock } from 'lucide-react';
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

    const handleCreateQuiz = () => {
        navigate(`/lecturer/quizzes/${classId}/create`);
    };

    const handleViewResults = (quizId: string) => {
        // Navigate to results page (to be implemented)
        navigate(`/lecturer/quizzes/${classId}/${quizId}/results`);
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
                    <Button onClick={handleCreateQuiz} className="gap-2 h-11 px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                        <Plus className="size-5" />
                        Create New Quiz
                    </Button>
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
                    <div className="grid gap-6">
                        {quizzes.map((quiz) => (
                            <Card key={quiz.id} className="group overflow-hidden border-none bg-gradient-to-br from-card to-card/50 shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary/10 hover:border-l-primary">
                                <CardContent className="p-0">
                                    <div className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <Badge variant="secondary" className={`${getStatusColor(quiz.status)} px-3 py-1 text-xs font-semibold uppercase tracking-wider`}>
                                                    {quiz.status}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full">
                                                    <Clock className="size-3.5" />
                                                    {format(new Date(quiz.created_at), 'MMM d, yyyy')}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="font-bold text-2xl group-hover:text-primary transition-colors">{quiz.title}</h3>
                                                <p className="text-muted-foreground mt-2 text-base line-clamp-2 max-w-3xl">
                                                    {quiz.description || 'No description provided for this quiz.'}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-6 pt-2">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-muted-foreground uppercase font-semibold">Total Marks</span>
                                                    <span className="font-bold text-lg">{quiz.total_marks}</span>
                                                </div>
                                                <div className="h-8 w-px bg-border" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-muted-foreground uppercase font-semibold">Pass Criteria</span>
                                                    <span className="font-bold text-lg">{quiz.pass_percentage}%</span>
                                                </div>
                                                <div className="h-8 w-px bg-border" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-muted-foreground uppercase font-semibold">Questions</span>
                                                    <span className="font-bold text-lg">{quiz._count?.questions || 0}</span>
                                                </div>
                                                <div className="h-8 w-px bg-border" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-muted-foreground uppercase font-semibold">Submissions</span>
                                                    <span className="font-bold text-lg">{quiz._count?.submissions || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-border">
                                            <Button
                                                variant="default"
                                                className="flex-1 lg:flex-none gap-2 h-11 px-6 shadow-md"
                                                onClick={() => handleViewResults(quiz.id)}
                                            >
                                                <BarChart className="size-4" />
                                                Analytics & Results
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="icon" className="h-11 w-11">
                                                        <MoreVertical className="size-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 p-2">
                                                    <DropdownMenuItem onClick={() => handleViewResults(quiz.id)} className="h-10 cursor-pointer">
                                                        <BarChart className="size-4 mr-2" />
                                                        Detailed View
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
                                                        Delete Permanently
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
