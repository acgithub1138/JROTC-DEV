import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Plus } from 'lucide-react';
import { EventSelector } from './components/score-sheet-viewer/EventSelector';
import { ScoreSheetTable } from './components/score-sheet-viewer/ScoreSheetTable';
import { useScoreSheetData } from './components/score-sheet-viewer/hooks/useScoreSheetData';
import { useCompetitions } from './hooks/useCompetitions';
import { useCompetitionEvents } from './hooks/useCompetitionEvents';
import { AddEventDialog } from './components/AddEventDialog';
import { useTablePermissions } from '@/hooks/useTablePermissions';

export const ScoreSheetPage = () => {
  const { competitionId } = useParams<{ competitionId: string }>();
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);

  // Get competition data
  const { competitions } = useCompetitions();
  const competition = competitions.find(comp => comp.id === competitionId);
  const { canCreate } = useTablePermissions('competitions');
  
  // Debug permissions
  console.log('ScoreSheetPage permissions:', { canCreate });

  const { events, isLoading, refetch } = useScoreSheetData(competition, true);
  const { createEvent } = useCompetitionEvents(competitionId);

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

  const handleBack = () => {
    navigate('/competitions');
  };

  const handleEventCreated = async (eventData: any) => {
    try {
      await createEvent(eventData);
      setShowAddEventDialog(false);
      refetch(); // Refresh the score sheet data
    } catch (error) {
      console.error('Failed to create event:', error);
      // Keep dialog open on error so user can retry
    }
  };

  if (!competition) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Competitions
            </Button>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            Competition not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Score Sheets for {competition.name}</h1>
          <div className="flex gap-2">
            {canCreate && (
              <Button onClick={() => setShowAddEventDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Score Sheet
              </Button>
            )}
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Competitions
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <EventSelector
              events={events}
              selectedEvent={selectedEvent}
              onEventChange={setSelectedEvent}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {selectedEvent && filteredEvents.length > 0 ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Showing {filteredEvents.length} score sheets for {selectedEvent}
              </div>
              
              <ScoreSheetTable 
                events={filteredEvents} 
                onEventsRefresh={refetch}
              />
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

        {canCreate && competition && (
          <AddEventDialog 
            open={showAddEventDialog} 
            onOpenChange={setShowAddEventDialog} 
            competitionId={competition.id} 
            onEventCreated={handleEventCreated} 
          />
        )}
      </div>
    </div>
  );
};