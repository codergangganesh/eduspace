import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, CheckCircle, XCircle, Users } from "lucide-react";

interface QuizStatsProps {
    totalSubmissions: number;
    passCount: number;
    failCount: number;
    totalStudents: number; // In class
    averageScore: number;
}

interface LeaderboardEntry {
    rank: number;
    student_name: string;
    student_avatar?: string;
    score: number;
    total_marks: number;
    submitted_at: string;
}

interface QuizLeaderboardProps {
    entries: LeaderboardEntry[];
}

export function QuizStats({ totalSubmissions, passCount, failCount, totalStudents, averageScore }: QuizStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-full">
                        <Users className="size-6 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Participation</p>
                        <p className="text-2xl font-bold">{totalSubmissions} / {totalStudents}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-green-500/20 rounded-full">
                        <CheckCircle className="size-6 text-green-500" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Passed</p>
                        <p className="text-2xl font-bold">{passCount}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-red-500/20 rounded-full">
                        <XCircle className="size-6 text-red-500" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Failed</p>
                        <p className="text-2xl font-bold">{failCount}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/20 rounded-full">
                        <Trophy className="size-6 text-yellow-500" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Avg. Score</p>
                        <p className="text-2xl font-bold">{averageScore.toFixed(1)}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function QuizLeaderboard({ entries }: QuizLeaderboardProps) {
    if (entries.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="size-5 text-yellow-500" />
                    Top Performers
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {entries.slice(0, 5).map((entry) => (
                        <div key={entry.rank} className={`flex items-center justify-between p-3 rounded-lg ${entry.rank === 1 ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-muted/50'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`flex items-center justify-center size-8 rounded-full font-bold ${entry.rank === 1 ? 'bg-yellow-500 text-black' :
                                    entry.rank === 2 ? 'bg-gray-400 text-black' :
                                        entry.rank === 3 ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground'
                                    }`}>
                                    {entry.rank}
                                </div>
                                <span className="font-medium">{entry.student_name}</span>
                            </div>
                            <div className="font-bold">
                                {entry.score} <span className="text-sm font-normal text-muted-foreground">/ {entry.total_marks}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

interface QuizSubmissionsTableProps {
    submissions: any[];
}

export function QuizSubmissionsTable({ submissions }: QuizSubmissionsTableProps) {
    if (submissions.length === 0) {
        return (
            <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                    No submissions yet.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>All Submissions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground font-medium border-y">
                            <tr>
                                <th className="px-4 py-3 text-left">Student</th>
                                <th className="px-4 py-3 text-left">Score</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Submitted At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {submissions.map((sub) => (
                                <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-medium">{sub.student?.full_name}</td>
                                    <td className="px-4 py-3">
                                        {sub.total_obtained}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={sub.status === 'passed' ? 'secondary' : 'destructive'} className={sub.status === 'passed' ? 'bg-green-500/10 text-green-500' : ''}>
                                            {sub.status.toUpperCase()}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(sub.submitted_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
