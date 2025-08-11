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
        // Check if we're in a Capacitor environment
        if (typeof window !== 'undefined' && window.location.protocol === 'capacitor:') {
          const { Capacitor } = await import('@capacitor/core');
          
          setCapacitorInfo({
            isNative: Capacitor.isNativePlatform(),
            platform: Capacitor.getPlatform(),
            isLoading: false,
          });
        } else {
          setCapacitorInfo({
            isNative: false,
            platform: 'web',
            isLoading: false,
          });
        }
      } catch (error) {
        console.log('Capacitor not available, running on web');
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