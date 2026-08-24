import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { MobileSidebar } from "./MobileSidebar";
import { CommandPalette } from "./CommandPalette";
import { MaintenanceModeBanner } from "./MaintenanceModeBanner";
import { AdminLockScreen } from "@/components/auth/AdminLockScreen";

export const AdminLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("eduspace_admin_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  // Global keyboard shortcut for Spotlight Search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("eduspace_admin_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Desktop Persistent Sidebar */}
      <AdminSidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        className="hidden lg:flex"
      />

      {/* Mobile Drawer Sidebar */}
      <MobileSidebar open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <AdminHeader
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        {/* Dismissible Maintenance Mode Warning Banner */}
        <MaintenanceModeBanner />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <Outlet />
        </main>
      </div>

      {/* Global Spotlight Command Palette (Ctrl + K) */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Global 4-Digit In-App PIN Lock Screen Overlay */}
      <AdminLockScreen />
    </div>
  );
};
