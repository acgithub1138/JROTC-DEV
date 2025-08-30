import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCadetsByFlight } from '../hooks/useCadetsByFlight';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { CommunityServiceRecord, CreateCommunityServiceData, UpdateCommunityServiceData } from '../hooks/useCommunityService';
interface CommunityServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: CommunityServiceRecord | null;
  onSubmit: (data: CreateCommunityServiceData | UpdateCommunityServiceData) => void;
  mode: 'create' | 'edit' | 'view';
  isSubmitting?: boolean;
}
interface CadetOption {
  id: string;
  first_name: string;
  last_name: string;
  grade: string | null;
  rank: string | null;
}
export const CommunityServiceDialog: React.FC<CommunityServiceDialogProps> = ({
  open,
  onOpenChange,
  record,
  onSubmit,
  mode,
  isSubmitting = false
}) => {
  const {
    userProfile
  } = useAuth();
  const [cadetId, setCadetId] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [event, setEvent] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch all cadets for selection
  const {
    data: cadets = [],
    isLoading: cadetsLoading
  } = useQuery({
    queryKey: ['cadets-for-community-service', userProfile?.school_id],
    queryFn: async () => {
      if (!userProfile?.school_id) return [];
      const {
        data,
        error
      } = await supabase.from('profiles').select('id, first_name, last_name, grade, rank').eq('school_id', userProfile.school_id).eq('active', true).neq('role', 'instructor').order('last_name');
      if (error) {
        console.error('Error fetching cadets:', error);
        throw error;
      }
      return data as CadetOption[];
    },
    enabled: !!userProfile?.school_id && open
  });
  useEffect(() => {
    if (record && (mode === 'edit' || mode === 'view')) {
      setCadetId(record.cadet_id);
      setDate(new Date(record.date));
      setEvent(record.event);
      setHours(record.hours.toString());
      setNotes(record.notes || '');
    } else {
      // Reset form for create mode
      setCadetId('');
      setDate(new Date());
      setEvent('');
      setHours('');
      setNotes('');
    }
  }, [record, mode, open]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !cadetId || !event || !hours) {
      return;
    }
    const data = {
      cadet_id: cadetId,
      date: date.toISOString().split('T')[0],
      event: event.trim(),
      hours: parseFloat(hours),
      notes: notes.trim() || undefined
    };
    if (mode === 'edit' && record) {
      onSubmit({
        ...data,
        id: record.id
      } as UpdateCommunityServiceData);
    } else {
      onSubmit(data as CreateCommunityServiceData);
    }
  };
  const getSelectedCadet = () => {
    return cadets.find(c => c.id === cadetId);
  };
  const isViewMode = mode === 'view';
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' && 'Add Community Service'}
            {mode === 'edit' && 'Edit Community Service'}
            {mode === 'view' && 'View Community Service'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="cadet">Cadet *</Label>
                {isViewMode ? <div className="p-2 bg-muted rounded-md">
                    {record?.cadet ? `${record.cadet.last_name}, ${record.cadet.first_name}` : 'N/A'}
                    {record?.cadet?.grade && ` (${record.cadet.grade})`}
                  </div> : <Select value={cadetId} onValueChange={setCadetId} disabled={cadetsLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a cadet" />
                    </SelectTrigger>
                    <SelectContent>
                      {cadets.map(cadet => <SelectItem key={cadet.id} value={cadet.id}>
                          {cadet.last_name}, {cadet.first_name}
                          {cadet.grade && ` (${cadet.grade})`}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>}
              </div>

              <div>
                <Label>Date *</Label>
                {isViewMode ? <div className="p-2 bg-muted rounded-md">
                    {date ? format(date, "PPP") : 'N/A'}
                  </div> : <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                    </PopoverContent>
                  </Popover>}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="event">Activity/Event *</Label>
                {isViewMode ? <div className="p-2 bg-muted rounded-md min-h-[40px]">
                    {event || 'N/A'}
                  </div> : <Input id="event" value={event} onChange={e => setEvent(e.target.value)} placeholder="e.g., Food bank volunteer, Park cleanup" required />}
              </div>

              <div>
                <Label htmlFor="hours">Hours *</Label>
                {isViewMode ? <div className="p-2 bg-muted rounded-md">
                    {hours || 'N/A'}
                  </div> : <Input id="hours" type="number" step="0.5" min="0" max="24" value={hours} onChange={e => setHours(e.target.value)} placeholder="0.0" required />}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Event Description
          </Label>
            {isViewMode ? <div className="p-2 bg-muted rounded-md min-h-[80px]">
                {notes || 'No notes'}
              </div> : <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional details about the service..." rows={3} />}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isViewMode ? 'Close' : 'Cancel'}
            </Button>
            {!isViewMode && <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Add Service' : 'Update Service'}
              </Button>}
          </div>
        </form>
      </DialogContent>
    </Dialog>;
};