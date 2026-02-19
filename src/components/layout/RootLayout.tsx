import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import { MobileSidebar } from "./MobileSidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { InviteUserDialog } from "@/components/lecturer/InviteUserDialog";
import { useState } from "react";
import { useLayout } from "@/contexts/LayoutContext";
import PageTransition from "./PageTransition";

export function RootLayout() {
    const { user, profile, role } = useAuth();
    const {
        sidebarMode,
        setSidebarMode,
        actions,
        options,
        isMobileMenuOpen,
        setIsMobileMenuOpen
    } = useLayout();

    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const isLecturer = role === "lecturer";
    const isCollapsed = sidebarMode === 'collapsed' || (sidebarMode === 'hover' && !isHovered);

    return (
        <div className="h-[100dvh] w-full overflow-hidden bg-background flex flex-col relative">
            <Sidebar
                mode={sidebarMode}
                setMode={setSidebarMode}
                isCollapsed={isCollapsed}
                onHoverChange={setIsHovered}
            />
            <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

            <div className={cn(
                "flex-1 flex flex-col min-h-0 w-full transition-all duration-300",
                isCollapsed ? "lg:pl-20" : "lg:pl-72"
            )}>
                {!options.hideHeaderOnMobile && (
                    <DashboardHeader
                        onMenuClick={() => setIsMobileMenuOpen(true)}
                        actions={actions}
                        onInviteClick={isLecturer ? () => setInviteDialogOpen(true) : undefined}
                    />
                )}
                {options.hideHeaderOnMobile && (
                    <div className="hidden lg:block">
                        <DashboardHeader
                            onMenuClick={() => setIsMobileMenuOpen(true)}
                            actions={actions}
                            onInviteClick={isLecturer ? () => setInviteDialogOpen(true) : undefined}
                        />
                    </div>
                )}

                <main
                    className={cn(
                        "flex-1 min-h-0 overflow-hidden relative",
                        !options.fullHeight && "p-4 lg:p-6 overflow-y-auto"
                    )}
                >
                    <PageTransition className="h-full w-full">
                        <Outlet />
                    </PageTransition>
                </main>
            </div>

            {isLecturer && (
                <InviteUserDialog
                    open={inviteDialogOpen}
                    onOpenChange={setInviteDialogOpen}
                    lecturerName={profile?.full_name || "Lecturer"}
                    lecturerEmail={user?.email || ""}
                />
            )}
        </div>
    );
}
