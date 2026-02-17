import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { PricingTable } from "./PricingTable";
import { X } from "lucide-react";

interface SubscriptionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SubscriptionModal({ open, onOpenChange }: SubscriptionModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[100vw] md:max-w-5xl p-0 overflow-hidden border-none bg-transparent shadow-none focus-visible:outline-none w-full [&>button]:hidden">
                <div className="relative w-full max-h-[98vh] md:max-h-none overflow-y-auto md:overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] shadow-2xl p-2 sm:p-4 md:p-0">
                    {/* Background Glows */}
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 blur-[120px] rounded-full -z-10 animate-pulse" />

                    {/* Close Button */}
                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute top-5 right-5 p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all hover:rotate-90 z-50 shadow-sm border border-slate-200 dark:border-slate-800"
                    >
                        <X className="size-5" />
                    </button>

                    <PricingTable
                        onSuccess={() => onOpenChange(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
