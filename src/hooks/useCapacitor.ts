import { useEffect, useState } from 'react';

interface CapacitorInfo {
  isNative: boolean;
  platform: string;
  isLoading: boolean;
}

export const useCapacitor = (): CapacitorInfo => {
  const [capacitorInfo, setCapacitorInfo] = useState<CapacitorInfo>({
    isNative: false,
    platform: 'web',
    isLoading: true,
  });

  useEffect(() => {
    const initCapacitor = async () => {
      try {
        console.log('Capacitor detection starting...', {
          windowLocation: window.location.href,
          protocol: window.location.protocol,
          hasCapacitor: !!(window as any).Capacitor,
          hasIonicNative: !!(window as any).IonicNative,
          documentURL: document.URL,
          userAgent: navigator.userAgent,
          isHttps: document.URL.indexOf('https://') === 0,
          isHttp: document.URL.indexOf('http://') === 0,
          isAndroidBridge: navigator.userAgent.includes('AndroidBridge'),
          isCapacitorProtocol: window.location.protocol === 'capacitor:',
          hasCapacitorGlobal: typeof (window as any).Capacitor !== 'undefined'
        });
        
        // Check if Capacitor is already available synchronously (common in native apps)
        const capacitorGlobal = (window as any).Capacitor;
        
        if (capacitorGlobal) {
          console.log('Capacitor found synchronously');
          const isNative = capacitorGlobal.isNativePlatform();
          const platform = capacitorGlobal.getPlatform();
          
          console.log('Capacitor synchronous detection:', { isNative, platform });
          
          setCapacitorInfo({
            isNative,
            platform,
            isLoading: false,
          });
          return;
        }
        
        // More comprehensive check for Capacitor environment
        const isCapacitorEnv = typeof window !== 'undefined' && (
          window.location.protocol === 'capacitor:' || 
          (window as any).Capacitor || 
          (window as any).IonicNative ||
          document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1 ||
          navigator.userAgent.includes('AndroidBridge') ||
          // Check for app-specific patterns
          window.location.href.includes('capacitor://')
        );
        
        console.log('Capacitor environment check:', { isCapacitorEnv });
        
        if (isCapacitorEnv) {
          try {
            const { Capacitor } = await import('@capacitor/core');
            
            const isNative = Capacitor.isNativePlatform();
            const platform = Capacitor.getPlatform();
            
            console.log('Capacitor detected via import:', { isNative, platform });
            
            setCapacitorInfo({
              isNative,
              platform,
              isLoading: false,
            });
          } catch (importError) {
            console.log('Failed to import Capacitor, falling back to web', importError);
            setCapacitorInfo({
              isNative: false,
              platform: 'web',
              isLoading: false,
            });
          }
        } else {
          console.log('Running on web platform');
          setCapacitorInfo({
            isNative: false,
            platform: 'web',
            isLoading: false,
          });
        }
      } catch (error) {
        console.log('Capacitor not available, running on web', error);
        setCapacitorInfo({
          isNative: false,
          platform: 'web',
          isLoading: false,
        });
      }
    };

    initCapacitor();
  }, []);

  return capacitorInfo;
};