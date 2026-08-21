import React from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AdminSidebar } from "./AdminSidebar";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ open, onOpenChange }) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-72 border-r border-border">
        <AdminSidebar
          isCollapsed={false}
          onToggleCollapse={() => onOpenChange(false)}
          onNavigate={() => onOpenChange(false)}
          className="w-full h-full border-r-0"
        />
      </SheetContent>
    </Sheet>
  );
};
