import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfWeek, endOfWeek, subWeeks, format, isWithinInterval } from 'date-fns';

export interface TrendData {
    week: string;
    score: number;
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

            // 2. Fetch quizzes for these classes
            const { data: quizzes } = await supabase
                .from('quizzes')
                .select('id, total_marks')
                .in('class_id', classIds);

            if (!quizzes || quizzes.length === 0) {
                setData([]);
                setLoading(false);
                return;
            }

            const quizIds = quizzes.map(q => q.id);
            const quizMarksMap = new Map(quizzes.map(q => [q.id, q.total_marks]));

            // 3. Fetch submissions for these quizzes from the last 8 weeks
            const eightWeeksAgo = subWeeks(new Date(), 8);
            const { data: submissions } = await supabase
                .from('quiz_submissions')
                .select('quiz_id, total_obtained, submitted_at')
                .in('quiz_id', quizIds)
                .gte('submitted_at', eightWeeksAgo.toISOString())
                .order('submitted_at', { ascending: true });

            if (!submissions || submissions.length === 0) {
                // Return empty but structured data if no submissions
                const emptyData = Array.from({ length: 8 }).map((_, i) => ({
                    week: `Week ${8 - i}`,
                    score: 0,
                    fullDate: subWeeks(new Date(), 7 - i)
                }));
                setData(emptyData);
                setLoading(false);
                return;
            }

            // 4. Aggregate data by week
            const weeklyData: TrendData[] = [];
            for (let i = 7; i >= 0; i--) {
                const weekStart = startOfWeek(subWeeks(new Date(), i));
                const weekEnd = endOfWeek(subWeeks(new Date(), i));

                const weekSubmissions = submissions.filter(s =>
                    isWithinInterval(new Date(s.submitted_at), { start: weekStart, end: weekEnd })
                );

                let avgPercentage = 0;
                if (weekSubmissions.length > 0) {
                    const percentages = weekSubmissions.map(s => {
                        const totalMarks = quizMarksMap.get(s.quiz_id) || 100;
                        return (s.total_obtained / totalMarks) * 100;
                    });
                    avgPercentage = percentages.reduce((a, b) => a + b, 0) / percentages.length;
                }

                weeklyData.push({
                    week: `Week ${8 - i}`,
                    score: Math.round(avgPercentage),
                    fullDate: weekStart
                });
            }

            // 5. Calculate trend percentage (comparing last week to the one before)
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
