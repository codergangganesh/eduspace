import { ReactNode, useEffect } from "react";
import { useLayout } from "@/contexts/LayoutContext";

interface DashboardLayoutProps {
  children: ReactNode;
  actions?: ReactNode;
  fullHeight?: boolean;
  hideHeaderOnMobile?: boolean;
}

/**
 * DashboardLayout Logic:
 * This component now sits INSIDE the RootLayout (via Outlet).
 * Its purpose is to:
 * 1. Hoist 'actions' (buttons) to the global Header.
 * 2. Configure layout options (fullHeight, etc.).
 * 3. Render the page content.
 */
export function DashboardLayout({ children, actions, fullHeight = false, hideHeaderOnMobile = false }: DashboardLayoutProps) {
  const { setActions, setOptions } = useLayout();

  useEffect(() => {
    // Mount: Set actions and options
    setActions(actions);
    setOptions({ fullHeight, hideHeaderOnMobile });

    // Unmount: Cleanup (Optional, but good practice if we want generic header when no layout)
    // However, since we navigate to another page that likely sets its own actions immediately, 
    // strict cleanup might cause flickering (empty header for a split second).
    // We'll leave it for the next page to overwrite.
  }, [actions, fullHeight, hideHeaderOnMobile, setActions, setOptions]);

  return <>{children}</>;
}

