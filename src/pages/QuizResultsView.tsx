import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Download,
    Search,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Users,
    CheckCircle2,
    XCircle,
    Clock,
    Trophy,
    Medal,
    BarChart3,
    CalendarDays
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export default function QuizResultsView() {
    const { classId, quizId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [quiz, setQuiz] = useState<any>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchData = async () => {
        if (!quizId || !classId) return;
        try {
            // 1. Fetch Quiz Details
            const { data: quizData } = await supabase
                .from('quizzes')
                .select('*, classes(class_name)')
                .eq('id', quizId)
                .single();
            setQuiz(quizData);

            // 2. Fetch Total Student Count
            const { count: enrolledCount } = await supabase
                .from('class_students')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', classId);

            // 3. Fetch Submissions
            const { data: subsData, error: subsError } = await supabase
                .from('quiz_submissions')
                .select('*')
                .eq('quiz_id', quizId)
                .neq('status', 'pending')
                .eq('is_archived', false);

            if (subsError) throw subsError;

            // 4. Fetch profiles
            const studentIds = (subsData || []).map(s => s.student_id).filter(Boolean);
            let profilesMap: Record<string, { full_name: string; avatar_url: string | null }> = {};

            if (studentIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', studentIds);

                profilesMap = (profilesData || []).reduce((acc, p) => {
                    acc[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
                    return acc;
                }, {} as Record<string, { full_name: string; avatar_url: string | null }>);
            }

            // Merge & Process
            const processed = (subsData || []).map(s => ({
                ...s,
                profiles: profilesMap[s.student_id] || null
            }));

            // Sort: Score DESC, Time ASC
            processed.sort((a, b) => {
                if (b.total_obtained !== a.total_obtained) return b.total_obtained - a.total_obtained;
                return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
            });

            const enriched = processed.map((s, index) => {
                const startTime = new Date(s.created_at).getTime();
                const endTime = new Date(s.submitted_at || s.created_at).getTime();
                const durationSeconds = Math.floor((endTime - startTime) / 1000);
                const minutes = Math.floor(durationSeconds / 60);
                const seconds = durationSeconds % 60;

                let timingLabel = 'On-Time';
                if (quizData?.due_date) {
                    const dueDate = new Date(quizData.due_date).getTime();
                    const submitDate = new Date(s.submitted_at).getTime();
                    if (dueDate - submitDate > 3600000) timingLabel = 'Early';
                    else if (submitDate > dueDate) timingLabel = 'Late';
                }

                return {
                    ...s,
                    rank: index + 1,
                    completionTime: `${minutes}m ${seconds}s`,
                    timingLabel,
                    percentage: Math.round((s.total_obtained / (quizData?.total_marks || 100)) * 100)
                };
            });

            setSubmissions(enriched);

            // Calculate Stats
            if (quizData) {
                const totalSubs = enriched.length;
                const passCount = enriched.filter(s => s.status === 'passed').length;
                const totalScore = enriched.reduce((sum, s) => sum + s.total_obtained, 0);
                const avgScore = totalSubs > 0 ? Math.round((totalScore / totalSubs) * 10) / 10 : 0;

                setStats({
                    totalSubmissions: totalSubs,
                    passCount,
                    passRate: totalSubs > 0 ? Math.round((passCount / totalSubs) * 100) : 0,
                    averageScore: avgScore,
                    totalStudents: enrolledCount || 0,
                    maxMarks: quizData.total_marks
                });
            }

        } catch (error: any) {
            toast.error('Failed to load results');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('quiz_results_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_submissions', filter: `quiz_id=eq.${quizId}` }, fetchData)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [quizId, classId]);

    // Filtering & Pagination
    const filtereddata = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return submissions.filter(s =>
            (s.profiles?.full_name || '').toLowerCase().includes(q) ||
            (s.student_id || '').toLowerCase().includes(q)
        );
    }, [submissions, searchQuery]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filtereddata.slice(start, start + itemsPerPage);
    }, [filtereddata, currentPage]);

    const totalPages = Math.ceil(filtereddata.length / itemsPerPage);

    const handleExport = () => {
        const data = submissions.map(s => ({
            Rank: s.rank,
            Student: s.profiles?.full_name || 'Unknown',
            Score: s.total_obtained,
            Max: quiz?.total_marks,
            Status: s.status,
            Time: s.completionTime,
            Date: new Date(s.submitted_at).toLocaleString()
        }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Results");
        XLSX.writeFile(wb, `Results_${quiz?.title}.xlsx`);
    };

    // Top performers podium logic (Only real submissions)
    const podiumStudents = submissions.slice(0, 3);

    if (loading) return <ResultsSkeleton />;

    return (
        <DashboardLayout fullHeight>
            <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
                {/* Header */}
                <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">
                            <ArrowLeft className="size-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-0.5">
                                <span>{quiz?.classes?.class_name}</span>
                                <ChevronRight className="size-4" />
                                <span>Results</span>
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                                {quiz?.title}
                                <Badge variant="outline" className="ml-2 font-normal text-xs bg-slate-100 text-slate-700 border-slate-200">
                                    {stats?.totalSubmissions} Submissions
                                </Badge>
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={handleExport} className="hidden sm:flex items-center gap-2 border-slate-300 dark:border-slate-700">
                            <Download className="size-4" />
                            Export
                        </Button>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6 lg:p-10 space-y-8">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Average Score"
                            value={`${stats?.averageScore || 0}`}
                            subValue={`/ ${stats?.maxMarks}`}
                            icon={BarChart3}
                            trend="Class Mean"
                        />
                        <StatCard
                            title="Pass Rate"
                            value={`${stats?.passRate || 0}%`}
                            subValue={`${stats?.passCount} Passed`}
                            icon={CheckCircle2}
                            trend="Performance"
                            trendColor="text-emerald-600"
                        />
                        <StatCard
                            title="Participation"
                            value={`${Math.round((stats?.totalSubmissions / (stats?.totalStudents || 1)) * 100)}%`}
                            subValue={`${stats?.totalSubmissions}/${stats?.totalStudents} Students`}
                            icon={Users}
                            trend="Turnout"
                            trendColor="text-blue-600"
                        />
                        <StatCard
                            title="Highest Score"
                            value={`${submissions[0]?.total_obtained || 0}`}
                            subValue={`Top Result`}
                            icon={Trophy}
                            trend="Record"
                            trendColor="text-amber-600"
                        />
                    </div>

                    {/* Content Area */}
                    {podiumStudents.length > 0 && (
                        <div className="flex flex-wrap justify-center items-end gap-6 mb-12 px-4 mt-8">
                            {/* 2nd Place */}
                            {podiumStudents[1] && (
                                <Card className="order-2 w-64 border-2 border-slate-400 dark:border-slate-500 shadow-xl relative bg-white dark:bg-slate-900 overflow-visible transform hover:-translate-y-1 transition-transform duration-300">
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-500 text-white font-bold px-3 py-1 rounded-full text-xs shadow-md uppercase tracking-wider z-10 w-max">
                                        2nd Place
                                    </div>
                                    <CardContent className="pt-8 pb-6 px-4 flex flex-col items-center text-center">
                                        <Avatar className="size-20 border-4 border-slate-100 dark:border-slate-800 shadow-lg mb-3">
                                            <AvatarImage src={podiumStudents[1].profiles?.avatar_url || undefined} />
                                            <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">{podiumStudents[1].profiles?.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate w-full text-base mb-1">{podiumStudents[1].profiles?.full_name}</h3>

                                        <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full mb-3">
                                            <Clock className="size-3" />
                                            <span className="text-xs font-bold">{podiumStudents[1].completionTime}</span>
                                        </div>

                                        <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <p className="text-2xl font-black text-slate-700 dark:text-slate-300">{podiumStudents[1].total_obtained}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* 1st Place */}
                            {podiumStudents[0] && (
                                <Card className="order-1 w-72 border-4 border-yellow-500 shadow-2xl relative bg-white dark:bg-slate-900 overflow-visible z-20 transform scale-105 mb-4 md:mb-0">
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-white font-black px-4 py-1.5 rounded-full text-sm shadow-lg uppercase tracking-wider flex items-center gap-2 z-10 w-max">
                                        <Trophy className="size-4 fill-white" /> 1st Place
                                    </div>
                                    <CardContent className="pt-10 pb-8 px-6 flex flex-col items-center text-center bg-gradient-to-b from-yellow-50/50 to-transparent dark:from-yellow-500/5 dark:to-transparent">
                                        <Avatar className="size-24 border-4 border-yellow-100 dark:border-yellow-500/20 shadow-xl ring-4 ring-yellow-500/10 mb-4">
                                            <AvatarImage src={podiumStudents[0].profiles?.avatar_url || undefined} />
                                            <AvatarFallback className="bg-yellow-100 text-yellow-700 font-bold">{podiumStudents[0].profiles?.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white truncate w-full mb-1">{podiumStudents[0].profiles?.full_name}</h3>

                                        <div className="flex items-center gap-1.5 text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-500/10 px-4 py-1 rounded-full mb-4">
                                            <Clock className="size-3.5" />
                                            <span className="text-xs font-black">{podiumStudents[0].completionTime}</span>
                                        </div>

                                        <div className="w-full pt-4 border-t border-yellow-100 dark:border-slate-800">
                                            <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{podiumStudents[0].total_obtained}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* 3rd Place */}
                            {podiumStudents[2] && (
                                <Card className="order-3 w-64 border-2 border-amber-700 shadow-xl relative bg-white dark:bg-slate-900 overflow-visible transform hover:-translate-y-1 transition-transform duration-300">
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-700 text-white font-bold px-3 py-1 rounded-full text-xs shadow-md uppercase tracking-wider z-10 w-max">
                                        3rd Place
                                    </div>
                                    <CardContent className="pt-8 pb-6 px-4 flex flex-col items-center text-center">
                                        <Avatar className="size-20 border-4 border-slate-100 dark:border-slate-800 shadow-lg mb-3">
                                            <AvatarImage src={podiumStudents[2].profiles?.avatar_url || undefined} />
                                            <AvatarFallback className="bg-amber-50 text-amber-800 font-bold">{podiumStudents[2].profiles?.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate w-full text-base mb-1">{podiumStudents[2].profiles?.full_name}</h3>

                                        <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full mb-3">
                                            <Clock className="size-3" />
                                            <span className="text-xs font-bold">{podiumStudents[2].completionTime}</span>
                                        </div>

                                        <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <p className="text-2xl font-black text-slate-700 dark:text-slate-300">{podiumStudents[2].total_obtained}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
                            <div>
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Details</CardTitle>
                                <p className="text-sm text-slate-500 mt-1">Detailed performance report for all submissions.</p>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                <Input
                                    placeholder="Search student..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50 dark:bg-slate-950">
                                        <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                            <TableHead className="w-[80px] font-medium text-slate-500">Rank</TableHead>
                                            <TableHead className="font-medium text-slate-500">Student</TableHead>
                                            <TableHead className="font-medium text-slate-500">Performance</TableHead>
                                            <TableHead className="font-medium text-slate-500">Score</TableHead>
                                            <TableHead className="font-medium text-slate-500">Time</TableHead>
                                            <TableHead className="font-medium text-slate-500 text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedData.map((s) => (
                                            <TableRow key={s.id} className={`border-slate-100 dark:border-slate-800 ${user?.id === s.student_id ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                                <TableCell className="font-semibold text-slate-700 dark:text-slate-300">
                                                    {s.rank <= 3 ? (
                                                        <span className={`inline-flex items-center justify-center size-7 rounded-full text-xs text-white ${s.rank === 1 ? 'bg-amber-500' : s.rank === 2 ? 'bg-slate-400' : 'bg-orange-600'
                                                            }`}>
                                                            {s.rank}
                                                        </span>
                                                    ) : (
                                                        <span className="pl-2">{s.rank}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="size-8 border border-slate-200 dark:border-slate-700">
                                                            <AvatarImage src={s.profiles?.avatar_url || undefined} />
                                                            <AvatarFallback className="text-xs bg-slate-100 text-slate-500">{s.profiles?.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                                {s.profiles?.full_name}
                                                                {user?.id === s.student_id && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-blue-100 text-blue-700">YOU</Badge>}
                                                            </div>
                                                            <div className="text-xs text-slate-500">ID: {s.student_id?.slice(0, 8)}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="w-[200px]">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${s.percentage >= 80 ? 'bg-emerald-500' : s.percentage >= 50 ? 'bg-blue-500' : 'bg-red-500'}`}
                                                                style={{ width: `${s.percentage}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-8">{s.percentage}%</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                        {s.total_obtained} <span className="text-slate-400 text-xs font-normal">/ {stats?.maxMarks}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-xs">
                                                        <span className="font-medium text-slate-700 dark:text-slate-300">{s.completionTime}</span>
                                                        <span className={`text-[10px] ${s.timingLabel === 'Late' ? 'text-red-500' : 'text-slate-400'}`}>{s.timingLabel}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="outline" className={`font-medium border ${s.status === 'passed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                        {s.status === 'passed' ? 'Passed' : 'Failed'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {paginatedData.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-48 text-center text-slate-500">
                                                    No results found matching your search.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-sm text-slate-500">Page {currentPage} of {totalPages}</span>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </main>
            </div>
        </DashboardLayout>
    );
}

function StatCard({ title, value, subValue, icon: Icon, trend, trendColor = "text-slate-500" }: any) {
    return (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <span className="text-sm font-medium text-slate-500">{title}</span>
                    <Icon className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</span>
                    <span className="text-sm text-slate-400">{subValue}</span>
                </div>
                <p className={`text-xs mt-2 font-medium ${trendColor}`}>
                    {trend}
                </p>
            </CardContent>
        </Card>
    );
}

function ResultsSkeleton() {
    return (
        <DashboardLayout fullHeight>
            <div className="p-6 space-y-8 h-full bg-slate-50 dark:bg-slate-950">
                <div className="flex justify-between">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-8 w-24" />
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
                <Skeleton className="h-96 rounded-xl" />
            </div>
        </DashboardLayout>
    );
}
