import { useTheme } from "@/contexts/ThemeContext";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function ThemeSelector() {
    const { theme, setTheme } = useTheme();

    return (
        <Select value={theme} onValueChange={(value: "light" | "dark" | "system") => setTheme(value)}>
            <SelectTrigger>
                <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
            </SelectContent>
        </Select>
    );
}
