import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MultipleCadetsCommunityServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    cadetIds: string[];
    date: string;
    event: string;
    hours: number;
    notes?: string;
  }) => void;
  isSubmitting?: boolean;
}

interface CadetOption {
  id: string;
  first_name: string;
  last_name: string;
  grade: string | null;
  rank: string | null;
}

export const MultipleCadetsCommunityServiceDialog: React.FC<MultipleCadetsCommunityServiceDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false
}) => {
  const { userProfile } = useAuth();
  const [selectedCadetIds, setSelectedCadetIds] = useState<string[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [event, setEvent] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all cadets for selection
  const { data: cadets = [], isLoading: cadetsLoading } = useQuery({
    queryKey: ['cadets-for-community-service', userProfile?.school_id],
    queryFn: async () => {
      if (!userProfile?.school_id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, grade, rank')
        .eq('school_id', userProfile.school_id)
        .eq('active', true)
        .neq('role', 'instructor')
        .order('last_name');
      
      if (error) {
        console.error('Error fetching cadets:', error);
        throw error;
      }
      return data as CadetOption[];
    },
    enabled: !!userProfile?.school_id && open
  });

  // Filter cadets based on search term
  const filteredCadets = cadets.filter(cadet => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${cadet.first_name} ${cadet.last_name}`.toLowerCase();
    return fullName.includes(searchLower) || 
           cadet.grade?.toLowerCase().includes(searchLower);
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedCadetIds([]);
      setDate(new Date());
      setEvent('');
      setHours('');
      setNotes('');
      setSearchTerm('');
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || selectedCadetIds.length === 0 || !event || !hours) {
      return;
    }
    
    onSubmit({
      cadetIds: selectedCadetIds,
      date: date.toISOString().split('T')[0],
      event: event.trim(),
      hours: parseFloat(hours),
      notes: notes.trim() || undefined
    });
  };

  const handleToggleCadet = (cadetId: string) => {
    setSelectedCadetIds(prev => 
      prev.includes(cadetId) 
        ? prev.filter(id => id !== cadetId)
        : [...prev, cadetId]
    );
  };

  const handleRemoveCadet = (cadetId: string) => {
    setSelectedCadetIds(prev => prev.filter(id => id !== cadetId));
  };

  const getSelectedCadets = () => {
    return cadets.filter(cadet => selectedCadetIds.includes(cadet.id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Community Service for Multiple Cadets</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cadet Selection */}
          <div>
            <Label>Select Cadets *</Label>
            <div className="space-y-3 mt-2">
              <Input
                placeholder="Search cadets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              <ScrollArea className="h-48 border rounded-md p-2">
                {cadetsLoading ? (
                  <div className="text-center py-4 text-muted-foreground">Loading cadets...</div>
                ) : filteredCadets.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No cadets found</div>
                ) : (
                  <div className="space-y-2">
                    {filteredCadets.map(cadet => (
                      <div key={cadet.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cadet-${cadet.id}`}
                          checked={selectedCadetIds.includes(cadet.id)}
                          onCheckedChange={() => handleToggleCadet(cadet.id)}
                        />
                        <Label 
                          htmlFor={`cadet-${cadet.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          {cadet.last_name}, {cadet.first_name}
                          {cadet.grade && ` (${cadet.grade})`}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar 
                      mode="single" 
                      selected={date} 
                      onSelect={setDate} 
                      initialFocus 
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="hours">Hours *</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="0.0"
                  required
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="event">Activity/Event *</Label>
                <Input
                  id="event"
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  placeholder="e.g., Food bank volunteer, Park cleanup"
                  required
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Event Description</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details about the event..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || selectedCadetIds.length === 0}
            >
              {isSubmitting 
                ? 'Creating Records...' 
                : `Add Service for ${selectedCadetIds.length} Cadet${selectedCadetIds.length !== 1 ? 's' : ''}`
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};