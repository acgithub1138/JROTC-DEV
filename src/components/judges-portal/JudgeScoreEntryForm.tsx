import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EventScoreForm } from '@/components/competition-management/components/EventScoreForm';
import { useCompetitionTemplates } from '@/components/competition-portal/my-competitions/hooks/useCompetitionTemplates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface JudgeScoreEntryFormProps {
  templateId: string;
  schoolId: string;
  eventId: string;
  competitionId: string;
  onSuccess?: () => void;
}

export const JudgeScoreEntryForm: React.FC<JudgeScoreEntryFormProps> = ({
  templateId,
  schoolId,
  eventId,
  competitionId,
  onSuccess
}) => {
  const { templates } = useCompetitionTemplates();
  const [judgeNumber, setJudgeNumber] = useState('');
  const [scores, setScores] = useState<Record<string, any>>({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const template = templates.find(t => t.id === templateId);

  const handleScoreChange = (newScores: Record<string, any>, newTotal: number) => {
    setScores(newScores);
    setTotalPoints(newTotal);
  };

  const handleSubmit = async () => {
    if (!judgeNumber.trim()) {
      toast.error('Please enter a judge number');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('competition_events')
        .insert([{
          school_id: schoolId,
          event: eventId,
          competition_id: competitionId,
          source_competition_id: competitionId,
          source_type: 'portal' as const,
          score_sheet: {
            template_id: templateId,
            judge_number: judgeNumber,
            scores: scores
          },
          total_points: totalPoints,
          cadet_ids: []
        }]);

      if (error) throw error;

      toast.success('Score sheet submitted successfully');
      
      // Reset form
      setJudgeNumber('');
      setScores({});
      setTotalPoints(0);
      
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting score sheet:', error);
      toast.error('Failed to submit score sheet');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!template) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading template...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter Score Sheet</CardTitle>
        <p className="text-sm text-muted-foreground">
          Template: {template.template_name}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="judgeNumber">Judge Number</Label>
          <Input
            id="judgeNumber"
            value={judgeNumber}
            onChange={(e) => setJudgeNumber(e.target.value)}
            placeholder="Enter judge number"
            className="max-w-xs"
          />
        </div>

        <EventScoreForm
          templateScores={template.scores as Record<string, any>}
          onScoreChange={handleScoreChange}
          initialScores={scores}
          judgeNumber={judgeNumber}
        />

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !judgeNumber.trim()}
            className="min-w-32"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Score Sheet'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
