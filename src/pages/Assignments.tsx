import { useAuth } from "@/contexts/AuthContext";
import StudentAssignments from "./StudentAssignments";
import LecturerAssignments from "./LecturerAssignments";

export default function Assignments() {
  const { role } = useAuth();

  if (role === "lecturer") {
    return <LecturerAssignments />;
  }

  // Default to student view for students and admins (or anyone else)
  return <StudentAssignments />;
}
