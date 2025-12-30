import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    actualTheme: "light" | "dark"; // The actual applied theme (resolves "system")
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const { user, profile } = useAuth();
    const [theme, setThemeState] = useState<Theme>("system");
    const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");

    // Get system theme preference
    const getSystemTheme = (): "light" | "dark" => {
        if (typeof window !== "undefined") {
            return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        return "light";
    };

    // Update actual theme based on theme setting
    const updateActualTheme = (themeValue: Theme) => {
        const resolved = themeValue === "system" ? getSystemTheme() : themeValue;
        setActualTheme(resolved);

        // Apply theme to document
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(resolved);
    };

    // Load theme from profile on mount
    useEffect(() => {
        if (profile?.theme) {
            const savedTheme = profile.theme as Theme;
            setThemeState(savedTheme);
            updateActualTheme(savedTheme);
        } else {
            // Default to system theme
            updateActualTheme("system");
        }
    }, [profile?.theme]);

    // Listen for system theme changes when theme is set to "system"
    useEffect(() => {
        if (theme !== "system") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            updateActualTheme("system");
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme]);

    // Set theme and save to database
    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);
        updateActualTheme(newTheme);

        // Save to database if user is logged in
        if (user) {
            try {
                await supabase
                    .from("profiles")
                    .update({ theme: newTheme })
                    .eq("user_id", user.id);
            } catch (error) {
                console.error("Error saving theme:", error);
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return context;
}
