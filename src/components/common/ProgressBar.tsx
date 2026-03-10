import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import nprogress from "nprogress";
import "nprogress/nprogress.css";

// Configure nprogress
nprogress.configure({
    showSpinner: false,
    easing: 'ease',
    speed: 500,
    trickleSpeed: 200,
    minimum: 0.1
});

export function ProgressBar() {
    const location = useLocation();

    useEffect(() => {
        nprogress.start();

        // Use a small timeout to ensure the "zip" effect is visible even on fast loads
        const timer = setTimeout(() => {
            nprogress.done();
        }, 100);

        return () => {
            clearTimeout(timer);
            nprogress.done();
        };
    }, [location.pathname, location.search]);

    return null;
}
