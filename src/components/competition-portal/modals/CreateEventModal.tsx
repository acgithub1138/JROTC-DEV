import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JROTC_PROGRAM_OPTIONS } from '../../competition-management/utils/constants';

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onEventCreate: (eventData: {
    name: string;
    description?: string | null;
    score_sheet?: string | null;
    jrotc_program?: string | null;
  }) => Promise<any>;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  onEventCreate
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    score_sheet: '',
    jrotc_program: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      await onEventCreate({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        score_sheet: formData.score_sheet.trim() || null,
        jrotc_program: formData.jrotc_program || null
      });
      
      setFormData({
        name: '',
        description: '',
        score_sheet: '',
        jrotc_program: ''
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Event Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter event name"
              required
            />
          </div>

          <div>
            <Label htmlFor="jrotc_program">Event Type</Label>
            <Select value={formData.jrotc_program} onValueChange={(value) => setFormData(prev => ({ ...prev, jrotc_program: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {JROTC_PROGRAM_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter event description"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="score_sheet">Score Sheet Template</Label>
            <Input
              id="score_sheet"
              value={formData.score_sheet}
              onChange={(e) => setFormData(prev => ({ ...prev, score_sheet: e.target.value }))}
              placeholder="Score sheet template name"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};