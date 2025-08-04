import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { useCompetitionSchedule, ScheduleEvent } from '@/hooks/competition-portal/useCompetitionSchedule';
import { useCompetitionSchedulePermissions } from '@/hooks/useModuleSpecificPermissions';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { ScheduleEditModal } from '../modals/ScheduleEditModal';

interface CompetitionScheduleTabProps {
  competitionId: string;
}

export const CompetitionScheduleTab = ({ competitionId }: CompetitionScheduleTabProps) => {
  const { events, isLoading, updateScheduleSlot, getAvailableSchools, refetch } = useCompetitionSchedule(competitionId);
  const { canManageSchedule } = useCompetitionSchedulePermissions();
  const { timezone } = useSchoolTimezone();
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

  // Generate unified time slots from all events
  const getAllTimeSlots = () => {
    const timeSlots = new Set<string>();
    
    events.forEach(event => {
      event.timeSlots.forEach(slot => {
        timeSlots.add(slot.time.toISOString());
      });
    });

    return Array.from(timeSlots)
      .sort()
      .map(timeStr => new Date(timeStr));
  };

  const handleEditEvent = (event: ScheduleEvent) => {
    setSelectedEvent(event);
  };

  const getAssignedSchoolForSlot = (eventId: string, timeSlot: Date) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return null;

    const slot = event.timeSlots.find(
      s => s.time.getTime() === timeSlot.getTime()
    );
    
    return slot?.assignedSchool || null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No events found for this competition.</p>
      </div>
    );
  }

  const allTimeSlots = getAllTimeSlots();

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Competition Schedule - View and manage time slot assignments for each event
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header */}
              <div className="grid gap-2 p-4 border-b bg-muted/30" style={{
                gridTemplateColumns: `120px repeat(${events.length}, 1fr)`
              }}>
                <div className="font-medium text-sm">Time Slots</div>
                {events.map(event => (
                  <div key={event.id} className="flex items-center justify-center gap-2">
                    <div className="font-medium text-sm truncate" title={event.event_name}>
                      {event.event_name}
                    </div>
                    {canManageSchedule && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditEvent(event)}
                        className="h-6 w-6"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}                    
                  </div>
                ))}
              </div>

              {/* Time Slots Grid */}
              <div className="max-h-96 overflow-y-auto">
                {allTimeSlots.map((timeSlot, index) => (
                  <div 
                    key={timeSlot.toISOString()}
                    className={`grid gap-2 p-2 border-b ${
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                    }`}
                    style={{
                      gridTemplateColumns: `120px repeat(${events.length}, 1fr)`
                    }}
                  >
                    <div className="text-sm font-mono">
                      {formatTimeForDisplay(timeSlot, TIME_FORMATS.TIME_ONLY_24H, timezone)}
                    </div>
                    {events.map(event => {
                      const assignedSchool = getAssignedSchoolForSlot(event.id, timeSlot);
                      
                      return (
                        <div key={event.id} className="text-sm min-w-0">
                          {assignedSchool ? (
                            <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs truncate">
                              {assignedSchool.name}
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-xs">-</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedEvent && (
        <ScheduleEditModal
          event={selectedEvent}
          competitionId={competitionId}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          updateScheduleSlot={updateScheduleSlot}
          getAvailableSchools={getAvailableSchools}
          refetch={refetch}
        />
      )}
    </div>
  );
};