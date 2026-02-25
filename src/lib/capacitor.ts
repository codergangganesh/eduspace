export async function initializeCapacitor() {
    try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
            const { StatusBar, Style } = await import('@capacitor/status-bar');
            document.documentElement.classList.add('is-native');

            // Use overlay: true to allow the webview to handle padding via CSS env()
            await StatusBar.setOverlaysWebView({ overlay: true });

            // Set the background color to transparent to see the app background behind the bar
            await StatusBar.setBackgroundColor({ color: '#ffffff' });

            // Set the style (icons color)
            await StatusBar.setStyle({ style: Style.Light }); // Light means dark icons for a light background
        }
    } catch (e) {
        console.warn('StatusBar plugin not available or failed to initialize', e);
    }
}
