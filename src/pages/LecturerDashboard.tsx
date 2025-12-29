import { BookOpen, Users, FileText, TrendingUp, Clock, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const courses = [
  {
    id: 1,
    title: "Introduction to Computer Science",
    code: "CS101",
    students: 156,
    pendingAssignments: 12,
    nextClass: "Today, 2:00 PM",
    progress: 75,
  },
  {
    id: 2,
    title: "Data Structures & Algorithms",
    code: "CS201",
    students: 89,
    pendingAssignments: 8,
    nextClass: "Tomorrow, 10:00 AM",
    progress: 45,
  },
  {
    id: 3,
    title: "Database Management Systems",
    code: "CS301",
    students: 97,
    pendingAssignments: 5,
    nextClass: "Wed, 3:00 PM",
    progress: 60,
  },
];

const recentSubmissions = [
  {
    id: 1,
    student: "Alice Johnson",
    assignment: "Algorithm Analysis Report",
    course: "CS201",
    submittedAt: "2 hours ago",
    status: "pending",
  },
  {
    id: 2,
    student: "Bob Smith",
    assignment: "Database Design Project",
    course: "CS301",
    submittedAt: "5 hours ago",
    status: "pending",
  },
  {
    id: 3,
    student: "Carol Williams",
    assignment: "Programming Assignment 3",
    course: "CS101",
    submittedAt: "Yesterday",
    status: "graded",
    grade: "A-",
  },
  {
    id: 4,
    student: "David Brown",
    assignment: "Quiz 4 Submission",
    course: "CS101",
    submittedAt: "Yesterday",
    status: "graded",
    grade: "B+",
  },
];

const upcomingClasses = [
  {
    id: 1,
    course: "Introduction to Computer Science",
    code: "CS101",
    time: "2:00 PM - 3:30 PM",
    room: "Room 204",
    isToday: true,
  },
  {
    id: 2,
    course: "Data Structures & Algorithms",
    code: "CS201",
    time: "10:00 AM - 11:30 AM",
    room: "Room 301",
    isToday: false,
    day: "Tomorrow",
  },
  {
    id: 3,
    course: "Database Management Systems",
    code: "CS301",
    time: "3:00 PM - 4:30 PM",
    room: "Lab 102",
    isToday: false,
    day: "Wednesday",
  },
];

export default function LecturerDashboard() {
  const { profile } = useAuth();
  
  // Get display name for greeting
  const displayName = profile?.full_name || "Professor";
  const title = displayName.startsWith("Dr.") || displayName.startsWith("Prof.") 
    ? displayName 
    : `Dr. ${displayName.split(" ").pop()}`;

  const stats = [
    { title: "Active Courses", value: 4, icon: BookOpen, trend: { value: 1, isPositive: true } },
    { title: "Total Students", value: 342, subtitle: "Across all courses", icon: Users },
    { title: "Pending Reviews", value: 28, subtitle: "Assignments", icon: FileText },
    { title: "Avg. Performance", value: "78%", subtitle: "Class average", icon: TrendingUp },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Welcome back, {title}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your courses and student activity.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Courses & Submissions */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {/* My Courses */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">My Courses</h2>
                <a href="/courses" className="text-sm text-primary hover:underline font-medium">
                  Manage Courses
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-surface rounded-xl border border-border p-4 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex flex-col gap-3">
                      <div>
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {course.code}
                        </span>
                        <h3 className="font-semibold text-foreground mt-2 line-clamp-2">
                          {course.title}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="size-4" />
                          <span>{course.students}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="size-4" />
                          <span>{course.pendingAssignments} pending</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Course Progress</span>
                          <span className="font-medium">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-1.5" />
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t border-border">
                        <Clock className="size-3.5" />
                        <span>Next: {course.nextClass}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Submissions */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Recent Submissions</h2>
                <a href="/assignments" className="text-sm text-primary hover:underline font-medium">
                  View All
                </a>
              </div>
              <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Student</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Assignment</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Course</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Submitted</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSubmissions.map((submission) => (
                        <tr key={submission.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-medium text-foreground">{submission.student}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-foreground">{submission.assignment}</span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                              {submission.course}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-sm text-muted-foreground">{submission.submittedAt}</span>
                          </td>
                          <td className="px-4 py-3">
                            {submission.status === "pending" ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-md">
                                <AlertCircle className="size-3" />
                                Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-md">
                                <CheckCircle className="size-3" />
                                {submission.grade}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex flex-col gap-6">
            {/* Upcoming Classes */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Upcoming Classes</h2>
                <a href="/schedule" className="text-sm text-primary hover:underline font-medium">
                  Full Schedule
                </a>
              </div>
              <div className="flex flex-col gap-3">
                {upcomingClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    className={cn(
                      "p-4 rounded-lg border transition-all",
                      classItem.isToday
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-surface"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "size-10 rounded-lg flex items-center justify-center shrink-0",
                        classItem.isToday ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      )}>
                        <Calendar className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-primary">{classItem.code}</span>
                          {classItem.isToday && (
                            <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              Today
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium text-foreground text-sm mt-1 line-clamp-1">
                          {classItem.course}
                        </h4>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="size-3.5" />
                            <span>{classItem.time}</span>
                          </div>
                          <span>{classItem.room}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-surface hover:bg-secondary/50 transition-all">
                  <FileText className="size-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">Create Assignment</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-surface hover:bg-secondary/50 transition-all">
                  <Calendar className="size-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">Schedule Class</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-surface hover:bg-secondary/50 transition-all">
                  <Users className="size-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">View Students</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-surface hover:bg-secondary/50 transition-all">
                  <TrendingUp className="size-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">Analytics</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
