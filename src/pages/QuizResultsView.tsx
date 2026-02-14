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
                    .select('id, user_id, full_name, avatar_url')
                    .in('user_id', studentIds);

                profilesMap = (profilesData || []).reduce((acc, p) => {
                    // Map by user_id since that's what we have in submissions
                    const key = p.user_id || p.id;
                    acc[key] = { full_name: p.full_name, avatar_url: p.avatar_url };
                    return acc;
                }, {} as Record<string, { full_name: string; avatar_url: string | null }>);
            }

            // Merge & Process
            const processed = (subsData || []).map(s => ({
                ...s,
                profiles: profilesMap[s.student_id] || null
            }));

            // Sort: Score DESC, Time Taken ASC (faster is better), submitted_at ASC (fallback)
            processed.sort((a, b) => {
                if (b.total_obtained !== a.total_obtained) return b.total_obtained - a.total_obtained;

                // If time_taken exists and differs, use it (faster = lower value = better)
                if (a.time_taken !== undefined && b.time_taken !== undefined && a.time_taken !== b.time_taken) {
                    return a.time_taken - b.time_taken;
                }

                return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
            });

            const enriched = processed.map((s, index) => {
                let durationSeconds = 0;

                if (s.time_taken !== null && s.time_taken !== undefined) {
                    durationSeconds = s.time_taken;
                } else {
                    // Fallback for legacy data
                    const startTime = new Date(s.started_at || s.created_at).getTime();
                    const endTime = new Date(s.submitted_at || s.created_at).getTime();
                    durationSeconds = Math.floor((endTime - startTime) / 1000);
                    if (durationSeconds < 0) durationSeconds = 0;
                }

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
                            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 mb-0.5">
                                <span>{quiz?.classes?.class_name}</span>
                                <ChevronRight className="size-4" />
                                <span>Results</span>
                            </div>
                            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50 flex flex-wrap items-center gap-2 leading-tight">
                                <span className="truncate max-w-[120px] sm:max-w-none">{quiz?.title}</span>
                                <Badge variant="outline" className="font-normal text-[10px] sm:text-xs bg-slate-100 text-slate-700 border-slate-200 shrink-0">
                                    {stats?.totalSubmissions} Subs
                                </Badge>
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            className="flex items-center gap-2 border-slate-300 dark:border-slate-700 h-9 sm:h-10 px-3 sm:px-4"
                        >
                            <Download className="size-4" />
                            <span className="hidden sm:inline text-xs font-semibold">Export</span>
                        </Button>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                        <div className="flex flex-row flex-wrap justify-center items-center gap-4 sm:gap-6 mb-12 px-2 mt-4 sm:mt-8">
                            {/* 2nd Place */}
                            {podiumStudents[1] && (
                                <Card className="order-2 sm:order-1 size-44 sm:size-auto sm:w-64 aspect-square sm:aspect-auto rounded-full sm:rounded-2xl border-2 border-slate-400 dark:border-slate-500 shadow-xl relative bg-white dark:bg-slate-900 overflow-visible transform hover:-translate-y-1 transition-transform duration-300 flex items-center justify-center">
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-slate-500 text-white font-bold px-2 py-0.5 rounded-full text-[10px] shadow-md uppercase tracking-wider z-10 w-max sm:hidden">
                                        2nd
                                    </div>
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-500 text-white font-bold px-3 py-1 rounded-full text-xs shadow-md uppercase tracking-wider z-10 w-max hidden sm:block">
                                        2nd Place
                                    </div>
                                    <CardContent className="p-0 flex flex-col items-center text-center justify-center w-full">
                                        <Avatar className="size-14 sm:size-20 border-2 sm:border-4 border-slate-100 dark:border-slate-800 shadow-lg mb-1 sm:mb-3">
                                            <AvatarImage src={podiumStudents[1].profiles?.avatar_url || undefined} className="object-cover" />
                                            <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">{podiumStudents[1].profiles?.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate w-[100px] sm:w-full text-xs sm:text-base mb-0.5 sm:mb-1 px-2" title={podiumStudents[1].profiles?.full_name}>
                                            {podiumStudents[1].profiles?.full_name || 'Unknown'}
                                        </h3>

                                        <div className="text-lg sm:text-2xl font-black text-slate-700 dark:text-slate-300 leading-none">{podiumStudents[1].total_obtained}</div>
                                        <div className="text-[8px] sm:text-xs font-bold text-slate-400 uppercase sm:hidden">{podiumStudents[1].completionTime}</div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* 1st Place */}
                            {podiumStudents[0] && (
                                <Card className="order-1 sm:order-2 size-52 sm:size-auto sm:w-72 aspect-square sm:aspect-auto rounded-full sm:rounded-2xl border-4 border-yellow-500 shadow-2xl relative bg-white dark:bg-slate-900 overflow-visible z-20 transition-all sm:scale-105 mb-4 sm:mb-0 flex items-center justify-center">
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-white font-black px-3 py-1 rounded-full text-[10px] shadow-lg uppercase tracking-wider flex items-center gap-1 z-10 w-max sm:hidden">
                                        <Trophy className="size-3 fill-white" /> 1st
                                    </div>
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-white font-black px-4 py-1.5 rounded-full text-sm shadow-lg uppercase tracking-wider flex items-center gap-2 z-10 w-max hidden sm:flex">
                                        <Trophy className="size-4 fill-white" /> 1st Place
                                    </div>
                                    <CardContent className="p-0 flex flex-col items-center text-center justify-center w-full bg-gradient-to-b from-yellow-50/50 to-transparent dark:from-yellow-500/5 dark:to-transparent">
                                        <Avatar className="size-16 sm:size-24 border-2 sm:border-4 border-yellow-100 dark:border-yellow-500/20 shadow-xl ring-2 sm:ring-4 ring-yellow-500/10 mb-1 sm:mb-4">
                                            <AvatarImage src={podiumStudents[0].profiles?.avatar_url || undefined} className="object-cover" />
                                            <AvatarFallback className="bg-yellow-100 text-yellow-700 font-bold text-sm">{podiumStudents[0].profiles?.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <h3 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate w-[120px] sm:w-full mb-0.5 sm:mb-1 px-2" title={podiumStudents[0].profiles?.full_name}>
                                            {podiumStudents[0].profiles?.full_name || 'Unknown'}
                                        </h3>

                                        <div className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">{podiumStudents[0].total_obtained}</div>
                                        <div className="text-[10px] sm:text-xs font-black text-yellow-600 dark:text-yellow-400 uppercase sm:hidden">{podiumStudents[0].completionTime}</div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* 3rd Place */}
                            {podiumStudents[2] && (
                                <Card className="order-3 size-40 sm:size-auto sm:w-64 aspect-square sm:aspect-auto rounded-full sm:rounded-2xl border-2 border-amber-700 shadow-xl relative bg-white dark:bg-slate-900 overflow-visible transform hover:-translate-y-1 transition-transform duration-300 flex items-center justify-center">
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-amber-700 text-white font-bold px-2 py-0.5 rounded-full text-[10px] shadow-md uppercase tracking-wider z-10 w-max sm:hidden">
                                        3rd
                                    </div>
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-700 text-white font-bold px-3 py-1 rounded-full text-xs shadow-md uppercase tracking-wider z-10 w-max hidden sm:block">
                                        3rd Place
                                    </div>
                                    <CardContent className="p-0 flex flex-col items-center text-center justify-center w-full">
                                        <Avatar className="size-12 sm:size-20 border-2 sm:border-4 border-slate-100 dark:border-slate-800 shadow-lg mb-1 sm:mb-3">
                                            <AvatarImage src={podiumStudents[2].profiles?.avatar_url || undefined} className="object-cover" />
                                            <AvatarFallback className="bg-amber-50 text-amber-800 font-bold text-xs">{podiumStudents[2].profiles?.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate w-[80px] sm:w-full text-xs sm:text-base mb-0.5 sm:mb-1 px-2" title={podiumStudents[2].profiles?.full_name}>
                                            {podiumStudents[2].profiles?.full_name || 'Unknown'}
                                        </h3>

                                        <div className="text-base sm:text-2xl font-black text-slate-700 dark:text-slate-300 leading-none">{podiumStudents[2].total_obtained}</div>
                                        <div className="text-[8px] sm:text-xs font-bold text-slate-400 uppercase sm:hidden">{podiumStudents[2].completionTime}</div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
                            <div>
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Details</CardTitle>
                                <p className="text-sm text-slate-500 mt-1">Full Standings</p>
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
                                            <TableHead className="w-[60px] sm:w-[80px] font-medium text-slate-500 px-3 sm:px-4">Rank</TableHead>
                                            <TableHead className="font-medium text-slate-500 px-3 sm:px-4">Student</TableHead>
                                            <TableHead className="hidden md:table-cell font-medium text-slate-500">Performance</TableHead>
                                            <TableHead className="font-medium text-slate-500">Score</TableHead>
                                            <TableHead className="hidden sm:table-cell font-medium text-slate-500">Time</TableHead>
                                            <TableHead className="font-medium text-slate-500 text-right pr-3 sm:pr-6">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedData.map((s) => (
                                            <TableRow key={s.id} className={`border-slate-100 dark:border-slate-800 ${user?.id === s.student_id ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                                <TableCell className="font-semibold text-slate-700 dark:text-slate-300 px-3 sm:px-4">
                                                    {s.rank <= 3 ? (
                                                        <span className={`inline-flex items-center justify-center size-6 sm:size-7 rounded-full text-[10px] sm:text-xs text-white ${s.rank === 1 ? 'bg-amber-500' : s.rank === 2 ? 'bg-slate-400' : 'bg-orange-600'
                                                            }`}>
                                                            {s.rank}
                                                        </span>
                                                    ) : (
                                                        <span className="pl-2 text-xs sm:text-sm">{s.rank}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-3 sm:px-4">
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <Avatar className="size-7 sm:size-8 border border-slate-200 dark:border-slate-700">
                                                            <AvatarImage src={s.profiles?.avatar_url || undefined} />
                                                            <AvatarFallback className="text-[10px] sm:text-xs bg-slate-100 text-slate-500">{s.profiles?.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                                                                <span className="truncate">{s.profiles?.full_name}</span>
                                                                {user?.id === s.student_id && <Badge variant="secondary" className="text-[8px] sm:text-[10px] h-4 sm:h-5 px-1 bg-blue-100 text-blue-700 shrink-0">YOU</Badge>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell w-[200px]">
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
                                                <TableCell className="px-3 sm:px-4">
                                                    <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                                                        {s.total_obtained} <span className="text-slate-400 text-[10px] sm:text-xs font-normal">/ {stats?.maxMarks}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    <div className="flex flex-col text-[10px] sm:text-xs">
                                                        <span className="font-medium text-slate-700 dark:text-slate-300">{s.completionTime}</span>
                                                        <span className={`text-[9px] sm:text-[10px] ${s.timingLabel === 'Late' ? 'text-red-500' : 'text-slate-400'}`}>{s.timingLabel}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-3 sm:pr-6">
                                                    <Badge variant="outline" className={`font-black text-[9px] sm:text-xs px-2 py-0 border ${s.status === 'passed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                        {s.status === 'passed' ? 'PASS' : 'FAIL'}
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
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between space-y-0 pb-1 sm:pb-2">
                    <span className="text-[10px] sm:text-sm font-medium text-slate-500 truncate mr-1">{title}</span>
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400 shrink-0" />
                </div>
                <div className="flex items-baseline gap-1 sm:gap-2 mt-1 sm:mt-2">
                    <span className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</span>
                    <span className="text-[10px] sm:text-sm text-slate-400 truncate">{subValue}</span>
                </div>
                <p className={`text-[10px] sm:text-xs mt-1 sm:mt-2 font-semibold ${trendColor}`}>
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 sm:h-32 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm" />)}
                </div>
                <Skeleton className="h-96 rounded-xl" />
            </div>
        </DashboardLayout>
    );
}
