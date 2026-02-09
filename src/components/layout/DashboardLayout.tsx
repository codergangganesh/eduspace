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
}

export function DashboardLayout({ children, actions, fullHeight = false }: DashboardLayoutProps) {
  const { profile, updateProfile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'expanded' | 'collapsed' | 'hover'>('expanded');
  const [isHovered, setIsHovered] = useState(false);

  // Sync with profile when it loads
  useEffect(() => {
    if (profile?.sidebar_mode) {
      setSidebarMode(profile.sidebar_mode);
    }
  }, [profile?.sidebar_mode]);

  const handleModeChange = async (newMode: 'expanded' | 'collapsed' | 'hover') => {
    setSidebarMode(newMode);
    await updateProfile({ sidebar_mode: newMode });
  };

  const isCollapsed = sidebarMode === 'collapsed' || (sidebarMode === 'hover' && !isHovered);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        mode={sidebarMode}
        setMode={handleModeChange}
        isCollapsed={isCollapsed}
        onHoverChange={setIsHovered}
      />
      <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <div className={cn(
        "transition-all duration-300",
        isCollapsed ? "lg:pl-20" : "lg:pl-72"
      )}>
        <DashboardHeader onMenuClick={() => setIsMobileMenuOpen(true)} actions={actions} />
        <main
          className={fullHeight
            ? "h-[calc(100vh-4rem)] overflow-hidden"
            : "p-4 lg:p-6"
          }
        >
          <PageTransition className="h-full">
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
