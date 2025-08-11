import { useState, useEffect } from 'react';
import { useCapacitor } from './useCapacitor';
import { platformConfig } from '@/config/platform-config';
import { getBuildConfig } from '@/config/build-config';

interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  platform: string;
}

export const useBuildValidation = () => {
  const { isNative, platform } = useCapacitor();
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    warnings: [],
    errors: [],
    platform: 'web'
  });

  useEffect(() => {
    const validateBuild = async () => {
      const buildConfig = getBuildConfig();
      const warnings: string[] = [];
      const errors: string[] = [];

      // Validate Supabase configuration
      if (!buildConfig.supabaseUrl) {
        errors.push('Supabase URL is not configured');
      }
      
      if (!buildConfig.supabaseAnonKey) {
        errors.push('Supabase anonymous key is not configured');
      }

      // Platform-specific validations
      if (isNative) {
        // Check minimum OS version compatibility
        if (platform === 'ios') {
          const iosVersion = await getIOSVersion();
          if (iosVersion && compareVersions(iosVersion, platformConfig.minimumOSVersion.ios) < 0) {
            warnings.push(`iOS version ${iosVersion} is below minimum required ${platformConfig.minimumOSVersion.ios}`);
          }
        }

        // Check if required native plugins are available
        const requiredPlugins = ['Camera', 'PushNotifications', 'Haptics', 'Share'];
        for (const plugin of requiredPlugins) {
          const isAvailable = await checkPluginAvailability(plugin);
          if (!isAvailable) {
            warnings.push(`Native plugin ${plugin} is not available`);
          }
        }
      }

      // Check network connectivity for API endpoints
      try {
        const response = await fetch(buildConfig.apiUrl + '/health', { 
          method: 'HEAD',
          timeout: 5000 
        } as RequestInit);
        if (!response.ok) {
          warnings.push('API endpoint health check failed');
        }
      } catch (error) {
        warnings.push('Unable to reach API endpoint');
      }

      setValidation({
        isValid: errors.length === 0,
        warnings,
        errors,
        platform
      });
    };

    validateBuild();
  }, [isNative, platform]);

  return validation;
};

const getIOSVersion = async (): Promise<string | null> => {
  try {
    const { Device } = await import('@capacitor/device');
    const info = await Device.getInfo();
    return info.osVersion;
  } catch (error) {
    return null;
  }
};

const checkPluginAvailability = async (pluginName: string): Promise<boolean> => {
  try {
    switch (pluginName) {
      case 'Camera':
        const { Camera } = await import('@capacitor/camera');
        return !!Camera;
      case 'PushNotifications':
        const { PushNotifications } = await import('@capacitor/push-notifications');
        return !!PushNotifications;
      case 'Haptics':
        const { Haptics } = await import('@capacitor/haptics');
        return !!Haptics;
      case 'Share':
        const { Share } = await import('@capacitor/share');
        return !!Share;
      default:
        return false;
    }
  } catch (error) {
    return false;
  }
};

const compareVersions = (version1: string, version2: string): number => {
  const v1parts = version1.split('.').map(Number);
  const v2parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;
    
    if (v1part < v2part) return -1;
    if (v1part > v2part) return 1;
  }
  
  return 0;
};