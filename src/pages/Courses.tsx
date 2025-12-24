import { useState } from "react";
import { Search, Filter, Grid3X3, List, Plus, Users, Clock, BookOpen, MoreVertical } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CourseGridCard } from "@/components/courses/CourseGridCard";
import { CourseListCard } from "@/components/courses/CourseListCard";
import { CourseFilters } from "@/components/courses/CourseFilters";
import { cn } from "@/lib/utils";

// Mock data - in real app this would come from API
const allCourses = [
  {
    id: "1",
    title: "Introduction to Computer Science",
    code: "CS101",
    instructor: "Dr. Sarah Johnson",
    progress: 75,
    totalLessons: 24,
    completedLessons: 18,
    duration: "12 weeks",
    students: 156,
    category: "Computer Science",
    status: "in-progress" as const,
    semester: "Fall 2024",
    credits: 3,
    schedule: "Mon, Wed 10:00 AM",
  },
  {
    id: "2",
    title: "Data Structures & Algorithms",
    code: "CS201",
    instructor: "Prof. Michael Chen",
    progress: 45,
    totalLessons: 32,
    completedLessons: 14,
    duration: "16 weeks",
    students: 89,
    category: "Computer Science",
    status: "in-progress" as const,
    semester: "Fall 2024",
    credits: 4,
    schedule: "Tue, Thu 2:00 PM",
  },
  {
    id: "3",
    title: "Web Development Fundamentals",
    code: "CS150",
    instructor: "Emily Rodriguez",
    progress: 90,
    totalLessons: 20,
    completedLessons: 18,
    duration: "10 weeks",
    students: 234,
    category: "Web Development",
    status: "in-progress" as const,
    semester: "Fall 2024",
    credits: 3,
    schedule: "Mon, Wed, Fri 11:00 AM",
  },
  {
    id: "4",
    title: "Database Management Systems",
    code: "CS301",
    instructor: "Dr. James Wilson",
    progress: 30,
    totalLessons: 28,
    completedLessons: 8,
    duration: "14 weeks",
    students: 112,
    category: "Database",
    status: "in-progress" as const,
    semester: "Fall 2024",
    credits: 3,
    schedule: "Tue, Thu 10:00 AM",
  },
  {
    id: "5",
    title: "Machine Learning Basics",
    code: "CS401",
    instructor: "Dr. Lisa Park",
    progress: 100,
    totalLessons: 18,
    completedLessons: 18,
    duration: "9 weeks",
    students: 78,
    category: "Artificial Intelligence",
    status: "completed" as const,
    semester: "Spring 2024",
    credits: 3,
    schedule: "Wed, Fri 3:00 PM",
  },
  {
    id: "6",
    title: "Software Engineering Principles",
    code: "CS350",
    instructor: "Prof. Robert Brown",
    progress: 100,
    totalLessons: 22,
    completedLessons: 22,
    duration: "11 weeks",
    students: 145,
    category: "Software Engineering",
    status: "completed" as const,
    semester: "Spring 2024",
    credits: 4,
    schedule: "Mon, Wed 1:00 PM",
  },
  {
    id: "7",
    title: "Mobile App Development",
    code: "CS250",
    instructor: "Dr. Anna Lee",
    progress: 0,
    totalLessons: 24,
    completedLessons: 0,
    duration: "12 weeks",
    students: 98,
    category: "Mobile Development",
    status: "not-started" as const,
    semester: "Fall 2024",
    credits: 3,
    schedule: "Tue, Thu 4:00 PM",
  },
  {
    id: "8",
    title: "Cybersecurity Fundamentals",
    code: "CS420",
    instructor: "Prof. David Kim",
    progress: 0,
    totalLessons: 20,
    completedLessons: 0,
    duration: "10 weeks",
    students: 67,
    category: "Security",
    status: "not-started" as const,
    semester: "Fall 2024",
    credits: 3,
    schedule: "Mon, Fri 9:00 AM",
  },
];

const categories = [
  "All Categories",
  "Computer Science",
  "Web Development",
  "Database",
  "Artificial Intelligence",
  "Software Engineering",
  "Mobile Development",
  "Security",
];

const statuses = [
  { value: "all", label: "All Courses" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "not-started", label: "Not Started" },
];

export default function Courses() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // For demo purposes - in real app this would come from auth context
  const userRole = "student" as "student" | "lecturer";

  // Filter courses
  const filteredCourses = allCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All Categories" || course.category === selectedCategory;

    const matchesStatus = selectedStatus === "all" || course.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Stats
  const totalCourses = allCourses.length;
  const inProgressCourses = allCourses.filter((c) => c.status === "in-progress").length;
  const completedCourses = allCourses.filter((c) => c.status === "completed").length;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {userRole === "student" ? "My Courses" : "My Teaching Courses"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {userRole === "student"
                ? `${totalCourses} courses enrolled • ${inProgressCourses} in progress • ${completedCourses} completed`
                : `${totalCourses} courses teaching this semester`}
            </p>
          </div>
          {userRole === "lecturer" && (
            <Button className="w-full sm:w-auto">
              <Plus className="size-4 mr-2" />
              Create Course
            </Button>
          )}
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses by name, code, or instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Toggle & View Mode */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && "bg-secondary")}
            >
              <Filter className="size-4 mr-2" />
              Filters
            </Button>

            <div className="flex rounded-lg border border-border bg-surface p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === "grid"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Grid3X3 className="size-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === "list"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <CourseFilters
            categories={categories}
            statuses={statuses}
            selectedCategory={selectedCategory}
            selectedStatus={selectedStatus}
            onCategoryChange={setSelectedCategory}
            onStatusChange={setSelectedStatus}
            onClear={() => {
              setSelectedCategory("All Categories");
              setSelectedStatus("all");
            }}
          />
        )}

        {/* Results Count */}
        {(searchQuery || selectedCategory !== "All Categories" || selectedStatus !== "all") && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredCourses.length} of {allCourses.length} courses
          </p>
        )}

        {/* Courses Grid/List */}
        {filteredCourses.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCourses.map((course) => (
                <CourseGridCard key={course.id} course={course} userRole={userRole} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredCourses.map((course) => (
                <CourseListCard key={course.id} course={course} userRole={userRole} />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <BookOpen className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No courses found</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              {searchQuery
                ? `No courses match "${searchQuery}". Try adjusting your search or filters.`
                : "No courses match the selected filters."}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All Categories");
                setSelectedStatus("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
