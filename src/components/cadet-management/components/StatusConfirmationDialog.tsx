
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
import { Profile } from '../types';

interface StatusConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileToToggle: Profile | null;
  onConfirm: () => void;
  loading: boolean;
}

export const StatusConfirmationDialog = ({ 
  open, 
  onOpenChange, 
  profileToToggle, 
  onConfirm, 
  loading 
}: StatusConfirmationDialogProps) => {
  if (!profileToToggle) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {profileToToggle.active ? 'Deactivate' : 'Activate'} Cadet
          </AlertDialogTitle>
          <AlertDialogDescription>
            {profileToToggle.active 
              ? `Are you sure you want to deactivate ${profileToToggle.first_name} ${profileToToggle.last_name}? They will be unable to log in.`
              : `Are you sure you want to reactivate ${profileToToggle.first_name} ${profileToToggle.last_name}? They will be able to log in again.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className={profileToToggle.active ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {loading ? 'Processing...' : (profileToToggle.active ? 'Deactivate' : 'Activate')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
