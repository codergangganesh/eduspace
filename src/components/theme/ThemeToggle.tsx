import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
    const { theme, setTheme, actualTheme } = useTheme();

    const toggleTheme = () => {
        if (theme === "system") {
            // If system, switch to opposite of current actual theme
            setTheme(actualTheme === "dark" ? "light" : "dark");
        } else {
            // Toggle between light and dark
            setTheme(theme === "dark" ? "light" : "dark");
        }
    };

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="relative size-9 rounded-full border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            title={`Switch to ${actualTheme === "dark" ? "light" : "dark"} mode`}
        >
            <Sun className={cn(
                "size-4 rotate-0 scale-100 transition-all",
                actualTheme === "dark" && "rotate-90 scale-0"
            )} />
            <Moon className={cn(
                "absolute size-4 rotate-90 scale-0 transition-all",
                actualTheme === "dark" && "rotate-0 scale-100"
            )} />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
