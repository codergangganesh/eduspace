import { cn } from "@/lib/utils";

interface RoleSwitcherProps {
  value: "student" | "lecturer";
  onChange: (value: "student" | "lecturer") => void;
}

export function RoleSwitcher({ value, onChange }: RoleSwitcherProps) {
  return (
    <div className="flex p-1 bg-secondary rounded-lg">
      <label className="flex-1 cursor-pointer">
        <input
          type="radio"
          name="role"
          value="student"
          checked={value === "student"}
          onChange={() => onChange("student")}
          className="sr-only peer"
        />
        <div
          className={cn(
            "flex items-center justify-center py-2 rounded-md text-sm font-medium transition-all duration-200",
            value === "student"
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted-foreground"
          )}
        >
          Student
        </div>
      </label>
      <label className="flex-1 cursor-pointer">
        <input
          type="radio"
          name="role"
          value="lecturer"
          checked={value === "lecturer"}
          onChange={() => onChange("lecturer")}
          className="sr-only peer"
        />
        <div
          className={cn(
            "flex items-center justify-center py-2 rounded-md text-sm font-medium transition-all duration-200",
            value === "lecturer"
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted-foreground"
          )}
        >
          Lecturer
        </div>
      </label>
    </div>
  );
}
