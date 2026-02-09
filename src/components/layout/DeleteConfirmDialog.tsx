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
import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
}

export function DeleteConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title = "Are you absolutely sure?",
    description = "This action cannot be undone. This will permanently delete the selected item and remove its data from our servers.",
}: DeleteConfirmDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-none bg-background/95 backdrop-blur-xl shadow-2xl">
                <div className="p-6 pt-8 text-center">
                    <div className="size-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-6">
                        <Trash2 className="size-8" />
                    </div>
                    <AlertDialogHeader className="space-y-3">
                        <AlertDialogTitle className="text-2xl font-bold text-center">
                            {title}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base text-center leading-relaxed">
                            {description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </div>

                <div className="p-3 bg-muted/30 border-t border-border/50 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-2">
                    <AlertDialogCancel className="h-11 px-6 rounded-xl border-border/50 bg-background hover:bg-muted font-semibold transition-all">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                            onOpenChange(false);
                        }}
                        className="h-11 px-6 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-semibold transition-all shadow-lg shadow-destructive/20"
                    >
                        Confirm Delete
                    </AlertDialogAction>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
