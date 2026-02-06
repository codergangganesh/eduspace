import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2 } from "lucide-react";

/**
 * Redirects legacy /assignments/:id/submit route to the new /student/assignments/:id
 * where the submission dialog is handled.
 */
export default function AssignmentSubmit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      navigate(`/student/assignments/${id}`, { replace: true });
    } else {
      navigate('/student/assignments', { replace: true });
    }
  }, [id, navigate]);

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Redirecting to assignment details...</p>
      </div>
    </DashboardLayout>
  );
}
