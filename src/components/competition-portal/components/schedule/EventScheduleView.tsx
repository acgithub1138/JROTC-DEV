import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Edit, Printer, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { useCompetitionSchedule, ScheduleEvent } from '@/hooks/competition-portal/useCompetitionSchedule';
import { convertToUI, getSchoolDateKey } from '@/utils/timezoneUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface PreferredTimeRequest {
  window?: string;
  exact_time?: string;
  notes?: string;
}

interface EventScheduleViewProps {
  competitionId: string;
  readOnly?: boolean;
  canUpdate?: boolean;
}

const getWindowLabel = (window?: string) => {
  switch (window) {
    case 'morning': return 'Morning';
    case 'midday': return 'Midday';
    case 'afternoon': return 'Afternoon';
    default: return window || '-';
  }
};

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
  const [isRequestsOpen, setIsRequestsOpen] = useState(false);

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

  // Fetch time requests from the view
  const { data: timeRequests } = useQuery({
    queryKey: ['competition-time-requests', competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cp_event_time_requests' as any)
        .select('*')
        .eq('competition_id', competitionId);
      
      if (error) throw error;
      return data as unknown as Array<{
        id: string;
        competition_id: string;
        school_id: string;
        event_id: string;
        preferred_time_request: PreferredTimeRequest;
        school_name: string;
        school_initials: string;
        event_type_id: string;
        event_name: string;
        event_initials: string;
      }>;
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
            date: convertToUI(timeSlot, timezone, 'date'),
            time: convertToUI(timeSlot, timezone, 'time'),
            eventName: event.event_initials || event.event_name,
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

        {/* Event Time Requests Collapsible Section */}
        {timeRequests && timeRequests.length > 0 && (
          <Collapsible open={isRequestsOpen} onOpenChange={setIsRequestsOpen} className="no-print">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                {isRequestsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Clock className="h-4 w-4" />
                Event Time Requests
                <Badge variant="secondary" className="ml-1">{timeRequests.length}</Badge>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {timeRequests.map((request) => (
                      <div key={request.id} className="flex items-center gap-4 p-2 bg-muted/50 rounded-md border">
                        <div className="font-medium text-sm min-w-[120px]">
                          {request.school_name}
                        </div>
                        <div className="text-sm text-muted-foreground min-w-[140px]">
                          {request.event_name}
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {getWindowLabel(request.preferred_time_request?.window)}
                        </Badge>
                        {request.preferred_time_request?.exact_time && (
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {request.preferred_time_request.exact_time}
                          </div>
                        )}
                        {request.preferred_time_request?.notes && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-xs text-muted-foreground truncate max-w-[200px] cursor-help">
                                {request.preferred_time_request.notes}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[300px]">
                              <p>{request.preferred_time_request.notes}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}

        <Card>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[calc(100vh-280px)] print:max-h-none print:overflow-visible">
              <table className="w-full min-w-max">
                <thead className="sticky top-0 z-20">
                  <tr className="border-b bg-muted">
                    <th className="text-left p-4 font-medium text-sm sticky left-0 bg-muted border-r z-30 min-w-[120px]">
                      Time
                    </th>
                    {events.map(event => <th key={event.id} className="text-center p-4 min-w-[120px] py-[4px] px-[4px] bg-muted">
                        <div className="flex flex-col items-center justify-center gap-1">
                          {!readOnly && canUpdate ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleEditEvent(event)}
                                  className="font-medium text-sm whitespace-normal break-words w-full text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer no-print"
                                >
                                  {event.event_name}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Click to edit schedule</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <div className="font-medium text-sm whitespace-normal break-words w-full no-print">
                              {event.event_name}
                            </div>
                          )}
                          {/* Print version */}
                          <div className="hidden print:block font-medium text-sm whitespace-normal break-words w-full">
                            {event.event_initials || event.event_name}
                          </div>
                          {event.event_location && (
                            <div className="text-[10px] text-muted-foreground font-normal mt-1">
                              {event.event_location}
                            </div>
                          )}
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
                            {convertToUI(timeSlot, timezone, 'date')}
                          </td>
                        </tr>, <tr key={timeSlot.toISOString()} className={`border-b ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <td className="p-2 font-medium text-sm sticky left-0 z-10 border-r bg-background">
                        {convertToUI(timeSlot, timezone, 'time')}
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
                                    {assignedSchool.initials || assignedSchool.name}
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
