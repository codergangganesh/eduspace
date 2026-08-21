import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  requireInput?: string; // Text the user must type (e.g. "CONFIRM" or user email)
  inputLabel?: string;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  requireInput,
  inputLabel,
  onConfirm,
  isLoading = false,
}) => {
  const [inputValue, setInputValue] = useState("");

  const isConfirmed = !requireInput || inputValue.trim().toLowerCase() === requireInput.trim().toLowerCase();

  const handleConfirm = () => {
    if (!isConfirmed) return;
    onOpenChange(false);
    setInputValue("");
    // Execute onConfirm immediately
    void onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md border-border bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground text-lg">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {requireInput && (
          <div className="space-y-2 pt-2">
            <Label className="text-xs font-semibold text-foreground">
              {inputLabel || `Type "${requireInput}" to confirm:`}
            </Label>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={requireInput}
              className="h-9 text-sm"
              autoFocus
            />
          </div>
        )}

        <AlertDialogFooter className="pt-3">
          <AlertDialogCancel disabled={isLoading} onClick={() => setInputValue("")}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmed}
            className={
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
