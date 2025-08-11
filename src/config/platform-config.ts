export interface PlatformConfig {
  appId: string;
  appName: string;
  version: string;
  buildNumber: string;
  minimumOSVersion: {
    ios: string;
    android: number;
  };
  permissions: {
    ios: string[];
    android: string[];
  };
  capabilities: {
    ios: string[];
    android: string[];
  };
}

export const platformConfig: PlatformConfig = {
  appId: 'app.lovable.6f3314e6736547a3bcb5db91da6e1b16',
  appName: 'JROTC Command Center',
  version: '1.0.0',
  buildNumber: '1',
  minimumOSVersion: {
    ios: '13.0',
    android: 24, // Android API level 24 (Android 7.0)
  },
  permissions: {
    ios: [
      'NSCameraUsageDescription',
      'NSPhotoLibraryUsageDescription',
      'NSMicrophoneUsageDescription',
      'NSLocationWhenInUseUsageDescription',
      'NSUserNotificationsUsageDescription'
    ],
    android: [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.VIBRATE',
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'com.google.android.c2dm.permission.RECEIVE'
    ]
  },
  capabilities: {
    ios: [
      'push-notifications',
      'background-modes',
      'camera',
      'location-services'
    ],
    android: [
      'push-notifications',
      'camera',
      'location',
      'vibration',
      'network'
    ]
  }
};

export const getPermissionDescription = (permission: string): string => {
  const descriptions: Record<string, string> = {
    'NSCameraUsageDescription': 'This app needs camera access to capture incident photos and documentation.',
    'NSPhotoLibraryUsageDescription': 'This app needs photo library access to attach images to reports.',
    'NSMicrophoneUsageDescription': 'This app needs microphone access for voice notes and communications.',
    'NSLocationWhenInUseUsageDescription': 'This app needs location access to tag incidents and track activities.',
    'NSUserNotificationsUsageDescription': 'This app sends notifications for task assignments and important updates.'
  };
  
  return descriptions[permission] || 'Required for app functionality.';
};