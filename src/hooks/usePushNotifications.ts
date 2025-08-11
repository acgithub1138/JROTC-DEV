import { useEffect, useState, useCallback } from 'react';
import { useCapacitor } from './useCapacitor';

export interface PushNotificationState {
  isRegistered: boolean;
  token: string | null;
  isSupported: boolean;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unknown' | 'prompt-with-rationale';
}

export const usePushNotifications = () => {
  const { isNative } = useCapacitor();
  const [state, setState] = useState<PushNotificationState>({
    isRegistered: false,
    token: null,
    isSupported: false,
    permissionStatus: 'unknown'
  });

  const requestPermissions = useCallback(async () => {
    if (!isNative) {
      console.log('Push notifications not available on web');
      return false;
    }

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      
      const result = await PushNotifications.requestPermissions();
      
      setState(prev => ({
        ...prev,
        permissionStatus: result.receive,
        isSupported: true
      }));

      return result.receive === 'granted';
    } catch (error) {
      console.error('Error requesting push notification permissions:', error);
      return false;
    }
  }, [isNative]);

  const register = useCallback(async () => {
    if (!isNative) {
      console.log('Push notifications not available on web');
      return null;
    }

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      
      await PushNotifications.register();
      
      setState(prev => ({
        ...prev,
        isRegistered: true
      }));

      return true;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return false;
    }
  }, [isNative]);

  const checkPermissions = useCallback(async () => {
    if (!isNative) return;

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      
      const result = await PushNotifications.checkPermissions();
      setState(prev => ({
        ...prev,
        permissionStatus: result.receive,
        isSupported: true
      }));
    } catch (error) {
      console.error('Error checking push notification permissions:', error);
    }
  }, [isNative]);

  const setupListeners = useCallback(async () => {
    if (!isNative) return;

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      // Registration successful
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token: ' + token.value);
        setState(prev => ({
          ...prev,
          token: token.value,
          isRegistered: true
        }));
      });

      // Registration failed
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration failed: ' + JSON.stringify(error));
        setState(prev => ({
          ...prev,
          isRegistered: false
        }));
      });

      // Notification received (app in foreground)
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received: ', notification);
        // Handle foreground notification
      });

      // Notification action performed (app opened from notification)
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed: ', notification);
        // Handle notification tap action
      });

    } catch (error) {
      console.error('Error setting up push notification listeners:', error);
    }
  }, [isNative]);

  const sendTokenToServer = useCallback(async (token: string) => {
    // TODO: Implement server-side token storage
    console.log('Should send token to server:', token);
    
    try {
      // This would be implemented with your backend
      // await supabase.from('push_tokens').upsert({
      //   user_id: auth.user?.id,
      //   token: token,
      //   platform: platform,
      //   updated_at: new Date()
      // });
    } catch (error) {
      console.error('Error sending token to server:', error);
    }
  }, []);

  useEffect(() => {
    if (isNative) {
      setupListeners();
      checkPermissions();
    }
  }, [isNative, setupListeners, checkPermissions]);

  useEffect(() => {
    if (state.token) {
      sendTokenToServer(state.token);
    }
  }, [state.token, sendTokenToServer]);

  return {
    ...state,
    requestPermissions,
    register,
    checkPermissions
  };
};