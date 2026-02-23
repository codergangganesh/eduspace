import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eduspace.app',
  appName: 'Eduspace',
  webDir: 'dist',
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
