import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Calendar, Clock, FileText, CheckCircle, AlertCircle, ChevronRight, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type AssignmentStatus = "pending" | "submitted" | "graded" | "overdue";
type FilterType = "all" | "pending" | "submitted" | "graded" | "overdue";

interface Assignment {
  id: string;
  title: string;
  course: string;
  courseCode: string;
  dueDate: string;
  dueTime: string;
  status: AssignmentStatus;
  grade?: string;
  maxPoints: number;
  earnedPoints?: number;
  description: string;
  type: "assignment" | "quiz" | "project" | "exam";
}

const assignments: Assignment[] = [
  {
    id: "1",
    title: "Algorithm Analysis Report",
    course: "Data Structures & Algorithms",
    courseCode: "CS201",
    dueDate: "Dec 26, 2024",
    dueTime: "11:59 PM",
    status: "pending",
    maxPoints: 100,
    description: "Analyze the time and space complexity of given algorithms.",
    type: "assignment",
  },
  {
    id: "2",
    title: "Database Design Project",
    course: "Database Management Systems",
    courseCode: "CS301",
    dueDate: "Dec 28, 2024",
    dueTime: "5:00 PM",
    status: "pending",
    maxPoints: 150,
    description: "Design and implement a database schema for an e-commerce system.",
    type: "project",
  },
  {
    id: "3",
    title: "Programming Assignment 3",
    course: "Introduction to Computer Science",
    courseCode: "CS101",
    dueDate: "Dec 20, 2024",
    dueTime: "11:59 PM",
    status: "submitted",
    maxPoints: 50,
    description: "Implement a linked list data structure with basic operations.",
    type: "assignment",
  },
  {
    id: "4",
    title: "JavaScript Quiz",
    course: "Web Development Fundamentals",
    courseCode: "WEB101",
    dueDate: "Dec 18, 2024",
    dueTime: "3:00 PM",
    status: "graded",
    grade: "A",
    maxPoints: 25,
    earnedPoints: 23,
    description: "Quiz covering JavaScript fundamentals and DOM manipulation.",
    type: "quiz",
  },
  {
    id: "5",
    title: "Midterm Examination",
    course: "Introduction to Computer Science",
    courseCode: "CS101",
    dueDate: "Dec 15, 2024",
    dueTime: "10:00 AM",
    status: "graded",
    grade: "B+",
    maxPoints: 100,
    earnedPoints: 87,
    description: "Comprehensive exam covering first half of the semester.",
    type: "exam",
  },
  {
    id: "6",
    title: "SQL Practice Assignment",
    course: "Database Management Systems",
    courseCode: "CS301",
    dueDate: "Dec 10, 2024",
    dueTime: "11:59 PM",
    status: "overdue",
    maxPoints: 40,
    description: "Practice SQL queries with complex joins and subqueries.",
    type: "assignment",
  },
];

const statusConfig = {
  pending: {
    label: "Pending",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    icon: AlertCircle,
  },
  submitted: {
    label: "Submitted",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    icon: CheckCircle,
  },
  graded: {
    label: "Graded",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    icon: CheckCircle,
  },
  overdue: {
    label: "Overdue",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    icon: AlertCircle,
  },
};

const typeStyles = {
  assignment: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  quiz: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  exam: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  project: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default function Assignments() {
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredAssignments = assignments.filter((assignment) => {
    if (filter === "all") return true;
    return assignment.status === filter;
  });

  const counts = {
    all: assignments.length,
    pending: assignments.filter((a) => a.status === "pending").length,
    submitted: assignments.filter((a) => a.status === "submitted").length,
    graded: assignments.filter((a) => a.status === "graded").length,
    overdue: assignments.filter((a) => a.status === "overdue").length,
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Assignments</h1>
            <p className="text-muted-foreground mt-1">Track and submit your assignments</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {(["all", "pending", "submitted", "graded", "overdue"] as FilterType[]).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                filter === filterType
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <span className="capitalize">{filterType}</span>
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                filter === filterType
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              )}>
                {counts[filterType]}
              </span>
            </button>
          ))}
        </div>

        {/* Assignments List */}
        <div className="flex flex-col gap-4">
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12 bg-surface rounded-xl border border-border">
              <FileText className="size-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No assignments found</h3>
              <p className="text-muted-foreground mt-1">
                No assignments match the selected filter.
              </p>
            </div>
          ) : (
            filteredAssignments.map((assignment) => {
              const StatusIcon = statusConfig[assignment.status].icon;
              return (
                <div
                  key={assignment.id}
                  className={cn(
                    "bg-surface rounded-xl border p-4 sm:p-5 transition-all hover:shadow-md",
                    assignment.status === "overdue" ? "border-destructive/50" : "border-border"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Type Badge */}
                    <div className={cn("px-2.5 py-1 rounded-md text-xs font-medium capitalize w-fit", typeStyles[assignment.type])}>
                      {assignment.type}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-foreground">{assignment.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                              {assignment.courseCode}
                            </span>
                            <span className="text-sm text-muted-foreground">{assignment.course}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium shrink-0",
                          statusConfig[assignment.status].bg,
                          statusConfig[assignment.status].color
                        )}>
                          <StatusIcon className="size-3" />
                          <span>{statusConfig[assignment.status].label}</span>
                          {assignment.grade && <span>• {assignment.grade}</span>}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {assignment.description}
                      </p>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          <span>Due: {assignment.dueDate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          <span>{assignment.dueTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="size-3.5" />
                          <span>
                            {assignment.earnedPoints !== undefined
                              ? `${assignment.earnedPoints}/${assignment.maxPoints} pts`
                              : `${assignment.maxPoints} pts`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex sm:flex-col items-center gap-2 sm:items-end">
                      {assignment.status === "pending" && (
                        <Link to={`/assignments/${assignment.id}/submit`}>
                          <Button size="sm" className="gap-1">
                            Submit
                            <ChevronRight className="size-4" />
                          </Button>
                        </Link>
                      )}
                      {assignment.status === "overdue" && (
                        <Link to={`/assignments/${assignment.id}/submit`}>
                          <Button size="sm" variant="destructive" className="gap-1">
                            Late Submit
                            <ChevronRight className="size-4" />
                          </Button>
                        </Link>
                      )}
                      {assignment.status === "submitted" && (
                        <Button size="sm" variant="outline" className="gap-1">
                          View Submission
                          <ChevronRight className="size-4" />
                        </Button>
                      )}
                      {assignment.status === "graded" && (
                        <Button size="sm" variant="outline" className="gap-1">
                          View Feedback
                          <ChevronRight className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
