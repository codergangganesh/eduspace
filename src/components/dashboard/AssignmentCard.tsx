import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssignmentCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    onClick: () => void;
    variant?: 'default' | 'danger' | 'success';
    subtitle?: string;
}

export function AssignmentCard({
    title,
    value,
    icon: Icon,
    onClick,
    variant = 'default',
    subtitle
}: AssignmentCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "p-6 rounded-xl border cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
                variant === 'danger'
                    ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900 hover:border-red-300"
                    : variant === 'success'
                        ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900 hover:border-green-300"
                        : "bg-surface border-border hover:border-primary/50"
            )}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className={cn(
                        "text-sm font-medium",
                        variant === 'danger' ? "text-red-600 dark:text-red-400" :
                            variant === 'success' ? "text-green-600 dark:text-green-400" :
                                "text-muted-foreground"
                    )}>
                        {title}
                    </p>
                    <p className={cn(
                        "text-3xl font-bold mt-2",
                        variant === 'danger' ? "text-red-600 dark:text-red-400" :
                            variant === 'success' ? "text-green-600 dark:text-green-400" :
                                "text-foreground"
                    )}>
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                    )}
                </div>
                <Icon className={cn(
                    "size-12 shrink-0",
                    variant === 'danger' ? "text-red-500" :
                        variant === 'success' ? "text-green-500" :
                            "text-primary"
                )} />
            </div>
        </div>
    );
}
