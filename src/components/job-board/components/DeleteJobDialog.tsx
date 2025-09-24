
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
import { JobBoardWithCadet } from '../types';

interface DeleteJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobBoardWithCadet | null;
  onConfirm: () => void;
  loading: boolean;
}

export const DeleteJobDialog = ({ 
  open, 
  onOpenChange, 
  job, 
  onConfirm, 
  loading 
}: DeleteJobDialogProps) => {
  if (!job) return null;

  const formatCadetName = (cadet: JobBoardWithCadet['cadet']) => {
    if (!cadet) return 'Unassigned';
    return `${cadet.last_name}, ${cadet.first_name}${cadet.rank ? ` - ${cadet.rank}` : ''}`;
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Job</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the job "{job.role}" assigned to {formatCadetName(job.cadet)}? 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
