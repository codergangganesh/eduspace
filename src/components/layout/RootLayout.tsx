import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import { MobileSidebar } from "./MobileSidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { InviteUserDialog } from "@/components/lecturer/InviteUserDialog";
import { useState, useEffect } from "react";
import { useLayout } from "@/contexts/LayoutContext";
import PageTransition from "./PageTransition";
import { CommandPalette } from "./CommandPalette";


export function RootLayout() {
    const { user, profile, role } = useAuth();
    const location = useLocation();
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

    useEffect(() => {
        const handleOpenInvite = () => setInviteDialogOpen(true);
        window.addEventListener("open-invite-dialog", handleOpenInvite);
        return () => window.removeEventListener("open-invite-dialog", handleOpenInvite);
    }, []);

    const isLecturer = role === "lecturer";
    const isCollapsed = sidebarMode === 'collapsed' || (sidebarMode === 'hover' && !isHovered);

    return (
        <div className="h-[100dvh] w-full overflow-hidden bg-background flex flex-col relative">
            <CommandPalette />
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
                    />
                )}
                {options.hideHeaderOnMobile && (
                    <div className="hidden lg:block">
                        <DashboardHeader
                            onMenuClick={() => setIsMobileMenuOpen(true)}
                            actions={actions}
                        />
                    </div>
                )}

                <main
                    className={cn(
                        "flex-1 min-h-0 overflow-hidden relative",
                        !options.fullHeight && "p-4 lg:p-6 overflow-y-auto",
                        options.hideHeaderOnMobile && "pt-[var(--safe-top)]"
                    )}
                >
                    <PageTransition className="h-full w-full">
                        <Outlet />
                    </PageTransition>
                </main>
            </div>

            {
                user && (
                    <InviteUserDialog
                        open={inviteDialogOpen}
                        onOpenChange={setInviteDialogOpen}
                        lecturerName={profile?.full_name || (role === 'lecturer' ? "Lecturer" : "Student")}
                        lecturerEmail={user?.email || ""}
                    />
                )
            }
        </div >
    );
}
