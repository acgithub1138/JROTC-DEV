import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import { Incident } from '@/hooks/incidents/useIncidents';

interface CancelIncidentDialogProps {
  incident: Incident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

export const CancelIncidentDialog: React.FC<CancelIncidentDialogProps> = ({
  incident,
  open,
  onOpenChange,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm(reason);
      setReason('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Cancel Incident
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              You are about to cancel incident <strong>{incident?.incident_number}</strong>: 
              <span className="font-medium"> {incident?.title}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Please provide a reason for canceling this incident. This will be added as a comment.
            </p>
          </div>

          <div>
            <Textarea
              placeholder="Enter reason for canceling this incident..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!reason.trim() || isSubmitting}
            >
              {isSubmitting ? 'Canceling...' : 'Cancel Incident'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};