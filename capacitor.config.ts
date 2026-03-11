import type { CapacitorConfig } from '@capacitor/cli';

const devServerUrl = process.env.CAPACITOR_DEV_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: 'com.eduspace.app',
  appName: 'Eduspace',
  webDir: 'dist',
  server: devServerUrl
    ? {
        url: devServerUrl,
        cleartext: devServerUrl.startsWith('http://'),
      }
    : undefined,
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
