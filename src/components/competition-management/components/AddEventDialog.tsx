import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompetitionTemplates } from '../hooks/useCompetitionTemplates';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { EventScoreForm } from './EventScoreForm';

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionId: string;
  onEventCreated: (eventData: any) => void;
}

export const AddEventDialog: React.FC<AddEventDialogProps> = ({
  open,
  onOpenChange,
  competitionId,
  onEventCreated
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedCadetId, setSelectedCadetId] = useState<string>('');
  const [scores, setScores] = useState<Record<string, any>>({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { templates, isLoading: templatesLoading } = useCompetitionTemplates();
  const { users: cadets, isLoading: cadetsLoading } = useSchoolUsers(true);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const activeCadets = cadets.filter(user => user.role === 'cadet');

  const handleSubmit = async () => {
    if (!selectedTemplateId || !selectedCadetId) {
      return;
    }

    setIsSubmitting(true);
    try {
      const eventData = {
        cadet_id: selectedCadetId,
        event: selectedTemplate?.event,
        score_sheet: {
          template_id: selectedTemplateId,
          template_name: selectedTemplate?.template_name,
          scores: scores,
          calculated_at: new Date().toISOString()
        },
        total_points: totalPoints
      };

      await onEventCreated(eventData);
      
      // Reset form
      setSelectedTemplateId('');
      setSelectedCadetId('');
      setScores({});
      setTotalPoints(0);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScoreChange = (newScores: Record<string, any>, newTotal: number) => {
    setScores(newScores);
    setTotalPoints(newTotal);
  };

  const isFormValid = selectedTemplateId && selectedCadetId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Competition Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Score Sheet Template</Label>
            <Select 
              value={selectedTemplateId} 
              onValueChange={setSelectedTemplateId}
              disabled={templatesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a score sheet template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.template_name} - {template.event}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cadet Selection */}
          <div className="space-y-2">
            <Label>Cadet</Label>
            <Select 
              value={selectedCadetId} 
              onValueChange={setSelectedCadetId}
              disabled={cadetsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cadet..." />
              </SelectTrigger>
              <SelectContent>
                {activeCadets.map((cadet) => (
                  <SelectItem key={cadet.id} value={cadet.id}>
                    {cadet.first_name} {cadet.last_name}
                    {cadet.grade && ` (${cadet.grade})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Score Form */}
          {selectedTemplate && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">
                Score Sheet: {selectedTemplate.template_name}
              </h3>
              <EventScoreForm
                templateScores={selectedTemplate.scores as Record<string, any>}
                onScoreChange={handleScoreChange}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};