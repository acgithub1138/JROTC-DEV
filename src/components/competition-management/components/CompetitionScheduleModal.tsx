import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CompetitionScheduleTab } from '@/components/competition-portal/tabs/CompetitionScheduleTab';

interface CompetitionScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  competitionName: string;
}

export const CompetitionScheduleModal: React.FC<CompetitionScheduleModalProps> = ({
  open,
  onOpenChange,
  competitionId,
  competitionName
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Competition Schedule - {competitionName}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <CompetitionScheduleTab competitionId={competitionId} />
        </div>
      </DialogContent>
    </Dialog>
  );
};