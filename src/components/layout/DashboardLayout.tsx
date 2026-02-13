import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import { MobileSidebar } from "./MobileSidebar";
import PageTransition from "./PageTransition";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardLayoutProps {
  children: ReactNode;
  actions?: ReactNode;
  fullHeight?: boolean;
  hideHeaderOnMobile?: boolean;
}

export function DashboardLayout({ children, actions, fullHeight = false, hideHeaderOnMobile = false }: DashboardLayoutProps) {
  const { profile, updateProfile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'expanded' | 'collapsed' | 'hover'>('expanded');
  const [isHovered, setIsHovered] = useState(false);

  // Sync with profile when it loads
  useEffect(() => {
    if (profile?.sidebar_mode) {
      setSidebarMode(profile.sidebar_mode as 'expanded' | 'collapsed' | 'hover');
    }
  }, [profile?.sidebar_mode]);

  const handleModeChange = async (newMode: 'expanded' | 'collapsed' | 'hover') => {
    setSidebarMode(newMode);
    await updateProfile({ sidebar_mode: newMode });
  };

  const isCollapsed = sidebarMode === 'collapsed' || (sidebarMode === 'hover' && !isHovered);

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-background flex flex-col relative">
      <Sidebar
        mode={sidebarMode}
        setMode={handleModeChange}
        isCollapsed={isCollapsed}
        onHoverChange={setIsHovered}
      />
      <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <div className={cn(
        "flex-1 flex flex-col min-h-0 w-full transition-all duration-300",
        isCollapsed ? "lg:pl-20" : "lg:pl-72"
      )}>
        {!hideHeaderOnMobile && <DashboardHeader onMenuClick={() => setIsMobileMenuOpen(true)} actions={actions} />}
        {hideHeaderOnMobile && (
          <div className="hidden lg:block">
            <DashboardHeader onMenuClick={() => setIsMobileMenuOpen(true)} actions={actions} />
          </div>
        )}
        <main
          className={cn(
            "flex-1 min-h-0 overflow-hidden relative",
            !fullHeight && "p-4 lg:p-6 overflow-y-auto"
          )}
        >
          <PageTransition className="h-full w-full">
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
