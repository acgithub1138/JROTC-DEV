import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompetitionEvents } from '@/hooks/competition-portal/useCompetitionEvents';
import { useTablePermissions } from '@/hooks/useTablePermissions';

interface CompetitionEventsTabProps {
  competitionId: string;
}

export const CompetitionEventsTab: React.FC<CompetitionEventsTabProps> = ({
  competitionId
}) => {
  const { events, isLoading } = useCompetitionEvents(competitionId);
  const { canCreate } = useTablePermissions('cp_events');

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
          <Button>
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
                <div className="text-sm text-muted-foreground">
                  {event.max_participants && `Max: ${event.max_participants}`}
                </div>
              </div>
              {event.notes && (
                <p className="mt-2 text-sm text-muted-foreground">{event.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};