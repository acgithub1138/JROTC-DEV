import React from 'react';
import { Header } from '@/components/layout/Header';
import { useCapacitor } from '@/hooks/useCapacitor';
import { useNativeFeatures } from '@/hooks/useNativeFeatures';

interface MobileOptimizedHeaderProps {
  activeModule: string;
  onModuleChange?: (module: string) => void;
  isMobile?: boolean;
  showSidebarToggle?: boolean;
  onSidebarToggle?: () => void;
}

export const MobileOptimizedHeader: React.FC<MobileOptimizedHeaderProps> = (props) => {
  const { isNative } = useCapacitor();
  const { hapticFeedback } = useNativeFeatures();

  // Enhanced header for mobile with haptic feedback
  const handleModuleChange = async (module: string) => {
    if (isNative) {
      await hapticFeedback('light');
    }
    props.onModuleChange?.(module);
  };

  const handleSidebarToggle = async () => {
    if (isNative) {
      await hapticFeedback('light');
    }
    props.onSidebarToggle?.();
  };

  return (
    <div className={isNative ? 'pt-safe-area-inset-top' : ''}>
      <Header
        {...props}
        onModuleChange={handleModuleChange}
        onSidebarToggle={handleSidebarToggle}
      />
    </div>
  );
};