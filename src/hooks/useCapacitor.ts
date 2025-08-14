import { useEffect, useState } from 'react';

interface CapacitorInfo {
  isNative: boolean;
  platform: string;
  isLoading: boolean;
}

// Global state to prevent multiple detections
let globalCapacitorInfo: CapacitorInfo | null = null;
let isDetecting = false;
const subscribers = new Set<(info: CapacitorInfo) => void>();

export const useCapacitor = (): CapacitorInfo => {
  const [capacitorInfo, setCapacitorInfo] = useState<CapacitorInfo>(
    globalCapacitorInfo || {
      isNative: false,
      platform: 'web',
      isLoading: true,
    }
  );

  useEffect(() => {
    // If we already have the info, use it immediately
    if (globalCapacitorInfo) {
      setCapacitorInfo(globalCapacitorInfo);
      return;
    }

    // Subscribe to updates
    subscribers.add(setCapacitorInfo);

    // Only run detection once globally
    if (!isDetecting) {
      isDetecting = true;
      initCapacitorGlobally();
    }

    return () => {
      subscribers.delete(setCapacitorInfo);
    };
  }, []);

  return capacitorInfo;
};

const initCapacitorGlobally = async () => {
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
      
      const info = {
        isNative,
        platform,
        isLoading: false,
      };
      
      globalCapacitorInfo = info;
      notifySubscribers(info);
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
        
        const info = {
          isNative,
          platform,
          isLoading: false,
        };
        
        globalCapacitorInfo = info;
        notifySubscribers(info);
      } catch (importError) {
        console.log('Failed to import Capacitor, falling back to web', importError);
        const info = {
          isNative: false,
          platform: 'web',
          isLoading: false,
        };
        
        globalCapacitorInfo = info;
        notifySubscribers(info);
      }
    } else {
      console.log('Running on web platform');
      const info = {
        isNative: false,
        platform: 'web',
        isLoading: false,
      };
      
      globalCapacitorInfo = info;
      notifySubscribers(info);
    }
  } catch (error) {
    console.log('Capacitor not available, running on web', error);
    const info = {
      isNative: false,
      platform: 'web',
      isLoading: false,
    };
    
    globalCapacitorInfo = info;
    notifySubscribers(info);
  }
};

const notifySubscribers = (info: CapacitorInfo) => {
  subscribers.forEach(callback => callback(info));
};