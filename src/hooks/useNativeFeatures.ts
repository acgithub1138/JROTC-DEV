import { useCallback } from 'react';
import { useCapacitor } from './useCapacitor';

export const useNativeFeatures = () => {
  const { isNative, platform } = useCapacitor();

  const openCamera = useCallback(async () => {
    if (!isNative) {
      console.log('Camera not available on web platform');
      return null;
    }

    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      return image;
    } catch (error) {
      console.error('Error accessing camera:', error);
      return null;
    }
  }, [isNative]);

  const shareContent = useCallback(async (title: string, text: string, url?: string) => {
    if (!isNative) {
      // Fallback to web share API if available
      if (navigator.share) {
        try {
          await navigator.share({ title, text, url });
          return true;
        } catch (error) {
          console.log('Web share cancelled or failed');
          return false;
        }
      }
      console.log('Share not available on web platform');
      return false;
    }

    try {
      const { Share } = await import('@capacitor/share');
      
      await Share.share({
        title,
        text,
        url,
      });
      
      return true;
    } catch (error) {
      console.error('Error sharing content:', error);
      return false;
    }
  }, [isNative]);

  const hapticFeedback = useCallback(async (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!isNative) {
      console.log('Haptic feedback not available on web platform');
      return;
    }

    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      
      const style = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      }[type];

      await Haptics.impact({ style });
    } catch (error) {
      console.error('Error with haptic feedback:', error);
    }
  }, [isNative]);

  const getDeviceInfo = useCallback(async () => {
    if (!isNative) {
      return {
        platform: 'web',
        model: 'Web Browser',
        operatingSystem: navigator.userAgent,
        osVersion: 'Unknown',
        manufacturer: 'Web',
        isVirtual: false,
        webViewVersion: 'N/A',
      };
    }

    try {
      const { Device } = await import('@capacitor/device');
      return await Device.getInfo();
    } catch (error) {
      console.error('Error getting device info:', error);
      return null;
    }
  }, [isNative]);

  const openAppSettings = useCallback(async () => {
    if (!isNative) {
      console.log('App settings not available on web platform');
      return;
    }

    try {
      const { App } = await import('@capacitor/app');
      // For mobile platforms, we'll use alternative approaches
      if (platform === 'ios') {
        // iOS doesn't allow direct app settings access via Capacitor
        console.log('iOS app settings access requires native implementation');
      } else {
        // Android also requires native plugin for settings access
        console.log('Android app settings access requires native implementation');
      }
    } catch (error) {
      console.error('Error opening app settings:', error);
    }
  }, [isNative, platform]);

  return {
    isNative,
    platform,
    openCamera,
    shareContent,
    hapticFeedback,
    getDeviceInfo,
    openAppSettings,
  };
};