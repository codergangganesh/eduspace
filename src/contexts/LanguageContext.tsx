import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useTranslation } from "react-i18next";

interface LanguageContextType {
    language: string;
    changeLanguage: (lang: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const { user, profile, updateProfile } = useAuth();
    const { i18n } = useTranslation();
    const [language, setLanguageState] = useState<string>(() => {
        const stored = localStorage.getItem("i18nextLng");
        if (stored) return stored.split("-")[0];
        return (i18n.language ? i18n.language.split("-")[0] : "en");
    });

    // Listen to i18n language changes to keep state, DOM, and localStorage in sync
    useEffect(() => {
        const handleLanguageChanged = (lng: string) => {
            const normalized = lng ? lng.split("-")[0] : "en";
            setLanguageState(normalized);
            document.documentElement.lang = normalized;
            localStorage.setItem("i18nextLng", normalized);
        };

        i18n.on("languageChanged", handleLanguageChanged);
        return () => {
            i18n.off("languageChanged", handleLanguageChanged);
        };
    }, [i18n]);

    // Initial sync with profile language if user has a preference in DB and no local override
    useEffect(() => {
        const stored = localStorage.getItem("i18nextLng");
        if (profile?.language && !stored) {
            const normalizedProfileLang = profile.language.split("-")[0];
            i18n.changeLanguage(normalizedProfileLang);
            setLanguageState(normalizedProfileLang);
            localStorage.setItem("i18nextLng", normalizedProfileLang);
        }
    }, [profile?.language]);

    // Change language, update React state, i18next, localStorage, DOM, and user profile
    const changeLanguage = async (lang: string) => {
        const normalized = lang.split("-")[0];
        setLanguageState(normalized);
        localStorage.setItem("i18nextLng", normalized);
        document.documentElement.lang = normalized;

        await i18n.changeLanguage(normalized);

        // Update in AuthContext profile state and database
        if (user && updateProfile) {
            try {
                await updateProfile({ language: normalized });
            } catch (error) {
                console.error("Error saving language to profile:", error);
            }
        }
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage }}>
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
