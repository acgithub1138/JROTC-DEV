import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EventScoreForm } from '../EventScoreForm';
import { useCompetitionTemplates } from '../../hooks/useCompetitionTemplates';
import type { CompetitionEvent } from './types';

interface EditScoreSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CompetitionEvent | null;
  onEventUpdated: () => void;
}

export const EditScoreSheetDialog: React.FC<EditScoreSheetDialogProps> = ({
  open,
  onOpenChange,
  event,
  onEventUpdated
}) => {
  const [scores, setScores] = useState<Record<string, any>>({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { templates } = useCompetitionTemplates();

  // Find the template for this event
  const template = templates.find(t => t.id === event?.score_sheet?.template_id);

  const handleScoreChange = (newScores: Record<string, any>, newTotal: number) => {
    setScores(newScores);
    setTotalPoints(newTotal);
  };

  const handleSubmit = async () => {
    if (!event) return;

    setIsSubmitting(true);
    try {
      const updatedScoreSheet = {
        ...event.score_sheet,
        scores: scores,
        calculated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('competition_events')
        .update({
          score_sheet: updatedScoreSheet,
          total_points: totalPoints
        })
        .eq('id', event.id);

      if (error) throw error;

      toast.success('Score sheet updated successfully');
      onEventUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating score sheet:', error);
      toast.error('Failed to update score sheet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cadetName = event?.profiles 
    ? `${event.profiles.first_name} ${event.profiles.last_name}`
    : 'Unknown Cadet';

  const judgeNumber = event?.score_sheet?.judge_number || 'Unknown Judge';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit Score Sheet - {cadetName} ({judgeNumber})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {template && event ? (
            <EventScoreForm
              templateScores={template.scores as Record<string, any>}
              onScoreChange={handleScoreChange}
              initialScores={event.score_sheet?.scores || {}}
              judgeNumber={judgeNumber}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Template not found for this score sheet.</p>
              <p className="text-sm mt-2">Unable to edit scores without template data.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!template || isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Score Sheet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};