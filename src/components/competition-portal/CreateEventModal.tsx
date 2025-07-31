import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompetitionEvents } from './hooks/useCompetitionEvents';
import { useCompetitionTemplates } from '../competition-management/hooks/useCompetitionTemplates';
import { JROTC_PROGRAM_OPTIONS } from '../competition-management/utils/constants';

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { createEvent } = useCompetitionEvents();
  const { templates } = useCompetitionTemplates();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    score_sheet: '',
    jrotc_program: ''
  });

  const handleScoreSheetChange = (value: string) => {
    setFormData(prev => ({ ...prev, score_sheet: value }));
    
    // Auto-populate event name and jrotc_program from score sheet template
    const selectedTemplate = templates.find(template => template.id === value);
    if (selectedTemplate?.template_name) {
      const parts = selectedTemplate.template_name.split(' - ');
      if (parts.length > 1) {
        // Take everything after the first hyphen
        const eventName = parts.slice(1).join(' - ').trim();
        setFormData(prev => ({ 
          ...prev, 
          name: eventName,
          jrotc_program: selectedTemplate.jrotc_program
        }));
      }
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.score_sheet || !formData.jrotc_program) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createEvent({
        name: formData.name,
        description: formData.description || null,
        score_sheet: formData.score_sheet || null,
        jrotc_program: formData.jrotc_program || null
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        score_sheet: '',
        jrotc_program: ''
      });
      
      onOpenChange(false);
      onSuccess?.();
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
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="score_sheet">Score Sheet *</Label>
            <Select 
              value={formData.score_sheet} 
              onValueChange={handleScoreSheetChange}
              required
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

          <div className="space-y-2">
            <Label htmlFor="jrotc_program">Event Type *</Label>
            <Select 
              value={formData.jrotc_program} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, jrotc_program: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select JROTC program" />
              </SelectTrigger>
              <SelectContent>
                {JROTC_PROGRAM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};