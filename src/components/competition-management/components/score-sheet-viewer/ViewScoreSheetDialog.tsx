import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { EventSelector } from './EventSelector';
import { ScoreSheetTable } from './ScoreSheetTable';
import { useScoreSheetData } from './hooks/useScoreSheetData';
import type { ViewScoreSheetDialogProps } from './types';

export const ViewScoreSheetDialog: React.FC<ViewScoreSheetDialogProps> = ({
  open,
  onOpenChange,
  competition
}) => {
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);

  const { events, isLoading, refetch } = useScoreSheetData(competition, open);

  // Get unique event types from the events
  const uniqueEventTypes = [...new Set(events.map(event => event.event))];

  useEffect(() => {
    if (selectedEvent) {
      const filtered = events.filter(event => event.event === selectedEvent);
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents([]);
    }
  }, [selectedEvent, events]);

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
              onClick={refetch}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <EventSelector
            events={events}
            selectedEvent={selectedEvent}
            onEventChange={setSelectedEvent}
          />

          {selectedEvent && filteredEvents.length > 0 ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredEvents.length} score sheets for {selectedEvent}
              </div>
              
              <ScoreSheetTable events={filteredEvents} />
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