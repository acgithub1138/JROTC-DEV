import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.6f3314e6736547a3bcb5db91da6e1b16',
  appName: 'jrotc-command-and-control-center',
  webDir: 'dist',
  server: {
    url: 'https://6f3314e6-7365-47a3-bcb5-db91da6e1b16.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a1a',
      showSpinner: false
    },
    StatusBar: {
      style: 'dark'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Camera: {
      saveToGallery: false
    },
    Haptics: {},
    Share: {},
    Device: {},
    Network: {},
    Filesystem: {}
  }
};

export default config;