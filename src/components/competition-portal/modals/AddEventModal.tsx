import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useCompetitionEvents } from '@/hooks/competition-portal/useCompetitionEvents';
import type { Database } from '@/integrations/supabase/types';

type CompEventInsert = Database['public']['Tables']['cp_comp_events']['Insert'];

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: string;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  competitionId
}) => {
  const { createEvent } = useCompetitionEvents(competitionId);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CompEventInsert>>({
    competition_id: competitionId,
    location: '',
    start_time: '',
    end_time: '',
    max_participants: undefined,
    notes: '',
    sop_text: '',
    sop_link: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.event) {
      toast.error('Please select an event');
      return;
    }

    setIsLoading(true);
    try {
      await createEvent(formData as CompEventInsert);
      onClose();
      setFormData({
        competition_id: competitionId,
        location: '',
        start_time: '',
        end_time: '',
        max_participants: undefined,
        notes: '',
        sop_text: '',
        sop_link: ''
      });
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Competition Event</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event">Event *</Label>
              <Select
                value={formData.event?.toString() || ''}
                onValueChange={(value) => handleChange('event', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="armed_regulation">Armed Regulation</SelectItem>
                  <SelectItem value="armed_exhibition">Armed Exhibition</SelectItem>
                  <SelectItem value="unarmed_regulation">Unarmed Regulation</SelectItem>
                  <SelectItem value="unarmed_exhibition">Unarmed Exhibition</SelectItem>
                  <SelectItem value="color_guard">Color Guard</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Event location"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time || ''}
                onChange={(e) => handleChange('start_time', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time || ''}
                onChange={(e) => handleChange('end_time', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="max_participants">Maximum Participants</Label>
            <Input
              id="max_participants"
              type="number"
              value={formData.max_participants || ''}
              onChange={(e) => handleChange('max_participants', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Maximum number of participants"
            />
          </div>

          <div>
            <Label htmlFor="sop_link">SOP Link</Label>
            <Input
              id="sop_link"
              value={formData.sop_link || ''}
              onChange={(e) => handleChange('sop_link', e.target.value)}
              placeholder="Link to Standard Operating Procedures"
            />
          </div>

          <div>
            <Label htmlFor="sop_text">SOP Text</Label>
            <Textarea
              id="sop_text"
              value={formData.sop_text || ''}
              onChange={(e) => handleChange('sop_text', e.target.value)}
              placeholder="Standard Operating Procedures text"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes for this event"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};