import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { VoicePracticeSession } from "@/components/voice/VoicePracticeSession";
import SEO from "@/components/SEO";

export default function VoiceTutor() {
  return (
    <DashboardLayout
      fullHeight
      actions={
        <SEO 
          title="AI Voice Tutor | Eduspace" 
          description="Practice interviews, language fluency, presentations, sales calls, academic viva, and confidence building with a real-time AI voice tutor."
        />
      }
    >
      <VoicePracticeSession />
    </DashboardLayout>
  );
}
