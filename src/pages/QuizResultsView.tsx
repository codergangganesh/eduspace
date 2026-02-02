import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { QuizStats, QuizLeaderboard } from '@/components/quizzes/QuizDashboard';
import { Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function QuizResultsView() {
    const { classId, quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<any>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!quizId) return;
            try {
                setLoading(true);
                // 1. Fetch Quiz Details
                const { data: quizData } = await supabase
                    .from('quizzes')
                    .select('*, classes(student_count)') // Join to get total student count
                    .eq('id', quizId)
                    .single();
                setQuiz(quizData);

                // 2. Fetch Submissions with Student Profiles
                const { data: subsData } = await supabase
                    .from('quiz_submissions')
                    .select(`
                        *,
                        student:profiles!student_id(full_name, avatar_url)
                    `)
                    .eq('quiz_id', quizId)
                    .order('total_obtained', { ascending: false }); // Rank by score

                setSubmissions(subsData || []);

                // 3. Process Stats
                if (quizData && subsData) {
                    const totalSubs = subsData.length;
                    const passCount = subsData.filter(s => s.status === 'passed').length;
                    const failCount = subsData.filter(s => s.status === 'failed').length;
                    const totalScore = subsData.reduce((sum, s) => sum + s.total_obtained, 0);
                    const avgScore = totalSubs > 0 ? totalScore / totalSubs : 0;

                    // Leaderboard
                    const ranked = subsData.map((s, index) => ({
                        rank: index + 1,
                        student_name: s.student?.full_name || 'Unknown Student',
                        student_avatar: s.student?.avatar_url,
                        score: s.total_obtained,
                        total_marks: quizData.total_marks,
                        submitted_at: s.submitted_at
                    }));

                    setStats({
                        totalSubmissions: totalSubs,
                        passCount,
                        failCount,
                        totalStudents: quizData.classes?.student_count?.[0]?.count || 0, // Need to fix this join if student_count is not available directly or just use simple logic
                        averageScore: avgScore
                    });
                    setLeaderboard(ranked);
                }

            } catch (error) {
                console.error('Error fetching results:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [quizId]);

    const handleExport = () => {
        if (!submissions.length) return;

        const data = submissions.map(s => ({
            Student: s.student?.full_name || 'Unknown',
            Score: s.total_obtained,
            Total: quiz.total_marks,
            Status: s.status,
            SubmittedAt: new Date(s.submitted_at).toLocaleString()
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Quiz Results");
        XLSX.writeFile(wb, `Quiz_Results_${quiz.title}.xlsx`);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin size-10 text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/lecturer/quizzes/${classId}`)}>
                            <ArrowLeft className="size-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{quiz?.title} Results</h1>
                            <p className="text-muted-foreground">Performance analytics and student reports</p>
                        </div>
                    </div>
                    <Button onClick={handleExport} variant="outline" className="gap-2">
                        <Download className="size-4" />
                        Export Excel
                    </Button>
                </div>

                {/* Stats */}
                {stats && (
                    <QuizStats
                        {...stats}
                        totalStudents={quiz?.classes?.student_count || 0} // Fix this if needed
                    />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Leaderboard */}
                    <QuizLeaderboard entries={leaderboard} />

                    {/* Recent Submissions List or other details? For now just leaderboard is good */}
                    {/* Could list all students below? */}
                </div>
            </div>
        </DashboardLayout>
    );
}
