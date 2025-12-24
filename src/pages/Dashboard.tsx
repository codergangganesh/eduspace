import { BookOpen, Clock, Trophy, Target } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { CourseCard } from "@/components/dashboard/CourseCard";
import { UpcomingTask } from "@/components/dashboard/UpcomingTask";

const stats = [
  { title: "Enrolled Courses", value: 6, icon: BookOpen, trend: { value: 2, isPositive: true } },
  { title: "Hours Learned", value: "48.5", subtitle: "This month", icon: Clock },
  { title: "Completed", value: 12, subtitle: "Assignments", icon: Trophy },
  { title: "Average Grade", value: "A-", subtitle: "GPA: 3.7", icon: Target },
];

const courses = [
  {
    title: "Introduction to Computer Science",
    instructor: "Dr. Sarah Johnson",
    progress: 75,
    totalLessons: 24,
    completedLessons: 18,
    duration: "12 weeks",
    students: 156,
  },
  {
    title: "Data Structures & Algorithms",
    instructor: "Prof. Michael Chen",
    progress: 45,
    totalLessons: 32,
    completedLessons: 14,
    duration: "16 weeks",
    students: 89,
  },
  {
    title: "Web Development Fundamentals",
    instructor: "Emily Rodriguez",
    progress: 90,
    totalLessons: 20,
    completedLessons: 18,
    duration: "10 weeks",
    students: 234,
  },
  {
    title: "Database Management Systems",
    instructor: "Dr. James Wilson",
    progress: 30,
    totalLessons: 28,
    completedLessons: 8,
    duration: "14 weeks",
    students: 112,
  },
];

const upcomingTasks = [
  {
    title: "Algorithm Analysis Report",
    course: "Data Structures & Algorithms",
    dueDate: "Dec 26, 2024",
    dueTime: "11:59 PM",
    type: "assignment" as const,
    isUrgent: true,
  },
  {
    title: "Database Design Project",
    course: "Database Management Systems",
    dueDate: "Dec 28, 2024",
    dueTime: "5:00 PM",
    type: "project" as const,
  },
  {
    title: "Midterm Examination",
    course: "Introduction to Computer Science",
    dueDate: "Jan 5, 2025",
    dueTime: "10:00 AM",
    type: "exam" as const,
  },
  {
    title: "JavaScript Quiz",
    course: "Web Development Fundamentals",
    dueDate: "Jan 8, 2025",
    dueTime: "3:00 PM",
    type: "quiz" as const,
  },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Welcome back, John! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your courses today.
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
          {/* Courses Section */}
          <div className="xl:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">My Courses</h2>
              <a href="/courses" className="text-sm text-primary hover:underline font-medium">
                View All
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courses.map((course) => (
                <CourseCard key={course.title} {...course} />
              ))}
            </div>
          </div>

          {/* Upcoming Tasks Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Upcoming Tasks</h2>
              <a href="/assignments" className="text-sm text-primary hover:underline font-medium">
                View All
              </a>
            </div>
            <div className="flex flex-col gap-3">
              {upcomingTasks.map((task) => (
                <UpcomingTask key={task.title} {...task} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
