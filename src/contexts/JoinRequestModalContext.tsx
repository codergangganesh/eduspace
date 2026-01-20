import { createContext, useContext, ReactNode } from 'react';
import { useStudentOnboarding } from '@/hooks/useStudentOnboarding';

interface JoinRequestModalContextType {
    reopenModalForRequest: (requestId: string) => void;
}

const JoinRequestModalContext = createContext<JoinRequestModalContextType | undefined>(undefined);

export function JoinRequestModalProvider({ children }: { children: ReactNode }) {
    const { reopenModalForRequest } = useStudentOnboarding();

    return (
        <JoinRequestModalContext.Provider value={{ reopenModalForRequest }}>
            {children}
        </JoinRequestModalContext.Provider>
    );
}

export function useJoinRequestModal() {
    const context = useContext(JoinRequestModalContext);
    if (!context) {
        throw new Error('useJoinRequestModal must be used within JoinRequestModalProvider');
    }
    return context;
}
