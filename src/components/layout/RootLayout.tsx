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
import { AICoachWidget } from "@/components/dashboard/AICoachWidget";


export function RootLayout() {
    const { user, profile, role } = useAuth();
    const location = useLocation();
    const {
        sidebarMode,
        setSidebarMode,
        actions,
        options,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isAICoachOpen,
        setIsAICoachOpen
    } = useLayout();
    
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const handleOpenInvite = () => setInviteDialogOpen(true);
        window.addEventListener("open-invite-dialog", handleOpenInvite);
        return () => window.removeEventListener("open-invite-dialog", handleOpenInvite);
    }, []);

    // Unified Swipe Gesture Management
    useEffect(() => {
        const checkMobile = () => window.innerWidth < 1024;
        if (!checkMobile()) return;

        let touchStartX = 0;
        let touchStartY = 0;
        const SWIPE_THRESHOLD = 80; // Snappier threshold

        const handleTouchStart = (e: TouchEvent) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            // Only act if horizontal movement is dominant
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                
                // --- CASE 1: RIGTH SWIPE (Finger moves Left -> Right) ---
                if (deltaX > SWIPE_THRESHOLD) {
                    // Priority 1: If Coach is open, close it first
                    if (isAICoachOpen) {
                        setIsAICoachOpen(false);
                    }
                    // Priority 2: Otherwise, open the Sidebar (anywhere on screen)
                    else if (!isMobileMenuOpen) {
                        setIsMobileMenuOpen(true);
                    }
                }
                
                // --- CASE 2: LEFT SWIPE (Finger moves Right -> Left) ---
                else if (deltaX < -SWIPE_THRESHOLD) {
                    // Priority 1: If Sidebar is open, close it first
                    if (isMobileMenuOpen) {
                        setIsMobileMenuOpen(false);
                    }
                    // Priority 2: Otherwise, open the AI Coach (Dashboard only)
                    else if (!isAICoachOpen && location.pathname === '/dashboard') {
                        setIsAICoachOpen(true);
                    }
                }
            }
        };

        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isMobileMenuOpen, setIsMobileMenuOpen, isAICoachOpen, setIsAICoachOpen, location.pathname]);

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
            {location.pathname === '/dashboard' && <AICoachWidget />}
        </div >
    );
}
