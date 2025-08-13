import * as React from "react"
import { useCapacitor } from '@/hooks/useCapacitor'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  const { isNative, platform } = useCapacitor();
  
  React.useEffect(() => {
    const detectMobile = () => {
      // Check screen width
      const screenIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
      
      // Check user agent for mobile devices
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent);
      
      // Check for touch support
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Final mobile detection
      const detectedMobile = screenIsMobile || isMobileUA || (isTouchDevice && window.innerWidth <= 1300);
      
      console.log('Mobile detection detailed:', { 
        windowWidth: window.innerWidth, 
        breakpoint: MOBILE_BREAKPOINT, 
        screenIsMobile,
        isMobileUA,
        isTouchDevice,
        detectedMobile,
        userAgent: navigator.userAgent,
        location: window.location.href
      });
      
      return detectedMobile;
    };

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      const newIsMobile = detectMobile();
      console.log('Mobile detection onChange:', { 
        windowWidth: window.innerWidth, 
        isMobile: newIsMobile,
        userAgent: navigator.userAgent
      });
      setIsMobile(newIsMobile)
    }
    mql.addEventListener("change", onChange)
    
    const initialIsMobile = detectMobile();
    setIsMobile(initialIsMobile)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  const result = isNative || isMobile;
  console.log('useIsMobile hook result:', { isMobile, isNative, platform, result });
  return result
}
