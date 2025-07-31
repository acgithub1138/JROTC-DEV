import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompetitionEvents } from './hooks/useCompetitionEvents';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type CpCompetition = Database['public']['Tables']['cp_competitions']['Row'];

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  open,
  onOpenChange
}) => {
  const { createEvent } = useCompetitionEvents();
  const { userProfile } = useAuth();
  const [competitions, setCompetitions] = useState<CpCompetition[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    competition_id: '',
    name: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    max_participants: '',
    sop: 'text' as 'text' | 'link',
    sop_text: '',
    sop_link: ''
  });

  // Fetch competitions for the select dropdown
  useEffect(() => {
    const fetchCompetitions = async () => {
      if (!userProfile?.school_id) return;
      
      const { data, error } = await supabase
        .from('cp_competitions')
        .select('*')
        .eq('school_id', userProfile.school_id);
      
      if (!error && data) {
        setCompetitions(data);
      }
    };

    if (open) {
      fetchCompetitions();
    }
  }, [open, userProfile?.school_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.competition_id || !formData.name) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createEvent({
        competition_id: formData.competition_id,
        name: formData.name,
        description: formData.description || null,
        event_date: formData.event_date || null,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        sop: formData.sop,
        sop_text: formData.sop === 'text' ? formData.sop_text || null : null,
        sop_link: formData.sop === 'link' ? formData.sop_link || null : null
      });

      // Reset form
      setFormData({
        competition_id: '',
        name: '',
        description: '',
        event_date: '',
        start_time: '',
        end_time: '',
        max_participants: '',
        sop: 'text' as 'text' | 'link',
        sop_text: '',
        sop_link: ''
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
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="competition">Competition *</Label>
              <Select 
                value={formData.competition_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, competition_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select competition" />
                </SelectTrigger>
                <SelectContent>
                  {competitions.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name}
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date">Event Date</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_participants">Max Participants</Label>
            <Input
              id="max_participants"
              type="number"
              value={formData.max_participants}
              onChange={(e) => setFormData(prev => ({ ...prev, max_participants: e.target.value }))}
              placeholder="Enter maximum participants"
            />
          </div>

          <div className="space-y-2">
            <Label>SOP Type</Label>
            <Select 
              value={formData.sop} 
              onValueChange={(value: 'text' | 'link') => setFormData(prev => ({ ...prev, sop: value, sop_text: '', sop_link: '' }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text Content</SelectItem>
                <SelectItem value="link">External Link</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.sop === 'text' ? (
            <div className="space-y-2">
              <Label htmlFor="sop_text">SOP Content</Label>
              <Textarea
                id="sop_text"
                value={formData.sop_text}
                onChange={(e) => setFormData(prev => ({ ...prev, sop_text: e.target.value }))}
                placeholder="Enter SOP text content"
                rows={4}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="sop_link">SOP Link</Label>
              <Input
                id="sop_link"
                type="url"
                value={formData.sop_link}
                onChange={(e) => setFormData(prev => ({ ...prev, sop_link: e.target.value }))}
                placeholder="Enter SOP link URL"
              />
            </div>
          )}

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