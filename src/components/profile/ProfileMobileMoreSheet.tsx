import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProfileTabItem {
    id: string;
    label: string;
    icon?: React.ComponentType<{ className?: string; strokeWidth?: number | string }> | any;
    description?: string;
}

interface ProfileMobileMoreSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tabs: ProfileTabItem[];
    activeTab: string;
    onSelectTab: (tabId: string) => void;
}

export function ProfileMobileMoreSheet({
    open,
    onOpenChange,
    tabs,
    activeTab,
    onSelectTab,
}: ProfileMobileMoreSheetProps) {
    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[10005] flex items-end justify-center pointer-events-none xl:hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onOpenChange(false)}
                        className="absolute inset-0 bg-black/40 pointer-events-auto"
                    />

                    {/* Bottom Sheet Modal */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={cn(
                            "w-full pointer-events-auto overflow-hidden",
                            "bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 shadow-2xl",
                            "fixed bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[1.75rem] p-5 pt-3 pb-[calc(1.5rem+var(--safe-bottom))] z-[10006]"
                        )}
                    >
                        {/* Drag Handle Indicator */}
                        <div className="h-1 w-10 mx-auto rounded-full bg-slate-300 dark:bg-slate-700 mb-3" />

                        {/* Header: MORE */}
                        <div className="px-2 mb-2">
                            <span className="text-xs font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                                MORE
                            </span>
                        </div>

                        {/* Options List matching image design */}
                        <div className="space-y-1">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                const Icon = tab.icon;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            onSelectTab(tab.id);
                                            onOpenChange(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-3.5 rounded-2xl transition-all duration-150 text-left group",
                                            isActive
                                                ? "bg-[#FFF8F0] dark:bg-amber-950/40 text-[#D94E1F] dark:text-orange-400 font-semibold"
                                                : "text-slate-800 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 font-medium"
                                        )}
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            {Icon && (
                                                <Icon
                                                    className={cn(
                                                        "size-5 shrink-0 transition-colors",
                                                        isActive
                                                            ? "text-[#D94E1F] dark:text-orange-400"
                                                            : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                                                    )}
                                                    strokeWidth={isActive ? 2 : 1.75}
                                                />
                                            )}
                                            <span className="text-[15px] tracking-tight truncate">
                                                {tab.label}
                                            </span>
                                        </div>

                                        <ChevronRight
                                            className={cn(
                                                "size-4 shrink-0 transition-transform group-hover:translate-x-0.5",
                                                isActive
                                                    ? "text-[#F4A27E] dark:text-orange-400/70"
                                                    : "text-slate-300 dark:text-slate-600"
                                            )}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
