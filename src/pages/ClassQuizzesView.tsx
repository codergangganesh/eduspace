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
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Class Quizzes</h1>
                        <p className="text-muted-foreground">Manage and track quizzes for this class</p>
                    </div>
                    <Button onClick={handleCreateQuiz} className="gap-2">
                        <Plus className="size-4" />
                        Create Quiz
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : quizzes.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-4 rounded-full bg-primary/10 mb-4">
                                <FileText className="size-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No quizzes created yet</h3>
                            <p className="text-muted-foreground max-w-sm mb-6">
                                Create your first quiz to assess student understanding.
                            </p>
                            <Button onClick={handleCreateQuiz} variant="outline">
                                Create Quiz
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {quizzes.map((quiz) => (
                            <Card key={quiz.id} className="group hover:shadow-md transition-all">
                                <CardContent className="p-6 flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="secondary" className={getStatusColor(quiz.status)}>
                                                {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="size-3" />
                                                Created {format(new Date(quiz.created_at), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-lg">{quiz.title}</h3>
                                        <p className="text-muted-foreground line-clamp-1 text-sm">
                                            {quiz.description || 'No description'}
                                        </p>
                                        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                                            <span>{quiz.total_marks} Marks</span>
                                            <span>•</span>
                                            <span>{quiz.pass_percentage}% Pass</span>
                                            <span>•</span>
                                            <span>{quiz._count?.questions || 0} Questions</span>
                                            <span>•</span>
                                            <span>{quiz._count?.submissions || 0} Submissions</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="hidden sm:flex gap-2"
                                            onClick={() => handleViewResults(quiz.id)}
                                        >
                                            <BarChart className="size-4" />
                                            Results
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleViewResults(quiz.id)}>
                                                    View Results
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {quiz.status === 'draft' && (
                                                    <DropdownMenuItem onClick={() => updateQuizStatus(quiz.id, 'published')}>
                                                        <Globe className="size-4 mr-2" />
                                                        Publish
                                                    </DropdownMenuItem>
                                                )}
                                                {quiz.status === 'published' && (
                                                    <DropdownMenuItem onClick={() => updateQuizStatus(quiz.id, 'closed')}>
                                                        <Lock className="size-4 mr-2" />
                                                        Close
                                                    </DropdownMenuItem>
                                                )}
                                                {quiz.status === 'closed' && (
                                                    <DropdownMenuItem onClick={() => updateQuizStatus(quiz.id, 'published')}>
                                                        <Globe className="size-4 mr-2" />
                                                        Re-open
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete this quiz?')) {
                                                            deleteQuiz(quiz.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="size-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
