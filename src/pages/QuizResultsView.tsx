import { useState, useEffect, useMemo, useRef } from 'react';
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
    Award,
    Users as UsersIcon,
    CheckCircle2,
    XCircle,
    Clock,
    LayoutDashboard,
    Timer,
    AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function QuizResultsView() {
    const { classId, quizId } = useParams();
    const navigate = useNavigate();
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
            // 1. Fetch Quiz Details (including due_date)
            const { data: quizData } = await supabase
                .from('quizzes')
                .select('*, classes(class_name)')
                .eq('id', quizId)
                .single();
            setQuiz(quizData);

            // 2. Fetch Total Student Count in Class
            const { count: enrolledCount } = await supabase
                .from('class_students')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', classId);

            // 3. Fetch Submissions first
            const { data: subsData, error: subsError } = await supabase
                .from('quiz_submissions')
                .select('*')
                .eq('quiz_id', quizId)
                .neq('status', 'pending')
                .eq('is_archived', false)
                .order('total_obtained', { ascending: false })
                .order('submitted_at', { ascending: true });

            if (subsError) throw subsError;

            // 4. Fetch profiles for all students in submissions
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

            // Merge profiles with submissions
            const subsWithProfiles = (subsData || []).map(s => ({
                ...s,
                profiles: profilesMap[s.student_id] || null
            }));

            // Process Submissions
            const enrichedSubmissions = subsWithProfiles.map((s, index) => {
                const startTime = new Date(s.created_at).getTime();
                const endTime = new Date(s.submitted_at || s.created_at).getTime();
                const durationSeconds = Math.floor((endTime - startTime) / 1000);
                const minutes = Math.floor(durationSeconds / 60);
                const seconds = durationSeconds % 60;

                // Submission timing label
                let timingLabel = 'On-Time';
                if (quizData?.due_date) {
                    const dueDate = new Date(quizData.due_date).getTime();
                    const submitDate = new Date(s.submitted_at).getTime();

                    // "Early" if submitted > 1 hour before deadline
                    if (dueDate - submitDate > 3600000) timingLabel = 'Early Submission';
                    else if (submitDate > dueDate) timingLabel = 'Late Submission';
                    else timingLabel = 'On-Time Submission';
                }

                return {
                    ...s,
                    rank: index + 1,
                    completionTime: `${minutes}m ${seconds}s`,
                    timingLabel,
                    percentage: Math.round((s.total_obtained / (quizData?.total_marks || 100)) * 100)
                };
            });

            setSubmissions(enrichedSubmissions);

            // 5. Calculate Stats
            if (quizData) {
                const totalSubs = enrichedSubmissions.length;
                const passCount = enrichedSubmissions.filter(s => s.status === 'passed').length;
                const failCount = totalSubs - passCount;
                const passRate = totalSubs > 0 ? Math.round((passCount / totalSubs) * 100) : 0;
                const totalScore = enrichedSubmissions.reduce((sum, s) => sum + s.total_obtained, 0);
                const avgScorePercentage = totalSubs > 0 ? Math.round((totalScore / (totalSubs * quizData.total_marks)) * 1000) / 10 : 0;
                const topScore = enrichedSubmissions.length > 0 ? Math.max(...enrichedSubmissions.map(s => s.total_obtained)) : 0;

                setStats({
                    totalSubmissions: totalSubs,
                    passCount,
                    failCount,
                    totalStudents: enrolledCount || 0,
                    averageScore: avgScorePercentage,
                    passRate,
                    topScore,
                    maxMarks: quizData.total_marks
                });
            }

        } catch (error: any) {
            console.error('Error fetching results:', error);
            toast.error('Failed to load leaderboard data: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Real-time updates
        const channel = supabase
            .channel('quiz_results_updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'quiz_submissions',
                    filter: `quiz_id=eq.${quizId}`
                },
                (payload) => {
                    console.log('Real-time submission update:', payload);
                    fetchData(); // Recalculate everything on any change
                    if (payload.eventType === 'INSERT') {
                        toast.success('New submission received!');
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [quizId, classId]);

    const handleExport = () => {
        if (!submissions.length) return;

        const data = submissions.map(s => ({
            Rank: s.rank,
            Student: s.profiles?.full_name || 'Unknown student',
            Score: s.total_obtained,
            Total: quiz.total_marks,
            Percentage: `${s.percentage}%`,
            Timing: s.timingLabel,
            CompletionTime: s.completionTime,
            Status: s.status.toUpperCase(),
            SubmittedAt: new Date(s.submitted_at).toLocaleString()
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Quiz Results");
        XLSX.writeFile(wb, `Quiz_Results_${quiz?.title || 'Report'}.xlsx`);
    };

    const filteredSubmissions = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return submissions.filter(s => {
            const name = (s.profiles?.full_name || 'unknown student').toLowerCase();
            const sid = (s.student_id || '').toLowerCase();
            return name.includes(query) || sid.includes(query);
        });
    }, [submissions, searchQuery]);

    const paginatedSubmissions = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredSubmissions.slice(start, start + itemsPerPage);
    }, [filteredSubmissions, currentPage]);

    const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);

    // Top performers podium logic (Only real submissions)
    const podiumStudents = submissions.slice(0, 3);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="h-[calc(100vh-64px)] w-full overflow-hidden flex flex-col space-y-8 p-6 lg:p-10 animate-pulse bg-[#070b14]">
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-64 bg-slate-800" />
                            <Skeleton className="h-4 w-48 bg-slate-800" />
                        </div>
                        <Skeleton className="h-14 w-48 bg-slate-800 rounded-2xl" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Skeleton className="h-32 bg-slate-800/50 rounded-[2rem]" />
                        <Skeleton className="h-32 bg-slate-800/50 rounded-[2rem]" />
                        <Skeleton className="h-32 bg-slate-800/50 rounded-[2rem]" />
                    </div>
                    <div className="flex-1 bg-slate-800/20 rounded-[2.5rem]" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout fullHeight>
            <div className="h-full overflow-hidden flex flex-col bg-[#070b14] text-slate-100 font-sans selection:bg-blue-500/30">
                {/* Fixed Header section */}
                <header className="shrink-0 p-4 lg:p-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-700 w-full">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <nav className="flex items-center gap-2 text-sm font-medium text-slate-400">
                                <button onClick={() => navigate('/lecturer/quizzes')} className="hover:text-blue-400 transition-colors">Courses</button>
                                <ChevronRight className="size-4" />
                                <button onClick={() => navigate(`/lecturer/quizzes/${classId}`)} className="hover:text-blue-400 transition-colors">{quiz?.classes?.class_name || 'Class'}</button>
                                <ChevronRight className="size-4" />
                                <span className="text-slate-100 italic font-black">Leaderboard</span>
                            </nav>
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" className="group rounded-full hover:bg-slate-800 text-slate-300 transition-all hover:-translate-x-1" onClick={() => navigate(`/lecturer/quizzes/${classId}`)}>
                                    <ArrowLeft className="size-6" />
                                </Button>
                                <div>
                                    <h1 className="text-3xl lg:text-5xl font-black tracking-tighter text-white italic leading-none drop-shadow-sm">
                                        {quiz?.title}
                                    </h1>
                                    <p className="text-slate-400 font-bold flex items-center gap-2 mt-2 text-sm lg:text-base">
                                        <CheckCircle2 className="size-4 text-emerald-500" />
                                        {stats?.totalSubmissions} Verified Submissions • Due: {quiz?.due_date ? new Date(quiz.due_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No deadline'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden lg:flex items-center gap-4 mr-4">
                                <div className="bg-[#111827]/80 backdrop-blur-md border border-slate-800/50 rounded-2xl px-6 py-3 flex items-center gap-6 shadow-2xl ring-1 ring-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black">Pass Rate</span>
                                        <span className="text-2xl font-black text-emerald-400 tracking-tighter">{stats?.passRate}%</span>
                                    </div>
                                    <div className="h-8 w-px bg-slate-800/50" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black">Failed</span>
                                        <span className="text-2xl font-black text-rose-400 tracking-tighter">{stats?.failCount}</span>
                                    </div>
                                </div>
                            </div>
                            <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-500 text-white border-none h-14 px-8 rounded-2xl font-black shadow-lg shadow-blue-900/40 transition-all hover:scale-105 active:scale-95 gap-3 tracking-wide">
                                <Download className="size-5" />
                                EXPORT EXCEL
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Scrollable Main Content Zone */}
                <main className="flex-1 overflow-y-auto min-h-0 bg-transparent scroll-smooth custom-scrollbar w-full">
                    <div className="p-4 lg:p-8 space-y-12 animate-in fade-in zoom-in-95 duration-1000">

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                            <div className="bg-[#111827]/40 backdrop-blur-xl border border-slate-800/60 p-8 rounded-[2rem] shadow-2xl group hover:border-blue-500/30 transition-all">
                                <p className="text-slate-500 font-black text-[11px] uppercase tracking-[0.2em] mb-3">Class Average</p>
                                <div className="flex items-end gap-3">
                                    <h3 className="text-5xl font-black text-white leading-none">{stats?.averageScore}%</h3>
                                    <div className="flex items-center gap-1 text-emerald-400 font-black mb-1 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        <TrendingUp className="size-4" />
                                        <span>+5.2%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#111827]/40 backdrop-blur-xl border border-slate-800/60 p-8 rounded-[2rem] shadow-2xl group hover:border-blue-500/30 transition-all">
                                <p className="text-slate-500 font-black text-[11px] uppercase tracking-[0.2em] mb-3">Top Score</p>
                                <div className="flex items-end gap-3">
                                    <h3 className="text-5xl font-black text-white leading-none">{stats?.topScore}/{stats?.maxMarks}</h3>
                                    <p className="text-slate-500 italic mb-1 text-xs font-bold uppercase tracking-widest bg-slate-800/50 px-3 py-1 rounded-full">Record</p>
                                </div>
                            </div>

                            <div className="bg-[#111827]/40 backdrop-blur-xl border border-slate-800/60 p-8 rounded-[2rem] shadow-2xl group hover:border-blue-500/30 transition-all relative overflow-hidden">
                                <p className="text-slate-500 font-black text-[11px] uppercase tracking-[0.2em] mb-3">Total Students</p>
                                <div className="flex items-end gap-3">
                                    <h3 className="text-5xl font-black text-white leading-none">{stats?.totalStudents}</h3>
                                    <p className="text-slate-500 mb-1 text-xs font-bold uppercase tracking-widest">{Math.round((stats?.totalSubmissions / (stats?.totalStudents || 1)) * 100)}% Turnout</p>
                                </div>
                            </div>
                        </div>

                        {/* Top Performers Podium */}
                        {podiumStudents.length > 0 && (
                            <div className="space-y-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-yellow-500/20 rounded-2xl shadow-inner">
                                        <Award className="size-7 text-yellow-500" />
                                    </div>
                                    <h2 className="text-3xl font-black text-white tracking-tight italic">Top Performers</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 items-end min-h-[460px] px-4">
                                    {/* 2nd Place */}
                                    {podiumStudents.length >= 2 ? (
                                        <div className="order-2 md:order-1 h-[85%] bg-[#111827]/40 backdrop-blur-xl border border-slate-800/60 rounded-[3rem] p-8 flex flex-col items-center justify-center text-center relative group hover:border-blue-500/20 hover:bg-[#111827]/60 transition-all shadow-xl">
                                            <div className="absolute -top-5 bg-slate-700 text-white px-8 py-2.5 rounded-full font-black text-xs uppercase shadow-2xl tracking-[0.3em] flex items-center gap-2 border border-slate-600">🥈 2nd Place</div>
                                            <div className="relative mb-6">
                                                <div className="size-28 rounded-full border-4 border-slate-500 overflow-hidden shadow-2xl ring-8 ring-slate-800/20 group-hover:ring-blue-500/10 transition-all">
                                                    <img src={podiumStudents[1]?.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${podiumStudents[1]?.profiles?.full_name}`} className="w-full h-full object-cover" alt="Podium" />
                                                </div>
                                            </div>
                                            <h4 className="text-2xl font-black text-white mb-1 leading-tight">{podiumStudents[1]?.profiles?.full_name}</h4>
                                            <p className="text-slate-500 text-xs font-black mb-6 uppercase tracking-widest opacity-60">ID #ST-{podiumStudents[1]?.student_id?.slice(0, 4)}</p>
                                            <div className="space-y-3">
                                                <p className="text-4xl font-black text-white italic">{podiumStudents[1]?.total_obtained}<span className="text-xl text-slate-500 not-italic">/{stats?.maxMarks}</span></p>
                                                <Badge variant="outline" className="px-5 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-blue-500/30">
                                                    {podiumStudents[1]?.timingLabel.split(' ')[0]}
                                                </Badge>
                                            </div>
                                        </div>
                                    ) : <div className="hidden md:block order-2 md:order-1" />}

                                    {/* 1st Place */}
                                    <div className="order-1 md:order-2 h-full bg-gradient-to-br from-[#1e293b]/80 to-[#0f172a]/90 backdrop-blur-2xl border-2 border-yellow-500/40 rounded-[3.5rem] p-10 flex flex-col items-center justify-center text-center relative shadow-[0_0_80px_rgba(234,179,8,0.1)] ring-1 ring-yellow-500/20 scale-105 z-10">
                                        <div className="absolute -top-7 bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-10 py-3.5 rounded-full font-black text-sm uppercase shadow-[0_10px_40px_rgba(234,179,8,0.4)] flex items-center gap-3 tracking-[0.3em] border-2 border-white/20">
                                            <Award className="size-5 fill-black" />
                                            1st Place 🥇
                                        </div>
                                        <div className="relative mb-8">
                                            <div className="size-36 rounded-full border-4 border-yellow-400 overflow-hidden shadow-[0_0_50px_rgba(250,204,21,0.3)] ring-12 ring-yellow-400/10 animate-glow">
                                                <img src={podiumStudents[0]?.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${podiumStudents[0]?.profiles?.full_name}`} className="w-full h-full object-cover" alt="Winner" />
                                            </div>
                                        </div>
                                        <h4 className="text-3xl font-black text-white mb-1 leading-tight">{podiumStudents[0]?.profiles?.full_name}</h4>
                                        <p className="text-slate-400 text-xs font-black mb-8 uppercase tracking-[0.2em]">STUDENT ID #ST-{podiumStudents[0]?.student_id?.slice(0, 4)}</p>
                                        <div className="space-y-4">
                                            <p className="text-6xl font-black text-yellow-400 drop-shadow-[0_4px_10px_rgba(250,204,21,0.4)] italic">{podiumStudents[0]?.total_obtained}<span className="text-2xl text-yellow-400/50 not-italic">/{stats?.maxMarks}</span></p>
                                            <div className={`inline-flex px-8 py-3 rounded-full text-xs font-black uppercase tracking-[0.3em] border shadow-inner ${podiumStudents[0]?.status === 'passed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                }`}>
                                                {podiumStudents[0]?.status === 'passed' ? 'PASSED EXCELLENT' : 'FAILED QUIZ'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3rd Place */}
                                    {podiumStudents.length >= 3 ? (
                                        <div className="order-3 h-[80%] bg-[#111827]/40 backdrop-blur-xl border border-slate-800/60 rounded-[3rem] p-8 flex flex-col items-center justify-center text-center relative group hover:border-blue-500/20 hover:bg-[#111827]/60 transition-all shadow-xl">
                                            <div className="absolute -top-5 bg-orange-700/80 text-white px-8 py-2.5 rounded-full font-black text-xs uppercase shadow-2xl tracking-[0.3em] flex items-center gap-2 border border-orange-600">🥉 3rd Place</div>
                                            <div className="relative mb-6">
                                                <div className="size-24 rounded-full border-4 border-orange-800/50 overflow-hidden shadow-2xl ring-8 ring-slate-800/20 group-hover:ring-orange-500/10 transition-all">
                                                    <img src={podiumStudents[2]?.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${podiumStudents[2]?.profiles?.full_name}`} className="w-full h-full object-cover" alt="Podium" />
                                                </div>
                                            </div>
                                            <h4 className="text-xl font-black text-white mb-1 leading-tight">{podiumStudents[2]?.profiles?.full_name}</h4>
                                            <p className="text-slate-500 text-xs font-black mb-6 uppercase tracking-widest opacity-60">ID #ST-{podiumStudents[2]?.student_id?.slice(0, 4)}</p>
                                            <div className="space-y-3">
                                                <p className="text-3xl font-black text-white italic">{podiumStudents[2]?.total_obtained}<span className="text-lg text-slate-500 not-italic">/{stats?.maxMarks}</span></p>
                                                <Badge variant="outline" className="px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-blue-500/30">
                                                    {podiumStudents[2]?.timingLabel.split(' ')[0]}
                                                </Badge>
                                            </div>
                                        </div>
                                    ) : <div className="hidden md:block order-3" />}
                                </div>
                            </div>
                        )}

                        {/* Detailed Results Table Area */}
                        <div className="bg-[#111827]/40 backdrop-blur-2xl border border-slate-800/50 rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-white/5">
                            <div className="p-10 border-b border-slate-800/50 flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-gradient-to-b from-white/[0.02] to-transparent">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-white italic">Detailed Performance</h3>
                                    <p className="text-slate-500 font-bold text-sm tracking-wide">Tracking all real-time student submissions</p>
                                </div>
                                <div className="relative w-full lg:w-[450px] group">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-500 group-focus-within:text-blue-500 transition-all" />
                                    <Input
                                        placeholder="Search candidate name or student ID..."
                                        className="bg-[#0f172a]/80 border-slate-800/80 h-16 pl-14 rounded-2xl focus-visible:ring-blue-500 focus-visible:border-blue-500 text-white placeholder:text-slate-600 font-black text-sm uppercase tracking-wider transition-all shadow-inner"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-separate border-spacing-0">
                                    <thead className="bg-[#111827]/80 text-[10px] uppercase tracking-[0.3em] font-black text-slate-500 border-b border-slate-800 shadow-sm">
                                        <tr>
                                            <th className="px-10 py-6">Rank</th>
                                            <th className="px-8 py-6">Student Credentials</th>
                                            <th className="px-8 py-6">Scoring</th>
                                            <th className="px-8 py-6">Timing Metrics</th>
                                            <th className="px-8 py-6 text-center">Outcome</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/20">
                                        {paginatedSubmissions.map((s) => (
                                            <tr key={s.id} className="hover:bg-blue-600/5 transition-all group cursor-default">
                                                <td className="px-10 py-8">
                                                    <div className={`flex size-10 items-center justify-center rounded-xl font-black text-sm shadow-lg group-hover:scale-110 transition-transform ${s.rank === 1 ? 'bg-yellow-400 text-black' :
                                                        s.rank === 2 ? 'bg-slate-400 text-black' :
                                                            s.rank === 3 ? 'bg-amber-600 text-white' :
                                                                'bg-slate-800 text-slate-400'
                                                        }`}>
                                                        {s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : s.rank}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-12 rounded-full border-2 border-slate-800 overflow-hidden shrink-0 group-hover:border-blue-500/30 transition-colors">
                                                            <img src={s.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.profiles?.full_name}`} className="w-full h-full object-cover" alt="Student" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-white text-base group-hover:text-blue-400 transition-colors">{s.profiles?.full_name}</span>
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5 group-hover:text-slate-400 transition-colors">ID #ST-{s.student_id?.slice(0, 4)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-white text-lg tracking-tighter tabular-nums">{s.total_obtained}<span className="text-slate-500 text-xs italic not-italic font-bold ml-1">/ {stats?.maxMarks}</span></span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                                                                <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${s.percentage}%` }} />
                                                            </div>
                                                            <span className="text-[10px] font-black text-blue-500">{s.percentage}%</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <Timer className="size-3 text-slate-500" />
                                                            <span className="text-xs font-black text-slate-300 tabular-nums">{s.completionTime}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider border-none ${s.timingLabel.includes('Early') ? 'bg-indigo-500/10 text-indigo-400' :
                                                                s.timingLabel.includes('Late') ? 'bg-orange-500/10 text-orange-400' :
                                                                    'bg-slate-500/10 text-slate-400'
                                                                }`}>
                                                                {s.timingLabel}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="flex flex-col items-center">
                                                        <Badge variant={s.status === 'passed' ? 'secondary' : 'destructive'}
                                                            className={`rounded-full px-6 py-2 font-black text-[10px] tracking-widest uppercase border-2 shadow-xl ${s.status === 'passed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                                }`}>
                                                            {s.status}
                                                        </Badge>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {paginatedSubmissions.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-32 text-center">
                                                    <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95">
                                                        <div className="size-20 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 shadow-inner">
                                                            <LayoutDashboard className="size-10 text-slate-700" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-white font-black text-xl italic tracking-tight">No submissions found</p>
                                                            <p className="text-slate-500 font-bold text-sm">Update your search or wait for new candidates.</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Enhanced Pagination Bar */}
                            {totalPages > 1 && (
                                <div className="p-10 border-t border-slate-800/50 flex items-center justify-between bg-white/[0.01]">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center justify-center size-10 rounded-xl bg-slate-900 border border-slate-800 text-blue-500 font-black text-sm">
                                            {currentPage}
                                        </span>
                                        <p className="text-slate-500 text-sm font-black uppercase tracking-[0.2em]">
                                            Page of <span className="text-slate-300">{totalPages}</span> — <span className="text-blue-500 italic">{filteredSubmissions.length} Students</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant="ghost"
                                            className="h-14 border border-slate-800/80 bg-[#0f172a] text-slate-300 hover:bg-slate-800 hover:text-white rounded-2xl px-8 font-black text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-20 active:scale-95 flex gap-2"
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(prev => prev - 1)}
                                        >
                                            <ChevronLeft className="size-5" />
                                            PREV
                                        </Button>
                                        <Button
                                            variant="default"
                                            className="h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl px-12 font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/40 transition-all disabled:opacity-20 active:scale-95 flex gap-2"
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(prev => prev + 1)}
                                        >
                                            NEXT
                                            <ChevronRight className="size-5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <footer className="text-center py-20">
                            <div className="inline-flex flex-col items-center gap-6">
                                <div className="h-px w-24 bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
                                <div className="text-slate-600 text-[10px] font-black tracking-[0.4em] uppercase opacity-60 flex items-center gap-4">
                                    <div className="size-1.5 rounded-full bg-blue-500" />
                                    © 2026 QuizMaster Pro University Suite — Excellence in Analytics
                                    <div className="size-1.5 rounded-full bg-blue-500" />
                                </div>
                            </div>
                        </footer>
                    </div>
                </main>
            </div>
            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(51, 65, 85, 0.8);
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 50px rgba(250, 204, 21, 0.2), inset 0 0 20px rgba(250, 204, 21, 0.1); }
          50% { box-shadow: 0 0 80px rgba(250, 204, 21, 0.4), inset 0 0 40px rgba(250, 204, 21, 0.2); }
        }
        .animate-glow {
          animation: glow 4s ease-in-out infinite;
        }
      `}</style>
        </DashboardLayout>
    );
}
