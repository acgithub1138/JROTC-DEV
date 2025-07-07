import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ViewScoreSheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competition: any;
}

interface CompetitionEvent {
  id: string;
  event: string;
  score_sheet: any;
  total_points: number;
  cadet_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export const ViewScoreSheetDialog: React.FC<ViewScoreSheetDialogProps> = ({
  open,
  onOpenChange,
  competition
}) => {
  const { userProfile } = useAuth();
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [filteredEvents, setFilteredEvents] = useState<CompetitionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get unique event types from the events
  const uniqueEventTypes = [...new Set(events.map(event => event.event))];

  const fetchEvents = async () => {
    if (!userProfile?.school_id || !competition?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('competition_events')
        .select(`
          id,
          event,
          score_sheet,
          total_points,
          cadet_id,
          profiles:cadet_id (
            first_name,
            last_name
          )
        `)
        .eq('competition_id', competition.id)
        .eq('school_id', userProfile.school_id);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching competition events:', error);
      toast.error('Failed to load competition events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && competition) {
      fetchEvents();
    }
  }, [open, competition, userProfile?.school_id]);

  useEffect(() => {
    if (selectedEvent) {
      const filtered = events.filter(event => event.event === selectedEvent);
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents([]);
    }
  }, [selectedEvent, events]);

  // Extract field names from score sheets
  const getFieldNames = () => {
    if (filteredEvents.length === 0) return [];
    
    const allFields = new Set<string>();
    filteredEvents.forEach(event => {
      if (event.score_sheet?.scores && typeof event.score_sheet.scores === 'object') {
        Object.keys(event.score_sheet.scores).forEach(key => allFields.add(key));
      }
    });
    
    // Sort field names logically (by field number if present)
    return Array.from(allFields).sort((a, b) => {
      const aNum = parseInt(a.match(/field_(\d+)/)?.[1] || '999');
      const bNum = parseInt(b.match(/field_(\d+)/)?.[1] || '999');
      return aNum - bNum;
    });
  };

  // Clean up field names for display
  const getCleanFieldName = (fieldName: string) => {
    // Remove field_ prefix and convert underscores to spaces
    return fieldName
      .replace(/^field_\d+_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const fieldNames = getFieldNames();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              View Score Sheets - {competition?.name}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchEvents}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium">Select Event:</label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Choose an event type..." />
              </SelectTrigger>
              <SelectContent>
                {uniqueEventTypes.map((eventType) => (
                  <SelectItem key={eventType} value={eventType}>
                    {eventType} ({events.filter(e => e.event === eventType).length} score sheets)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEvent && filteredEvents.length > 0 ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredEvents.length} score sheets for {selectedEvent}
              </div>
              
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background">Field</TableHead>
                       {filteredEvents.map((event, index) => (
                         <TableHead key={event.id} className="text-center min-w-32">
                           <div className="space-y-1">
                             <div className="font-medium">
                               {event.score_sheet?.judge_number || `Judge ${index + 1}`}
                             </div>
                             <div className="text-xs text-muted-foreground">
                               Total: {event.total_points || 0} pts
                             </div>
                           </div>
                         </TableHead>
                       ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fieldNames.map((fieldName) => (
                      <TableRow key={fieldName}>
                         <TableCell className="sticky left-0 bg-background font-medium border-r">
                           {getCleanFieldName(fieldName)}
                         </TableCell>
                         {filteredEvents.map((event) => (
                           <TableCell key={event.id} className="text-center">
                             {(() => {
                               const value = event.score_sheet?.scores?.[fieldName];
                               if (value === null || value === undefined) return '-';
                               if (typeof value === 'object') return JSON.stringify(value);
                               return String(value);
                             })()}
                           </TableCell>
                         ))}
                      </TableRow>
                    ))}
                    
                    {/* Total Points Row */}
                    <TableRow className="bg-muted/50">
                      <TableCell className="sticky left-0 bg-muted/50 font-bold border-r">
                        Total Points
                      </TableCell>
                      {filteredEvents.map((event) => (
                        <TableCell key={event.id} className="text-center font-bold">
                          {event.total_points || 0}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : selectedEvent && filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No score sheets found for {selectedEvent}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {uniqueEventTypes.length === 0 ? (
                <div>
                  <p>No events with score sheets found for this competition.</p>
                  <p className="text-sm mt-2">Add some event score sheets first.</p>
                </div>
              ) : (
                'Select an event type to view score sheets'
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};