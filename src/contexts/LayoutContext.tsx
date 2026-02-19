import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";

interface LayoutOptions {
    fullHeight?: boolean;
    hideHeaderOnMobile?: boolean;
}

interface LayoutContextType {
    sidebarMode: 'expanded' | 'collapsed' | 'hover';
    setSidebarMode: (mode: 'expanded' | 'collapsed' | 'hover') => void;
    actions: ReactNode;
    setActions: (actions: ReactNode) => void;
    options: LayoutOptions;
    setOptions: (options: LayoutOptions) => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
    const { profile, updateProfile } = useAuth();

    // Initialize from localStorage to prevent flicker
    const [sidebarMode, setSidebarModeState] = useState<'expanded' | 'collapsed' | 'hover'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebarMode');
            if (saved) return saved as 'expanded' | 'collapsed' | 'hover';
        }
        return 'expanded';
    });

    const [actions, setActions] = useState<ReactNode>(null);
    const [options, setOptions] = useState<LayoutOptions>({});
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Sync with profile on load (if not set in localstorage, or just to keep in sync)
    useEffect(() => {
        if (profile?.sidebar_mode) {
            // We only update if it differs, but to avoid visual jumps we trust localStorage first usually.
            // But if localStorage is missing, this helps.
            if (!localStorage.getItem('sidebarMode')) {
                setSidebarModeState(profile.sidebar_mode as any);
            }
        }
    }, [profile]);

    const setSidebarMode = async (mode: 'expanded' | 'collapsed' | 'hover') => {
        setSidebarModeState(mode);
        localStorage.setItem('sidebarMode', mode);
        // Fire and forget update
        if (profile) {
            updateProfile({ sidebar_mode: mode });
        }
    };

    return (
        <LayoutContext.Provider value={{
            sidebarMode,
            setSidebarMode,
            actions,
            setActions,
            options,
            setOptions,
            isMobileMenuOpen,
            setIsMobileMenuOpen
        }}>
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout() {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error("useLayout must be used within a LayoutProvider");
    }
    return context;
}
