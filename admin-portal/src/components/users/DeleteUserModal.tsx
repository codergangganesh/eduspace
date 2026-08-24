import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EnrichedUser } from "@/types";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

interface DeleteUserModalProps {
  user: EnrichedUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  user,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [typedEmail, setTypedEmail] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user) return null;

  const isConfirmed = typedEmail.trim().toLowerCase() === user.email.trim().toLowerCase();

  const handleDelete = async () => {
    if (!isConfirmed) return;

    try {
      setIsDeleting(true);
      const res = await adminService.deleteUser(user.user_id, user.email);
      if (res.success) {
        toast.success(`User ${user.full_name} was permanently deleted.`);
        onSuccess();
        onOpenChange(false);
        setTypedEmail("");
      } else {
        toast.error(res.error || "Failed to delete user from database.");
      }
    } catch (err: any) {
      console.error("[DeleteUserModal] Deletion exception:", err);
      toast.error(err.message || "Failed to delete user from database.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive flex items-center gap-2">
            <span>🗑️</span> Permanently Delete User
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
            You are about to permanently delete <span className="font-semibold text-foreground">{user.full_name}</span>. This will erase all profiles, submissions, quiz attempts, and messaging history. <strong className="text-destructive">This action CANNOT be undone.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <Label className="text-xs font-semibold">
            Type the user's email <span className="font-mono text-primary font-bold">{user.email}</span> to confirm:
          </Label>
          <Input
            value={typedEmail}
            onChange={(e) => setTypedEmail(e.target.value)}
            placeholder={user.email}
            className="h-9 text-xs font-mono"
            autoFocus
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setTypedEmail("")} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold"
          >
            {isDeleting ? "Deleting..." : "Permanently Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
