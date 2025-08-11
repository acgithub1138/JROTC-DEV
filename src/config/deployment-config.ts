export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  appStore: {
    ios: {
      bundleId: string;
      teamId: string;
      appStoreId: string;
      provisioningProfile: string;
    };
    android: {
      packageName: string;
      keyAlias: string;
      playStoreTrack: 'internal' | 'alpha' | 'beta' | 'production';
    };
  };
  cicd: {
    autoDeployTags: boolean;
    testFlightUpload: boolean;
    playStoreUpload: boolean;
    notificationChannels: string[];
  };
  assets: {
    iconSizes: number[];
    splashSizes: string[];
    requiredMetadata: string[];
  };
}

export const getDeploymentConfig = (): DeploymentConfig => {
  return {
    environment: 'production',
    appStore: {
      ios: {
        bundleId: 'app.lovable.6f3314e6736547a3bcb5db91da6e1b16',
        teamId: 'YOUR_TEAM_ID',
        appStoreId: 'YOUR_APP_STORE_ID',
        provisioningProfile: 'JROTC Command Center Distribution'
      },
      android: {
        packageName: 'app.lovable.6f3314e6736547a3bcb5db91da6e1b16',
        keyAlias: 'jrotc-release-key',
        playStoreTrack: 'internal'
      }
    },
    cicd: {
      autoDeployTags: true,
      testFlightUpload: true,
      playStoreUpload: true,
      notificationChannels: ['slack', 'email']
    },
    assets: {
      iconSizes: [16, 20, 29, 32, 40, 48, 50, 55, 57, 58, 60, 64, 72, 76, 80, 87, 88, 92, 100, 114, 120, 128, 144, 152, 167, 172, 180, 196, 216, 256, 512, 1024],
      splashSizes: ['1242x2688', '1125x2436', '828x1792', '1242x2208', '750x1334', '640x1136'],
      requiredMetadata: [
        'app_name',
        'short_description', 
        'full_description',
        'keywords',
        'category',
        'age_rating',
        'privacy_policy_url',
        'support_url',
        'marketing_url'
      ]
    }
  };
};

export const releaseChannels = {
  development: {
    name: 'Development',
    description: 'Internal testing builds',
    autoUpdate: true,
    requireApproval: false
  },
  staging: {
    name: 'Staging', 
    description: 'Pre-production testing',
    autoUpdate: false,
    requireApproval: true
  },
  production: {
    name: 'Production',
    description: 'Live app store releases',
    autoUpdate: false,
    requireApproval: true
  }
};

export const buildMetadata = {
  minimumOSVersions: {
    ios: '13.0',
    android: '7.0'
  },
  targetSDKVersions: {
    ios: '17.0',
    android: '34'
  },
  requiredPermissions: {
    ios: [
      'NSCameraUsageDescription',
      'NSPhotoLibraryUsageDescription', 
      'NSUserNotificationsUsageDescription'
    ],
    android: [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.VIBRATE',
      'com.google.android.c2dm.permission.RECEIVE'
    ]
  }
};