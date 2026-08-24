import * as React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, KeyRound, Delete, RefreshCw, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminPinSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPinConfigured: (pin: string) => Promise<{ success: boolean; error?: string }>;
  isUpdating?: boolean;
}

export const AdminPinSetupModal: React.FC<AdminPinSetupModalProps> = ({
  open,
  onOpenChange,
  onPinConfigured,
  isUpdating = false,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [firstPin, setFirstPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [shake, setShake] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setFirstPin("");
      setConfirmPin("");
      setErrorMessage("");
      setShake(false);
      setIsSubmitting(false);
    }
  }, [open]);

  const activePin = step === 1 ? firstPin : confirmPin;

  const handleNumberClick = (num: number) => {
    if (isSubmitting || activePin.length >= 4) return;
    setErrorMessage("");

    if (step === 1) {
      const next = firstPin + num.toString();
      setFirstPin(next);
      if (next.length === 4) {
        // Move to step 2 after brief pause for smooth UX
        setTimeout(() => {
          setStep(2);
        }, 150);
      }
    } else {
      const next = confirmPin + num.toString();
      setConfirmPin(next);
      if (next.length === 4) {
        // Complete verification
        handleSubmit(firstPin, next);
      }
    }
  };

  const handleBackspace = () => {
    if (isSubmitting) return;
    setErrorMessage("");
    if (step === 1) {
      setFirstPin((prev) => prev.slice(0, -1));
    } else {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (isSubmitting) return;
    setErrorMessage("");
    if (step === 1) {
      setFirstPin("");
    } else {
      setConfirmPin("");
    }
  };

  const handleSubmit = async (p1: string, p2: string) => {
    if (p1 !== p2) {
      setErrorMessage("PINs do not match. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setConfirmPin("");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await onPinConfigured(p1);
      if (res.success) {
        toast.success(isUpdating ? "4-Digit PIN updated successfully!" : "4-Digit PIN Lock activated!");
        onOpenChange(false);
      } else {
        setErrorMessage(res.error || "Failed to set up PIN.");
        setConfirmPin("");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred.");
      setConfirmPin("");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Physical keyboard listener while modal is open
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting) return;

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleNumberClick(parseInt(e.key, 10));
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape" || e.key === "c" || e.key === "C") {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl p-6">
        <DialogHeader className="text-center sm:text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <KeyRound className="h-6 w-6" />
          </div>
          <DialogTitle className="text-lg sm:text-xl font-black text-foreground">
            {isUpdating ? "Change 4-Digit PIN" : "Set Up 4-Digit Screen Lock PIN"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {step === 1
              ? "Create a 4-digit security PIN to instantly lock and unlock the Admin Portal."
              : "Confirm your 4-digit PIN to activate screen lock."}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-1">
          <Badge
            variant={step === 1 ? "default" : "outline"}
            className="text-[10px] font-bold uppercase tracking-wider"
          >
            Step 1: Enter PIN
          </Badge>
          <span className="text-muted-foreground/40 text-xs">→</span>
          <Badge
            variant={step === 2 ? "default" : "outline"}
            className="text-[10px] font-bold uppercase tracking-wider"
          >
            Step 2: Confirm PIN
          </Badge>
        </div>

        {/* PIN Dot Slots */}
        <div className="flex flex-col items-center space-y-3 py-2">
          <div
            className={cn(
              "flex items-center justify-center gap-4 py-2 transition-transform duration-200",
              shake && "animate-shake"
            )}
          >
            {[0, 1, 2, 3].map((index) => {
              const isFilled = activePin.length > index;
              return (
                <div
                  key={index}
                  className={cn(
                    "w-4 h-4 rounded-full transition-all duration-200 border-2",
                    isFilled
                      ? "bg-primary border-primary shadow-md shadow-primary/40 scale-125"
                      : "border-muted-foreground/30 bg-muted/40",
                    errorMessage && "border-destructive bg-destructive/20"
                  )}
                />
              );
            })}
          </div>

          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-destructive font-medium animate-in fade-in">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Custom Numeric Keypad */}
        <div className="w-full grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleNumberClick(num)}
              className="h-12 rounded-xl bg-card/80 hover:bg-primary hover:text-primary-foreground border border-border/80 active:scale-95 transition-all text-lg font-bold shadow-2xs flex items-center justify-center cursor-pointer disabled:opacity-40"
            >
              {num}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            disabled={isSubmitting || activePin.length === 0}
            onClick={handleClear}
            className="h-12 rounded-xl bg-card/40 hover:bg-card/80 border border-border/40 active:scale-95 transition-all text-xs font-semibold text-muted-foreground hover:text-foreground shadow-2xs flex items-center justify-center cursor-pointer disabled:opacity-20"
            title="Clear (Esc)"
          >
            Clear
          </button>

          {/* Zero Button */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleNumberClick(0)}
            className="h-12 rounded-xl bg-card/80 hover:bg-primary hover:text-primary-foreground border border-border/80 active:scale-95 transition-all text-lg font-bold shadow-2xs flex items-center justify-center cursor-pointer disabled:opacity-40"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            disabled={isSubmitting || activePin.length === 0}
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-card/40 hover:bg-card/80 border border-border/40 active:scale-95 transition-all text-muted-foreground hover:text-foreground shadow-2xs flex items-center justify-center cursor-pointer disabled:opacity-20"
            title="Backspace"
          >
            <Delete className="h-4 w-4" />
          </button>
        </div>

        {/* Actions / Back Step */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-2">
          {step === 2 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep(1);
                setConfirmPin("");
                setErrorMessage("");
              }}
              disabled={isSubmitting}
              className="text-xs gap-1 h-8"
            >
              <ArrowLeft className="h-3 w-3" />
              Re-enter PIN
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs h-8 ml-auto"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
