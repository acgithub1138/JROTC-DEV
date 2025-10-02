
import React from 'react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface MassDeactivateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<boolean>;
  selectedCount: number;
  loading: boolean;
}

export const MassDeactivateDialog = ({
  open,
  onOpenChange,
  onConfirm,
  selectedCount,
  loading
}: MassDeactivateDialogProps) => {
  const handleConfirm = async () => {
    const success = await onConfirm();
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Deactivate {selectedCount} Cadet{selectedCount !== 1 ? 's' : ''}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to deactivate {selectedCount} selected cadet{selectedCount !== 1 ? 's' : ''}? 
            They will be moved to the Non-Active tab and will be unable to log in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Deactivating...' : 'Deactivate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
