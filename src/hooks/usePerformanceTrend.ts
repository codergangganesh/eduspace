import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfWeek, endOfWeek, subWeeks, format, isWithinInterval } from 'date-fns';

export interface TrendData {
    week: string;
    score: number;
    attendance: number;
    fullDate: Date;
}

export function usePerformanceTrend() {
    const { user } = useAuth();
    const [data, setData] = useState<TrendData[]>([]);
    const [loading, setLoading] = useState(true);
    const [trendPercentage, setTrendPercentage] = useState(0);

    const fetchTrendData = async () => {
        if (!user) return;

        try {
            setLoading(true);

            // 1. Get lecturer's classes
            const { data: classes } = await supabase
                .from('classes')
                .select('id')
                .eq('lecturer_id', user.id);

            if (!classes || classes.length === 0) {
                setData([]);
                setLoading(false);
                return;
            }

            const classIds = classes.map(c => c.id);

            // 2. Fetch data sources from the last 8 weeks
            const eightWeeksAgo = subWeeks(new Date(), 8);

            // A. Quizzes & Submissions
            const { data: quizzes } = await supabase
                .from('quizzes')
                .select('id, total_marks')
                .in('class_id', classIds);

            const quizIds = quizzes?.map(q => q.id) || [];
            const quizMarksMap = new Map(quizzes?.map(q => [q.id, q.total_marks]) || []);

            const { data: submissions } = await supabase
                .from('quiz_submissions')
                .select('quiz_id, total_obtained, submitted_at')
                .in('quiz_id', quizIds)
                .gte('submitted_at', eightWeeksAgo.toISOString());

            // B. Attendance Sessions & Records
            const { data: sessions } = await supabase
                .from('attendance_sessions')
                .select('id, session_date')
                .in('class_id', classIds)
                .gte('session_date', eightWeeksAgo.toISOString());

            const sessionIds = sessions?.map(s => s.id) || [];
            
            const { data: attendanceRecords } = await supabase
                .from('attendance_records')
                .select('session_id, status, created_at')
                .in('session_id', sessionIds);

            // 3. Aggregate data by week
            const weeklyData: TrendData[] = [];
            for (let i = 7; i >= 0; i--) {
                const weekStart = startOfWeek(subWeeks(new Date(), i));
                const weekEnd = endOfWeek(subWeeks(new Date(), i));

                // Calculate Performance Score
                const weekSubmissions = submissions?.filter(s =>
                    isWithinInterval(new Date(s.submitted_at), { start: weekStart, end: weekEnd })
                ) || [];

                let avgScore = 0;
                if (weekSubmissions.length > 0) {
                    const percentages = weekSubmissions.map(s => {
                        const totalMarks = quizMarksMap.get(s.quiz_id) || 100;
                        return (s.total_obtained / totalMarks) * 100;
                    });
                    avgScore = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
                }

                // Calculate Attendance Percentage
                const weekSessions = sessions?.filter(s => 
                    isWithinInterval(new Date(s.session_date), { start: weekStart, end: weekEnd })
                ) || [];
                const weekSessionIds = weekSessions.map(s => s.id);
                const weekAttendanceRecords = attendanceRecords?.filter(r => 
                    weekSessionIds.includes(r.session_id)
                ) || [];

                let avgAttendance = 0;
                if (weekAttendanceRecords.length > 0) {
                    const positiveRecords = weekAttendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
                    avgAttendance = Math.round((positiveRecords / weekAttendanceRecords.length) * 100);
                } else if (i > 0) {
                    // Fallback to previous week if no sessions this week, to keep the line smooth
                    avgAttendance = weeklyData.length > 0 ? weeklyData[weeklyData.length - 1].attendance : 0;
                }

                weeklyData.push({
                    week: format(weekStart, 'MMM dd'),
                    score: avgScore,
                    attendance: avgAttendance,
                    fullDate: weekStart
                });
            }

            // 4. Calculate trend percentage (Performance focus)
            if (weeklyData.length >= 2) {
                const lastWeek = weeklyData[weeklyData.length - 1].score;
                const prevWeek = weeklyData[weeklyData.length - 2].score;
                if (prevWeek > 0) {
                    const diff = ((lastWeek - prevWeek) / prevWeek) * 100;
                    setTrendPercentage(Number(diff.toFixed(1)));
                } else if (lastWeek > 0) {
                    setTrendPercentage(100);
                }
            }

            setData(weeklyData);
        } catch (error) {
            console.error('Error fetching trend data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrendData();
    }, [user]);

    return { data, loading, trendPercentage, refresh: fetchTrendData };
}
