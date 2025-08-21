import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Printer } from 'lucide-react';
import { useCompetitionSchedule, ScheduleEvent } from '@/hooks/competition-portal/useCompetitionSchedule';
import { useCompetitionSchedulePermissions } from '@/hooks/useModuleSpecificPermissions';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { useAuth } from '@/contexts/AuthContext';
import { ScheduleEditModal } from '../modals/ScheduleEditModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
    timeline,
    isLoading,
    updateScheduleSlot,
    getAvailableSchools,
    refetch
  } = useCompetitionSchedule(competitionId);
  const {
    canManageSchedule
  } = useCompetitionSchedulePermissions();
  const { canEdit: canEditSchools } = useTablePermissions('cp_comp_schools');
  const {
    timezone
  } = useSchoolTimezone();
  const {
    userProfile
  } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('all');

  // Fetch registered schools for this competition
  const {
    data: registeredSchools,
    isLoading: isLoadingSchools
  } = useQuery({
    queryKey: ['competition-registered-schools', competitionId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('cp_comp_schools').select(`
          school_id,
          school_name
        `).eq('competition_id', competitionId);
      if (error) throw error;
      return data.map(school => ({
        id: school.school_id,
        name: school.school_name,
        initials: school.school_name?.split(' ').map(word => word[0]).join('').toUpperCase() || ''
      }));
    }
  });

  // Get unified time slots from timeline
  const getAllTimeSlots = () => {
    return timeline?.timeSlots || [];
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
    return timeline?.getAssignedSchool(eventId, timeSlot) || null;
  };
  const shouldShowSlot = (eventId: string, timeSlot: Date) => {
    // Only show slots when the event is actually active at this time
    if (!timeline?.isEventActive(eventId, timeSlot)) {
      return false;
    }

    const assignedSchool = getAssignedSchoolForSlot(eventId, timeSlot);

    // If a specific school is selected in the filter, show only that school's slots
    if (selectedSchoolFilter !== 'all') {
      return assignedSchool?.id === selectedSchoolFilter;
    }

    // Otherwise show all slots when event is active
    return true;
  };
  const getPrintScheduleData = () => {
    if (selectedSchoolFilter === 'all') {
      // Create a grid format with time as Y-axis and events as X-axis
      const timeSlots = allTimeSlots.filter(timeSlot => events.some(event => shouldShowSlot(event.id, timeSlot)));
      return {
        timeSlots: timeSlots.map(timeSlot => formatTimeForDisplay(timeSlot, TIME_FORMATS.TIME_ONLY_24H, timezone)),
        timeSlotsRaw: timeSlots,
        events: events.map(event => ({
          name: event.event_name,
          location: event.event_location || 'TBD',
          id: event.id
        }))
      };
    } else {
      // Show specific school's schedule
      const schoolSchedule: Array<{
        time: string;
        event: string;
        location: string;
      }> = [];
        allTimeSlots.forEach(timeSlot => {
          events.forEach(event => {
            // Only process if event is active at this time and it's not a lunch break
            if (timeline?.isEventActive(event.id, timeSlot) && !timeline?.isLunchBreak(event.id, timeSlot)) {
              const assignedSchool = getAssignedSchoolForSlot(event.id, timeSlot);
              if (assignedSchool?.id === selectedSchoolFilter) {
                schoolSchedule.push({
                  time: formatTimeForDisplay(timeSlot, TIME_FORMATS.TIME_ONLY_24H, timezone),
                  event: event.event_name,
                  location: event.event_location || 'TBD'
                });
              }
            }
          });
        });
      return schoolSchedule.sort((a, b) => a.time.localeCompare(b.time));
    }
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
  const filteredTimeSlots = allTimeSlots.filter(timeSlot => events.some(event => shouldShowSlot(event.id, timeSlot)));
  const printScheduleData = getPrintScheduleData();
  return <TooltipProvider>
      {/* Print-only content - separate from main UI */}
      <div className="schedule-print-container hidden print:block">
        <h2 className="text-lg font-bold mb-4 text-center">
          {selectedSchoolFilter === 'all' ? 'Competition Schedule - All Schools' : `Competition Schedule - ${registeredSchools?.find(s => s.id === selectedSchoolFilter)?.name || 'Selected School'}`}
        </h2>
          
          {selectedSchoolFilter === 'all' ?
      // Grid format for all schools: Y-axis = time, X-axis = events
      <table className="w-full border-collapse border border-black text-xs">
              <colgroup>
                <col style={{
            width: '15%'
          }} />
                {(printScheduleData as any).events?.map((_: any, index: number) => {
            const eventCount = (printScheduleData as any).events?.length || 1;
            const columnWidth = `${85 / eventCount}%`; // 15% for time column, remaining 85% distributed evenly
            return <col key={index} style={{
              width: columnWidth
            }} />;
          })}
              </colgroup>
              <thead>
                <tr>
                  <th className="border border-black p-1 text-left font-bold">Time</th>
                  {(printScheduleData as any).events?.map((event: any, index: number) => <th key={index} className="border border-black p-1 text-center font-bold text-xs">
                      <div className="font-semibold">{event.name}</div>
                      <div className="text-xs font-normal text-gray-600">({event.location})</div>
                    </th>)}
                </tr>
              </thead>
              <tbody>
                {(printScheduleData as any).timeSlotsRaw?.map((timeSlot: Date, timeIndex: number) => <tr key={timeIndex}>
                    <td className="border border-black p-1 font-medium text-xs">
                      {formatTimeForDisplay(timeSlot, TIME_FORMATS.TIME_ONLY_24H, timezone)}
                    </td>
                    {(printScheduleData as any).events?.map((event: any, eventIndex: number) => {
              // Check if event is active and if it's a lunch break
              const isEventActive = timeline?.isEventActive(event.id, timeSlot);
              const isLunchSlot = timeline?.isLunchBreak(event.id, timeSlot);
              
              if (!isEventActive) {
                return <td key={eventIndex} className="border border-black p-1 text-center text-xs bg-gray-100">
                          -
                        </td>;
              }
              
              if (isLunchSlot) {
                return <td key={eventIndex} className="border border-black p-1 text-center text-xs">
                            Lunch Break
                          </td>;
              }
              
              const assignedSchool = getAssignedSchoolForSlot(event.id, timeSlot);
              return <td key={eventIndex} className="border border-black p-1 text-center text-xs">
                          {assignedSchool?.initials || assignedSchool?.name || '-'}
                        </td>;
            })}
                  </tr>)}
              </tbody>
            </table> :
      // Individual school format with location under event
      <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr>
                  <th className="border border-black p-1 text-left font-bold">Time</th>
                  <th className="border border-black p-1 text-left font-bold">
                    <div>Event</div>
                    <div className="text-xs font-normal">(Location)</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(printScheduleData as Array<{
            time: string;
            event: string;
            location: string;
          }>).map((item, index) => <tr key={index}>
                    <td className="border border-black p-1">{item.time}</td>
                    <td className="border border-black p-1">
                      <div className="font-medium">{item.event}</div>
                      <div className="text-xs text-gray-600">({item.location})</div>
                    </td>
                  </tr>)}
              </tbody>
            </table>}
      </div>

      {/* Main UI - hidden during print */}
      <div className="space-y-4 print:hidden">
        

        {/* Filters and Print Button */}
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Label htmlFor="school-filter" className="text-sm">
              Filter by school:
            </Label>
            <Select value={selectedSchoolFilter} onValueChange={setSelectedSchoolFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All schools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All schools</SelectItem>
                {registeredSchools?.map(school => <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print Schedule
          </Button>
        </div>

        <Card className="print:hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                {/* Table Header */}
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-4 font-medium text-sm sticky left-0 bg-muted/30 z-10 min-w-[120px]">
                      Time Slots
                    </th>
                    {events.map(event => <th key={event.id} className="text-center p-4 min-w-[150px]">
                        <div className="flex items-center justify-center gap-2">
                          <div className="font-medium text-sm truncate" title={event.event_name}>
                            {event.event_name}
                          </div>
                          {!readOnly && canEditSchools && <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={() => handleEditEvent(event)} className="h-6 w-6">
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit schedule for {event.event_name}</p>
                              </TooltipContent>
                            </Tooltip>}
                        </div>
                      </th>)}
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody>
                  {filteredTimeSlots.map((timeSlot, index) => <tr key={timeSlot.toISOString()} className={`border-b print:break-inside-avoid ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <td className="p-2 font-medium text-sm sticky left-0 bg-inherit z-10 border-r">
                        {formatTimeForDisplay(timeSlot, TIME_FORMATS.TIME_ONLY_24H, timezone)}
                      </td>
                      {events.map(event => {
                    const isEventActive = timeline?.isEventActive(event.id, timeSlot);
                    const isLunchSlot = timeline?.isLunchBreak(event.id, timeSlot);
                    const assignedSchool = getAssignedSchoolForSlot(event.id, timeSlot);
                    const showSlot = shouldShowSlot(event.id, timeSlot);

                    return <td key={event.id} className="p-2 text-center">
                            {!isEventActive ? <div className="text-muted-foreground/50 text-xs">-</div> : isLunchSlot ? <div className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800 font-medium">
                                Lunch Break
                              </div> : assignedSchool && showSlot ? <div className="px-2 py-1 rounded text-xs text-white font-medium" style={{
                        backgroundColor: assignedSchool.color || 'hsl(var(--primary))'
                      }}>
                                {assignedSchool.name}
                              </div> : <div className="text-muted-foreground text-xs">-</div>}
                          </td>;
                  })}
                    </tr>)}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {selectedEvent && <ScheduleEditModal event={selectedEvent} competitionId={competitionId} isOpen={!!selectedEvent} onClose={handleModalClose} updateScheduleSlot={updateScheduleSlot} getAvailableSchools={getAvailableSchools} timeline={timeline} />}
      </div>
    </TooltipProvider>;
};