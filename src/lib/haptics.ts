
/**
 * Utility for triggering haptic feedback on supported mobile devices
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(50);
        break;
      case 'heavy':
        navigator.vibrate(100);
        break;
      case 'success':
        navigator.vibrate([10, 30, 20]);
        break;
      case 'warning':
        navigator.vibrate([100, 50, 100]);
        break;
      case 'error':
        navigator.vibrate([50, 25, 50, 25, 100]);
        break;
    }
  }
};
