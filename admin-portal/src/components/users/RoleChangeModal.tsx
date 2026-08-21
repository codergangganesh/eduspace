import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppRole, EnrichedUser } from "@/types";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

interface RoleChangeModalProps {
  user: EnrichedUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const RoleChangeModal: React.FC<RoleChangeModalProps> = ({
  user,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [selectedRole, setSelectedRole] = useState<AppRole>(user?.role || "student");
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (user) setSelectedRole(user.role);
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    if (selectedRole === user.role) {
      onOpenChange(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await adminService.setUserRole(user.user_id, selectedRole, user.email);
      if (res.success) {
        toast.success(`Role updated for ${user.full_name} to ${selectedRole}!`);
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.error || "Failed to update role");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update role");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg">Change User Role</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Modify permissions and portal view for <span className="font-semibold text-foreground">{user.full_name}</span> ({user.email}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Select New Role</Label>
            <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val as AppRole)}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student (Access student workspace & quizzes)</SelectItem>
                <SelectItem value="lecturer">Lecturer (Access classes, timetable & grading)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">⚠️ Impact Note:</p>
            <p>Changing role will alter this user's primary navigation and feature permissions upon their next login.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isLoading || selectedRole === user.role}>
            {isLoading ? "Updating..." : "Confirm Role Change"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
