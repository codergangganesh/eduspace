import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import { FileCheck, BookOpen, UserPlus, Clock, Inbox } from "lucide-react";

interface RecentActivityFeedProps {
  activity?: {
    submissions: any[];
    quizzes: any[];
    newUsers: any[];
  };
  isLoading?: boolean;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activity,
  isLoading = false,
}) => {
  const newUsers = activity?.newUsers || [];
  const submissions = activity?.submissions || [];
  const quizzes = activity?.quizzes || [];

  const hasActivity = newUsers.length > 0 || submissions.length > 0 || quizzes.length > 0;

  return (
    <Card className="border-border shadow-sm bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
          <Clock className="h-4 w-4 text-primary" />
          Recent Platform Events
        </CardTitle>
        <CardDescription className="text-xs">
          Live feed of recent student and faculty activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
            <Clock className="h-5 w-5 animate-spin text-primary" />
            <span>Fetching live event stream...</span>
          </div>
        ) : !hasActivity ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-border/80 rounded-xl bg-muted/20">
            <Inbox className="h-8 w-8 text-muted-foreground mb-2 stroke-[1.5]" />
            <p className="text-xs font-semibold text-foreground">No recent events</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
              New registrations, assignment submissions, and quiz publications will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {newUsers.map((u, i) => (
              <div key={`user-${i}`} className="flex items-start space-x-3 text-xs p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="p-2 rounded-full bg-blue-500/10 text-blue-500 mt-0.5 shrink-0">
                  <UserPlus className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    New user registered: <span className="font-bold">{u.full_name || u.email}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">{formatRelativeTime(u.created_at)}</p>
                </div>
              </div>
            ))}

            {submissions.map((s, i) => (
              <div key={`sub-${i}`} className="flex items-start space-x-3 text-xs p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500 mt-0.5 shrink-0">
                  <FileCheck className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    Assignment submission recorded (ID: {s.id.slice(0, 8)})
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">{formatRelativeTime(s.submitted_at)}</p>
                </div>
              </div>
            ))}

            {quizzes.map((q, i) => (
              <div key={`quiz-${i}`} className="flex items-start space-x-3 text-xs p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="p-2 rounded-full bg-purple-500/10 text-purple-500 mt-0.5 shrink-0">
                  <BookOpen className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    Quiz published: <span className="font-bold">{q.title}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">{formatRelativeTime(q.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
