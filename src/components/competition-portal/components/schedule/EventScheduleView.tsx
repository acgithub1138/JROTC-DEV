import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Printer } from 'lucide-react';
import { useCompetitionSchedule, ScheduleEvent } from '@/hooks/competition-portal/useCompetitionSchedule';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { getSchoolDateKey } from '@/utils/timezoneUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
interface EventScheduleViewProps {
  competitionId: string;
  readOnly?: boolean;
  canUpdate?: boolean;
}
export const EventScheduleView = ({
  competitionId,
  readOnly = false,
  canUpdate = false
}: EventScheduleViewProps) => {
  const navigate = useNavigate();
  const {
    events,
    timeline,
    isLoading
  } = useCompetitionSchedule(competitionId);
  const {
    timezone
  } = useSchoolTimezone();
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('all');
  const {
    data: registeredSchools
  } = useQuery({
    queryKey: ['competition-registered-schools', competitionId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('cp_comp_schools').select(`school_id, school_name, school_initials, schools(initials)`).eq('competition_id', competitionId);
      if (error) throw error;
      return data.map(school => ({
        id: school.school_id,
        name: school.school_name,
        initials: school.schools?.initials || school.school_initials || ''
      }));
    }
  });
  const getAllTimeSlots = () => timeline?.timeSlots || [];
  const handleEditEvent = (event: ScheduleEvent) => {
    const currentPath = window.location.pathname;
    navigate(`${currentPath}/schedule_record?eventId=${event.id}`);
  };
  const getAssignedSchoolForSlot = (eventId: string, timeSlot: Date) => {
    return timeline?.getAssignedSchool(eventId, timeSlot) || null;
  };
  const shouldShowSlot = (eventId: string, timeSlot: Date) => {
    if (!timeline?.isEventActive(eventId, timeSlot)) return false;
    const assignedSchool = getAssignedSchoolForSlot(eventId, timeSlot);
    if (selectedSchoolFilter !== 'all') {
      return assignedSchool?.id === selectedSchoolFilter;
    }
    return true;
  };
  const allTimeSlots = getAllTimeSlots();
  const filteredTimeSlots = allTimeSlots.filter(timeSlot => events.some(event => shouldShowSlot(event.id, timeSlot)));

  // Build linear schedule data for individual school print (before early returns)
  const linearScheduleData = useMemo(() => {
    if (selectedSchoolFilter === 'all' || !timeline) return [];
    const scheduleItems: Array<{
      date: string;
      time: string;
      eventName: string;
      location: string;
      sortKey: number;
    }> = [];
    const slots = getAllTimeSlots();
    events.forEach(event => {
      slots.forEach(timeSlot => {
        const assignedSchool = getAssignedSchoolForSlot(event.id, timeSlot);
        if (assignedSchool?.id === selectedSchoolFilter && timeline.isEventActive(event.id, timeSlot)) {
          scheduleItems.push({
            date: formatTimeForDisplay(timeSlot, TIME_FORMATS.SHORT_DATE, timezone),
            time: formatTimeForDisplay(timeSlot, TIME_FORMATS.TIME_ONLY_24H, timezone),
            eventName: event.event_name,
            location: event.event_location || '-',
            sortKey: new Date(timeSlot).getTime()
          });
        }
      });
    });
    return scheduleItems.sort((a, b) => a.sortKey - b.sortKey).filter((item, index, self) => index === self.findIndex(t => t.date === item.date && t.time === item.time && t.eventName === item.eventName));
  }, [selectedSchoolFilter, timeline, events, timezone]);
  const selectedSchoolName = useMemo(() => {
    if (selectedSchoolFilter === 'all') return '';
    return registeredSchools?.find(s => s.id === selectedSchoolFilter)?.name || '';
  }, [selectedSchoolFilter, registeredSchools]);
  const handlePrint = () => window.print();
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
  return <TooltipProvider>
      <div className="schedule-print-container space-y-4">
        {/* Print-only title */}
        <div className="print-only text-center mb-4">
          <h1 className="text-2xl font-bold">
            Competition Schedule – {selectedSchoolFilter === 'all' ? 'All Schools' : selectedSchoolName}
          </h1>
        </div>
        
        <div className="flex items-center gap-2 no-print w-full">
          {/* Left side - dropdown */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <Label htmlFor="school-filter" className="text-sm whitespace-nowrap">
              Filter by school:
            </Label>
            <Select value={selectedSchoolFilter} onValueChange={setSelectedSchoolFilter}>
              <SelectTrigger className="w-40 sm:w-48">
                <SelectValue placeholder="All schools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All schools</SelectItem>
                {registeredSchools?.map(school => <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2 whitespace-nowrap">
              <Printer className="h-4 w-4" />
              Print Schedule
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-4 font-medium text-sm sticky left-0 bg-background border-r z-10 min-w-[120px]">
                      Time
                    </th>
                    {events.map(event => <th key={event.id} className="text-center p-4 max-w-[100px] py-[4px] px-[4px]">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div className="font-medium text-sm whitespace-normal break-words w-full">
                            {event.event_name}
                          </div>
                          {!readOnly && canUpdate && <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={() => handleEditEvent(event)} className="h-6 w-6 no-print">
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
                <tbody>
                  {filteredTimeSlots.map((timeSlot, index) => {
                  const currentDateKey = getSchoolDateKey(timeSlot, timezone);
                  const previousDateKey = index > 0 ? getSchoolDateKey(filteredTimeSlots[index - 1], timezone) : null;
                  const isNewDay = index === 0 || currentDateKey !== previousDateKey;
                  return [isNewDay && <tr key={`day-${index}`} className="bg-muted/50">
                          <td colSpan={events.length + 1} className="p-3 text-center font-semibold text-sm border-b-2 border-primary">
                            {formatTimeForDisplay(timeSlot, TIME_FORMATS.FULL_DATE, timezone)}
                          </td>
                        </tr>, <tr key={timeSlot.toISOString()} className={`border-b ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                        <td className="p-2 font-medium text-sm sticky left-0 bg-background z-10 border-r">
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
                                </div> : assignedSchool && showSlot ? <>
                                  {/* Colored version for screen */}
                                  <div className="print:hidden px-2 py-1 rounded text-xs font-medium whitespace-normal break-words" style={{
                            backgroundColor: assignedSchool.color || '#3B82F6',
                            color: '#ffffff'
                          }}>
                                    {assignedSchool.name}
                                  </div>
                                  {/* Plain text version for print */}
                                  <div className="hidden print:block text-xs font-medium">
                                    {selectedSchoolFilter === 'all' ? assignedSchool.initials || assignedSchool.name : assignedSchool.name}
                                  </div>
                                </> : <div className="text-muted-foreground text-xs">-</div>}
                            </td>;
                    })}
                      </tr>].filter(Boolean);
                })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Linear table for individual school print */}
        {selectedSchoolFilter !== 'all' && linearScheduleData.length > 0 && <div className="print-only">
            <h2 className="text-xl font-bold mb-4">School Schedule – {selectedSchoolName}</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-primary">
                  <th className="text-left p-3 font-semibold">Date</th>
                  <th className="text-left p-3 font-semibold">Time</th>
                  <th className="text-left p-3 font-semibold">Event</th>
                  <th className="text-left p-3 font-semibold">Location</th>
                </tr>
              </thead>
              <tbody>
                {linearScheduleData.map((item, index) => <tr key={`${item.date}-${item.time}-${item.eventName}-${index}`} className={`border-b ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                    <td className="p-3">{item.date}</td>
                    <td className="p-3">{item.time}</td>
                    <td className="p-3">{item.eventName}</td>
                    <td className="p-3">{item.location}</td>
                  </tr>)}
              </tbody>
            </table>
          </div>}
      </div>
    </TooltipProvider>;
};