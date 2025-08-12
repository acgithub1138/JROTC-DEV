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
        // More comprehensive check for Capacitor environment
        const isCapacitorEnv = typeof window !== 'undefined' && (
          window.location.protocol === 'capacitor:' || 
          (window as any).Capacitor || 
          (window as any).IonicNative ||
          document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1
        );
        
        if (isCapacitorEnv) {
          const { Capacitor } = await import('@capacitor/core');
          
          const isNative = Capacitor.isNativePlatform();
          const platform = Capacitor.getPlatform();
          
          console.log('Capacitor detected:', { isNative, platform });
          
          setCapacitorInfo({
            isNative,
            platform,
            isLoading: false,
          });
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