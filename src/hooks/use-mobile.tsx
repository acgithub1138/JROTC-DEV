import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
      console.log('Mobile detection onChange:', { 
        windowWidth: window.innerWidth, 
        breakpoint: MOBILE_BREAKPOINT, 
        isMobile: newIsMobile,
        userAgent: navigator.userAgent
      });
      setIsMobile(newIsMobile)
    }
    mql.addEventListener("change", onChange)
    
    const initialIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
    console.log('Mobile detection initial:', { 
      windowWidth: window.innerWidth, 
      breakpoint: MOBILE_BREAKPOINT, 
      isMobile: initialIsMobile,
      userAgent: navigator.userAgent,
      location: window.location.href
    });
    setIsMobile(initialIsMobile)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  const result = !!isMobile;
  console.log('useIsMobile hook result:', { isMobile, result });
  return result
}
