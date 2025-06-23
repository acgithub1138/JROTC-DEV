
import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { SidebarCustomizationDialog } from './SidebarCustomizationDialog';

interface SidebarCustomizationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPreferencesUpdated?: () => void;
}

export const SidebarCustomization: React.FC<SidebarCustomizationProps> = ({
  open,
  onOpenChange,
  onPreferencesUpdated,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SidebarCustomizationDialog
        onOpenChange={onOpenChange}
        onPreferencesUpdated={onPreferencesUpdated}
      />
    </Dialog>
  );
};
