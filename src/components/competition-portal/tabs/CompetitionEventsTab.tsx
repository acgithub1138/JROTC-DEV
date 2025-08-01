import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompetitionEvents } from '@/hooks/competition-portal/useCompetitionEvents';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { AddEventModal } from '../modals/AddEventModal';

interface CompetitionEventsTabProps {
  competitionId: string;
}

export const CompetitionEventsTab: React.FC<CompetitionEventsTabProps> = ({
  competitionId
}) => {
  const { events, isLoading, deleteEvent } = useCompetitionEvents(competitionId);
  const { canCreate, canEdit: canUpdate, canDelete } = useTablePermissions('cp_comp_events');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Competition Events</h2>
        {canCreate && (
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No events configured for this competition</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map(event => (
            <div 
              key={event.id}
              className="p-4 border rounded-lg bg-card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Event {event.event}</h3>
                  <p className="text-sm text-muted-foreground">
                    {event.location && `Location: ${event.location}`}
                    {event.start_time && ` • ${new Date(event.start_time).toLocaleString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    {event.max_participants && `Max: ${event.max_participants}`}
                  </div>
                  {(canUpdate || canDelete) && (
                    <div className="flex gap-1">
                      {canUpdate && (
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this event?')) {
                              deleteEvent(event.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {event.notes && (
                <p className="mt-2 text-sm text-muted-foreground">{event.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        competitionId={competitionId}
      />
    </div>
  );
};