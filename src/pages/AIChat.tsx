import AIChatWindow from "@/components/student/ai-chat/AIChatWindow";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AIChatPage() {
    return (
        <DashboardLayout fullHeight>
            <AIChatWindow />
        </DashboardLayout>
    );
}
