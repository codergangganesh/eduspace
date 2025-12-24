import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CourseFiltersProps {
  categories: string[];
  statuses: { value: string; label: string }[];
  selectedCategory: string;
  selectedStatus: string;
  onCategoryChange: (category: string) => void;
  onStatusChange: (status: string) => void;
  onClear: () => void;
}

export function CourseFilters({
  categories,
  statuses,
  selectedCategory,
  selectedStatus,
  onCategoryChange,
  onStatusChange,
  onClear,
}: CourseFiltersProps) {
  const hasActiveFilters = selectedCategory !== "All Categories" || selectedStatus !== "all";

  return (
    <div className="bg-surface rounded-xl border border-border p-4 animate-fade-in">
      <div className="flex flex-col gap-4">
        {/* Status Filter */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <button
                key={status.value}
                onClick={() => onStatusChange(status.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  selectedStatus === status.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="flex justify-end pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={onClear}>
              <X className="size-4 mr-1" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
