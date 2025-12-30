import { createContext, useContext, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface LanguageContextType {
    language: string;
    changeLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const { user, profile } = useAuth();
    const { i18n } = useTranslation();

    // Load language from profile on mount
    useEffect(() => {
        if (profile?.language) {
            i18n.changeLanguage(profile.language);
        }
    }, [profile?.language, i18n]);

    // Change language and save to database
    const changeLanguage = async (lang: string) => {
        await i18n.changeLanguage(lang);

        // Save to database if user is logged in
        if (user) {
            try {
                await supabase
                    .from("profiles")
                    .update({ language: lang })
                    .eq("user_id", user.id);
            } catch (error) {
                console.error("Error saving language:", error);
            }
        }
    };

    return (
        <LanguageContext.Provider value={{ language: i18n.language, changeLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within LanguageProvider");
    }
    return context;
}
