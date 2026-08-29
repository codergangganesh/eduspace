import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CallProvider } from "@/contexts/CallContext";
import { FeedbackProvider } from "@/contexts/FeedbackContext";
import { StreakProvider } from "@/contexts/StreakContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { TooltipProvider } from "@/components/ui/tooltip";

import { PinLockProvider } from "@/hooks/usePinLock";

export const AppProviders = ({
    children,
    queryClient
}: {
    children: ReactNode;
    queryClient: QueryClient;
}) => {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <PinLockProvider>
                    <LanguageProvider>
                        <ThemeProvider>
                            <FeedbackProvider>
                                <StreakProvider>
                                    <LayoutProvider>
                                        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                                            <TooltipProvider>
                                                <CallProvider>
                                                    {children}
                                                </CallProvider>
                                            </TooltipProvider>
                                        </BrowserRouter>
                                    </LayoutProvider>
                                </StreakProvider>
                            </FeedbackProvider>
                        </ThemeProvider>
                    </LanguageProvider>
                </PinLockProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
};
