import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  
  React.useEffect(() => {
    const detectMobile = () => {
      // Check screen width
      const screenIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
      
      // Check user agent for mobile devices
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Separate iPad detection - iPads should be treated as desktop when screen is large enough
      const isIpad = /ipad/i.test(userAgent);
      const isMobileUA = /android|webos|iphone|ipod|blackberry|iemobile|opera mini|mobile/i.test(userAgent);
      
      // Final mobile detection - treat iPad as mobile only if screen width is small
      const detectedMobile = screenIsMobile || (isMobileUA && !isIpad) || (isIpad && screenIsMobile);
      
      return detectedMobile;
    };

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      const newIsMobile = detectMobile();
      setIsMobile(newIsMobile)
    }
    mql.addEventListener("change", onChange)
    
    const initialIsMobile = detectMobile();
    setIsMobile(initialIsMobile)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile;
}
