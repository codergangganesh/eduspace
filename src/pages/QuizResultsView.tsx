import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { QuizStats, QuizLeaderboard, QuizSubmissionsTable } from '@/components/quizzes/QuizDashboard';
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
            if (!quizId || !classId) return;
            try {
                setLoading(true);
                // 1. Fetch Quiz Details
                const { data: quizData } = await supabase
                    .from('quizzes')
                    .select('*')
                    .eq('id', quizId)
                    .single();
                setQuiz(quizData);

                // 2. Fetch Total Student Count in Class
                const { count: enrolledCount } = await supabase
                    .from('class_students')
                    .select('*', { count: 'exact', head: true })
                    .eq('class_id', classId);

                // 3. Fetch Submissions (Raw)
                const { data: subsData, error: subsError } = await supabase
                    .from('quiz_submissions')
                    .select('*')
                    .eq('quiz_id', quizId)
                    .order('total_obtained', { ascending: false });

                if (subsError) throw subsError;

                // 4. Fetch Class Student Data (to get the name used in class)
                let enrichedSubmissions: any[] = [];
                if (subsData && subsData.length > 0) {
                    const studentIds = subsData.map(s => s.student_id);
                    const { data: classStudentData } = await supabase
                        .from('class_students')
                        .select('student_id, student_name')
                        .eq('class_id', classId)
                        .in('student_id', studentIds);

                    const classStudentMap = new Map(classStudentData?.map(cs => [cs.student_id, cs.student_name]) || []);

                    enrichedSubmissions = subsData.map(s => ({
                        ...s,
                        student: {
                            full_name: classStudentMap.get(s.student_id) || 'Unknown Student'
                        }
                    }));
                }

                setSubmissions(enrichedSubmissions);

                // 5. Process Stats
                if (quizData) {
                    const totalSubs = enrichedSubmissions.length;
                    const passCount = enrichedSubmissions.filter(s => s.status === 'passed').length;
                    const failCount = enrichedSubmissions.filter(s => s.status === 'failed').length;
                    const totalScore = enrichedSubmissions.reduce((sum, s) => sum + s.total_obtained, 0);
                    const avgScore = totalSubs > 0 ? totalScore / totalSubs : 0;

                    // Leaderboard
                    const ranked = enrichedSubmissions.map((s, index) => ({
                        rank: index + 1,
                        student_name: s.student?.full_name || 'Unknown Student',
                        score: s.total_obtained,
                        total_marks: quizData.total_marks,
                        submitted_at: s.submitted_at
                    }));

                    setStats({
                        totalSubmissions: totalSubs,
                        passCount,
                        failCount,
                        totalStudents: enrolledCount || 0,
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
    }, [quizId, classId]);

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
            <div className="w-full space-y-8 animate-in fade-in duration-500">
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
                {stats && <QuizStats {...stats} />}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Leaderboard (Left Side) - Takes 1 column */}
                    <div className="lg:col-span-1">
                        <QuizLeaderboard entries={leaderboard} />
                    </div>

                    {/* Detailed Submissions Table (Right Side) - Takes 2 columns */}
                    <div className="lg:col-span-2">
                        <QuizSubmissionsTable submissions={submissions} />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
