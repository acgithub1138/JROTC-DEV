import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface JobRoleEmailConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
  newEmail: string;
  cadetName: string;
  onReplace: () => void;
  onKeep: () => void;
}

export function JobRoleEmailConfirmModal({
  open,
  onOpenChange,
  currentEmail,
  newEmail,
  cadetName,
  onReplace,
  onKeep,
}: JobRoleEmailConfirmModalProps) {
  const handleReplace = () => {
    onReplace();
    onOpenChange(false);
  };

  const handleKeep = () => {
    onKeep();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Job Role Email Conflict</DialogTitle>
          <DialogDescription className="space-y-2">
            <p>
              {cadetName} already has a job role email address:
            </p>
            <p className="font-medium text-foreground">
              Current: {currentEmail}
            </p>
            <p className="font-medium text-foreground">
              New: {newEmail}
            </p>
            <p>
              Would you like to replace the current email with the new one?
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleKeep}>
            Do not replace
          </Button>
          <Button onClick={handleReplace}>
            Replace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}