import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompetitionEvents } from './hooks/useCompetitionEvents';
import { useCompetitionTemplates } from '../competition-management/hooks/useCompetitionTemplates';

type CpEvent = {
  id: string;
  school_id: string;
  name: string;
  description?: string | null;
  score_sheet?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
};

interface EditEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CpEvent | null;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  open,
  onOpenChange,
  event
}) => {
  const { updateEvent } = useCompetitionEvents();
  const { templates } = useCompetitionTemplates();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    score_sheet: ''
  });

  // Reset form when event changes or modal opens
  useEffect(() => {
    if (event && open) {
      setFormData({
        name: event.name || '',
        description: event.description || '',
        score_sheet: event.score_sheet || ''
      });
    }
  }, [event, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !event) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateEvent(event.id, {
        name: formData.name,
        description: formData.description || null,
        score_sheet: formData.score_sheet || null
      });
      
      onOpenChange(false);
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter event name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter event description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="score_sheet">Score Sheet</Label>
            <Select 
              value={formData.score_sheet} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, score_sheet: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select score sheet template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.template_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};