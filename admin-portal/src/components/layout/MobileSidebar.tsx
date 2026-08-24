import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AdminSidebar } from "./AdminSidebar";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ open, onOpenChange }: MobileSidebarProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-72 border-r border-border">
        <SheetHeader className="sr-only">
          <SheetTitle>Admin Navigation Menu</SheetTitle>
          <SheetDescription>Mobile navigation sidebar for administrator portal.</SheetDescription>
        </SheetHeader>
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
