export type AppRole = "student" | "lecturer" | "admin";

export type UserStatus = "active" | "suspended";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  bio: string | null;
  student_id: string | null;
  program: string | null;
  year: string | null;
  department: string | null;
  batch: string | null;
  gpa: number | null;
  credits_completed: number | null;
  credits_required: number | null;
  advisor: string | null;
  enrollment_date: string | null;
  expected_graduation: string | null;
  avatar_url: string | null;
  banner_url?: string | null;
  cover_url?: string | null;
  verified: boolean | null;
  status?: UserStatus | string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  email_notifications?: boolean | null;
  push_notifications?: boolean | null;
  sms_notifications?: boolean | null;
  language?: string | null;
  timezone?: string | null;
  theme?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface LecturerProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  department: string;
  specialization: string | null;
  office_hours: string | null;
  office_location: string | null;
  phone: string | null;
  profile_image: string | null;
  created_at: string | null;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  department: string | null;
  register_number: string | null;
  section: string | null;
  year: string | null;
  course: string | null;
  created_at: string | null;
}

export interface EnrichedUser {
  id?: string;
  user_id: string;
  full_name: string;
  email: string;
  role: AppRole;
  status: UserStatus;
  department: string | null;
  student_id?: string | null;
  register_number?: string | null;
  program?: string | null;
  year?: string | null;
  avatar_url?: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
  last_activity_date?: string | null;
  classes_count?: number;
  assignments_count?: number;
  quizzes_count?: number;
}

export interface ClassItem {
  id: string;
  class_name: string | null;
  course_code: string;
  academic_year: string | null;
  semester: string | null;
  lecturer_id: string;
  lecturer_name: string | null;
  lecturer_department: string | null;
  is_active: boolean | null;
  created_at: string | null;
  student_count?: number;
}

export interface CourseItem {
  id: string;
  title: string;
  course_code: string;
  department: string | null;
  description: string | null;
  credits: number | null;
  semester: string | null;
  lecturer_id: string | null;
  is_active: boolean | null;
  created_at: string | null;
  max_students: number | null;
  enrollment_count?: number;
}

export interface AssignmentItem {
  id: string;
  title: string;
  topic: string | null;
  description: string | null;
  class_id: string | null;
  course_name: string | null;
  lecturer_id: string | null;
  max_points: number | null;
  status: string | null;
  due_date: string | null;
  created_at: string | null;
  submissions_count?: number;
}

export interface QuizItem {
  id: string;
  title: string;
  description: string | null;
  class_id: string;
  total_marks: number;
  pass_percentage: number;
  status: string;
  due_date: string | null;
  created_at: string;
  created_by: string | null;
  submissions_count?: number;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  admin_email?: string;
  admin_name?: string;
  action: string;
  target_user_id: string | null;
  target_email: string | null;
  details: Record<string, any>;
  created_at: string;
}

export interface UserGrowthPoint {
  date: string;
  timestamp?: number;
  students: number;
  lecturers: number;
  total: number;
  newStudents?: number;
  newLecturers?: number;
  newTotal?: number;
}

export interface UserGrowthDatasets {
  "7d": UserGrowthPoint[];
  "30d": UserGrowthPoint[];
  "6m": UserGrowthPoint[];
  "12m": UserGrowthPoint[];
}

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  suspendedStudents: number;
  totalLecturers: number;
  activeLecturers: number;
  totalAdmins: number;
  totalCourses: number;
  totalClasses: number;
  totalAssignments: number;
  totalQuizzes: number;
  totalMessages: number;
  newUsersLast30Days: number;
  userGrowth: UserGrowthPoint[];
  userGrowthDatasets?: UserGrowthDatasets;
  userDistribution: Array<{ name: string; value: number; color: string }>;
  activitySummary: Array<{ name: string; count: number }>;
}

export interface ConversationItem {
  id: string;
  class_id: string | null;
  participant_1: string | null;
  participant_2: string | null;
  last_message: string | null;
  last_message_at: string | null;
  is_class_conversation: boolean | null;
  participant_1_profile?: Profile | null;
  participant_2_profile?: Profile | null;
  class_info?: ClassItem | null;
  message_count?: number;
}

export interface MessageItem {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  receiver_id: string | null;
  content: string;
  created_at: string | null;
  is_read: boolean | null;
  attachment_name: string | null;
  attachment_url: string | null;
  sender_profile?: Profile | null;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  recipient_count: number;
  read_count: number;
}
