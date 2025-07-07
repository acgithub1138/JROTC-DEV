import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BasicCompetitionTable } from '../components/BasicCompetitionTable';
import { CompetitionDialog } from '../components/CompetitionDialog';
import { AddEventDialog } from '../components/AddEventDialog';
import { EventsList } from '../components/EventsList';
import { ViewScoreSheetDialog } from '../components/ViewScoreSheetDialog';
import { useCompetitions } from '../hooks/useCompetitions';
import { useCompetitionEvents } from '../hooks/useCompetitionEvents';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Database } from '@/integrations/supabase/types';

type Competition = Database['public']['Tables']['competitions']['Row'];

export const CompetitionsTab = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [showViewScoreSheetDialog, setShowViewScoreSheetDialog] = useState(false);
  const [viewingCompetition, setViewingCompetition] = useState<Competition | null>(null);
  
  const {
    competitions,
    isLoading,
    createCompetition,
    updateCompetition,
    deleteCompetition
  } = useCompetitions();

  const {
    events,
    isLoading: eventsLoading,
    createEvent,
    deleteEvent
  } = useCompetitionEvents(selectedCompetition?.id);

  const handleSubmit = async (data: any) => {
    if (editingCompetition) {
      await updateCompetition(editingCompetition.id, data);
      setEditingCompetition(null);
    } else {
      await createCompetition(data);
      setShowAddDialog(false);
    }
  };

  const handleAddEvent = (competition: Competition) => {
    setSelectedCompetition(competition);
    setShowAddEventDialog(true);
  };

  const handleEventCreated = async (eventData: any) => {
    await createEvent(eventData);
  };

  const handleViewScoreSheets = (competition: Competition) => {
    setViewingCompetition(competition);
    setShowViewScoreSheetDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Competitions</h2>
          <p className="text-muted-foreground">
            Manage your competition entries and results
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Competition
        </Button>
      </div>

      <Tabs defaultValue="competitions" className="w-full">
        <TabsList>
          <TabsTrigger value="competitions">Competitions</TabsTrigger>
          {selectedCompetition && (
            <TabsTrigger value="events">
              {selectedCompetition.name} - Events
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="competitions" className="space-y-4">
          <BasicCompetitionTable
            competitions={competitions}
            isLoading={isLoading}
            onEdit={setEditingCompetition}
            onDelete={deleteCompetition}
            onAddEvent={handleAddEvent}
            onViewScoreSheets={handleViewScoreSheets}
          />
        </TabsContent>

        {selectedCompetition && (
          <TabsContent value="events" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">{selectedCompetition.name} - Events</h3>
                <p className="text-muted-foreground">
                  Competition held on {new Date(selectedCompetition.competition_date).toLocaleDateString()}
                </p>
              </div>
              <Button onClick={() => setShowAddEventDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </div>
            
            <EventsList
              events={events}
              isLoading={eventsLoading}
              onDeleteEvent={deleteEvent}
            />
          </TabsContent>
        )}
      </Tabs>

      <CompetitionDialog
        open={showAddDialog || !!editingCompetition}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingCompetition(null);
          }
        }}
        competition={editingCompetition as any}
        onSubmit={handleSubmit}
      />

      {selectedCompetition && (
        <AddEventDialog
          open={showAddEventDialog}
          onOpenChange={setShowAddEventDialog}
          competitionId={selectedCompetition.id}
          onEventCreated={handleEventCreated}
        />
      )}

      <ViewScoreSheetDialog
        open={showViewScoreSheetDialog}
        onOpenChange={setShowViewScoreSheetDialog}
        competition={viewingCompetition}
      />
    </div>
  );
};