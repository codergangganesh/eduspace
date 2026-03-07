import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eduspace.app',
  appName: 'Eduspace',
  webDir: 'dist',
  server: {
    // Replace with your computer's local IP address (e.g., 192.168.1.10)
    // to enable live reload on your personal mobile device.
    url: 'http://10.200.140.183:8082',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },

    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff',
      overlay: true,
    },
  },
};

export default config;
