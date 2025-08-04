import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Edit, Printer } from 'lucide-react';
import { useCompetitionSchedule, ScheduleEvent } from '@/hooks/competition-portal/useCompetitionSchedule';
import { useCompetitionSchedulePermissions } from '@/hooks/useModuleSpecificPermissions';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { useAuth } from '@/contexts/AuthContext';
import { ScheduleEditModal } from '../modals/ScheduleEditModal';
interface CompetitionScheduleTabProps {
  competitionId: string;
  readOnly?: boolean;
}
export const CompetitionScheduleTab = ({
  competitionId,
  readOnly = false
}: CompetitionScheduleTabProps) => {
  const {
    events,
    isLoading,
    updateScheduleSlot,
    getAvailableSchools,
    refetch
  } = useCompetitionSchedule(competitionId);
  const {
    canManageSchedule
  } = useCompetitionSchedulePermissions();
  const {
    timezone
  } = useSchoolTimezone();
  const { userProfile } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [showOnlyMySchedule, setShowOnlyMySchedule] = useState(false);

  // Generate unified time slots from all events
  const getAllTimeSlots = () => {
    const timeSlots = new Set<string>();
    events.forEach(event => {
      event.timeSlots.forEach(slot => {
        timeSlots.add(slot.time.toISOString());
      });
    });
    return Array.from(timeSlots).sort().map(timeStr => new Date(timeStr));
  };
  const handleEditEvent = (event: ScheduleEvent) => {
    setSelectedEvent(event);
  };
  const handleModalClose = async () => {
    setSelectedEvent(null);
    // Small delay to ensure modal is fully closed before refetching
    setTimeout(async () => {
      await refetch();
    }, 100);
  };
  const getAssignedSchoolForSlot = (eventId: string, timeSlot: Date) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return null;
    const slot = event.timeSlots.find(s => s.time.getTime() === timeSlot.getTime());
    return slot?.assignedSchool || null;
  };

  const shouldShowSlot = (eventId: string, timeSlot: Date) => {
    if (!showOnlyMySchedule) return true;
    const assignedSchool = getAssignedSchoolForSlot(eventId, timeSlot);
    return assignedSchool?.id === userProfile?.school_id;
  };

  const getMyScheduleData = () => {
    const mySchedule: Array<{ time: string; event: string; location: string }> = [];
    
    allTimeSlots.forEach(timeSlot => {
      events.forEach(event => {
        const assignedSchool = getAssignedSchoolForSlot(event.id, timeSlot);
        if (assignedSchool?.id === userProfile?.school_id) {
          mySchedule.push({
            time: formatTimeForDisplay(timeSlot, TIME_FORMATS.TIME_ONLY_24H, timezone),
            event: event.event_name,
            location: event.event_location || 'TBD'
          });
        }
      });
    });
    
    return mySchedule.sort((a, b) => a.time.localeCompare(b.time));
  };

  const handlePrint = () => {
    window.print();
  };
  if (isLoading) {
    return <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading schedule...</p>
        </div>
      </div>;
  }
  if (!events.length) {
    return <div className="text-center p-8">
        <p className="text-muted-foreground">No events found for this competition.</p>
      </div>;
  }
  const allTimeSlots = getAllTimeSlots();
  const filteredTimeSlots = showOnlyMySchedule 
    ? allTimeSlots.filter(timeSlot => 
        events.some(event => shouldShowSlot(event.id, timeSlot))
      )
    : allTimeSlots;
  const myScheduleData = getMyScheduleData();

  return <TooltipProvider>
      <div className="space-y-4 print:space-y-2 schedule-print-container">
        {/* Print-only table for my schedule */}
        <div className="hidden print:block">
          <h2 className="text-lg font-bold mb-4 text-center">My Competition Schedule</h2>
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr>
                <th className="border border-black p-2 text-left font-bold">Time</th>
                <th className="border border-black p-2 text-left font-bold">Event</th>
                <th className="border border-black p-2 text-left font-bold">Location</th>
              </tr>
            </thead>
            <tbody>
              {myScheduleData.map((item, index) => (
                <tr key={index}>
                  <td className="border border-black p-2">{item.time}</td>
                  <td className="border border-black p-2">{item.event}</td>
                  <td className="border border-black p-2">{item.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between print:hidden">
          <div className="text-sm text-muted-foreground">
            Competition Schedule - View and manage time slot assignments for each event
          </div>
        </div>

        <Card className="print:hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Header */}
                <div className="grid gap-2 p-4 border-b bg-muted/30" style={{
                gridTemplateColumns: `120px repeat(${events.length}, 1fr)`
              }}>
                  <div className="font-medium text-sm">Time Slots</div>
                  {events.map(event => <div key={event.id} className="flex items-center justify-center gap-2">
                      <div className="font-medium text-sm truncate" title={event.event_name}>
                        {event.event_name}
                      </div>
                      {!readOnly && canManageSchedule && <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => handleEditEvent(event)} className="h-6 w-6">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit schedule for {event.event_name}</p>
                          </TooltipContent>
                        </Tooltip>}
                    </div>)}
                </div>

                {/* Time Slots Grid */}
                 <div className="max-h-96 overflow-y-auto print:max-h-none print:overflow-visible">
                   {filteredTimeSlots.map((timeSlot, index) => <div key={timeSlot.toISOString()} className={`grid gap-2 p-2 border-b print:break-inside-avoid ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`} style={{
                  gridTemplateColumns: `120px repeat(${events.length}, 1fr)`
                }}>
                      <div className="text-sm font-medium ">
                        {formatTimeForDisplay(timeSlot, TIME_FORMATS.TIME_ONLY_24H, timezone)}
                      </div>
                      {events.map(event => {
                    const assignedSchool = getAssignedSchoolForSlot(event.id, timeSlot);
                    const showSlot = shouldShowSlot(event.id, timeSlot);
                    
                    return <div key={event.id} className="text-sm min-w-0">
                            {assignedSchool && (!showOnlyMySchedule || showSlot) ? <div className="px-2 py-1 rounded text-xs truncate text-white font-medium" style={{
                        backgroundColor: assignedSchool.color || 'hsl(var(--primary))'
                      }}>
                                {assignedSchool.name}
                              </div> : <div className="text-muted-foreground text-xs">-</div>}
                          </div>;
                  })}
                    </div>)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedEvent && <ScheduleEditModal event={selectedEvent} competitionId={competitionId} isOpen={!!selectedEvent} onClose={handleModalClose} updateScheduleSlot={updateScheduleSlot} getAvailableSchools={getAvailableSchools} />}
      </div>
    </TooltipProvider>;
};