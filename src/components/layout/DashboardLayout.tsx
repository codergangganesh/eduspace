import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import { MobileSidebar } from "./MobileSidebar";
import PageTransition from "./PageTransition";

interface DashboardLayoutProps {
  children: ReactNode;
  actions?: ReactNode;
  fullHeight?: boolean;
}

export function DashboardLayout({ children, actions, fullHeight = false }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <div className="lg:pl-72 transition-all duration-300">
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
