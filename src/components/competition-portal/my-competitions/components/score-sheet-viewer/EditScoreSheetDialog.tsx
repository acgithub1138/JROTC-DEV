import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CompetitionEvent } from './types';
import { getCleanFieldName } from './utils/fieldHelpers';

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
  const [scores, setScores] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [judgeNumber, setJudgeNumber] = useState('');

  useEffect(() => {
    if (event && event.score_sheet?.scores) {
      setScores(event.score_sheet.scores);
      setJudgeNumber(event.score_sheet.judge_number || '');
    }
  }, [event]);

  const handleScoreChange = (fieldName: string, value: string) => {
    setScores(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    Object.values(scores).forEach(value => {
      const numValue = parseFloat(value) || 0;
      total += numValue;
    });
    return total;
  };

  const handleSave = async () => {
    if (!event) return;

    setIsLoading(true);
    try {
      const updatedScoreSheet = {
        ...event.score_sheet,
        scores,
        judge_number: judgeNumber,
        calculated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('competition_events')
        .update({
          score_sheet: updatedScoreSheet,
          total_points: calculateTotal(),
          updated_at: new Date().toISOString()
        })
        .eq('id', event.id);

      if (error) {
        throw error;
      }

      toast.success('Score sheet updated successfully');
      onEventUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating score sheet:', error);
      toast.error('Failed to update score sheet');
    } finally {
      setIsLoading(false);
    }
  };

  if (!event) return null;

  const sortedFieldNames = Object.keys(scores).sort((a, b) => {
    const getNumber = (str: string) => {
      const match = str.match(/^field_(\d+)/);
      return match ? parseInt(match[1]) : 999;
    };
    return getNumber(a) - getNumber(b);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Score Sheet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="judge-number">Judge Number</Label>
            <Input
              id="judge-number"
              value={judgeNumber}
              onChange={(e) => setJudgeNumber(e.target.value)}
              placeholder="Enter judge number"
              className="mt-1"
            />
          </div>

          <Separator />

          <ScrollArea className="max-h-[400px]">
            <div className="space-y-4 pr-4">
              {sortedFieldNames.map((fieldName) => (
                <div key={fieldName} className="space-y-2">
                  <Label htmlFor={fieldName} className="text-sm font-medium">
                    {getCleanFieldName(fieldName)}
                  </Label>
                  <Input
                    id={fieldName}
                    type="number"
                    value={scores[fieldName] || ''}
                    onChange={(e) => handleScoreChange(fieldName, e.target.value)}
                    placeholder="Enter score"
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </ScrollArea>

          <Separator />

          <div className="bg-muted/30 p-3 rounded-md">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Points:</span>
              <span className="text-lg font-bold">{calculateTotal()}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};