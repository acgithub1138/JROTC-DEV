import { useEffect, useRef, useState, ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  className?: string;
  rootMargin?: string;
  placeholder?: ReactNode;
}

/**
 * Lazy-loads children when section enters viewport.
 * Uses Intersection Observer to defer rendering of off-screen content,
 * reducing initial render work and message handler violations from Tailwind CDN.
 */
export const LazySection = ({ 
  children, 
  className = '', 
  rootMargin = '200px',
  placeholder
}: LazySectionProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div 
      ref={ref} 
      className={className}
      style={{ contentVisibility: isVisible ? 'visible' : 'auto' }}
    >
      {isVisible ? children : (placeholder || <div className="min-h-[200px]" />)}
    </div>
  );
};
