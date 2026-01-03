import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import { MobileSidebar } from "./MobileSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  actions?: ReactNode;
}

export function DashboardLayout({ children, actions }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <div className="lg:pl-72 transition-all duration-300">
        <DashboardHeader onMenuClick={() => setIsMobileMenuOpen(true)} actions={actions} />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
