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
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('all');

  // Fetch registered schools for this competition
  const { data: registeredSchools, isLoading: isLoadingSchools } = useQuery({
    queryKey: ['competition-registered-schools', competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cp_comp_schools')
        .select(`
          school_id,
          school_name
        `)
        .eq('competition_id', competitionId);

      if (error) throw error;
      
      return data.map(school => ({
        id: school.school_id,
        name: school.school_name
      }));
    }
  });

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
    const assignedSchool = getAssignedSchoolForSlot(eventId, timeSlot);
    
    // If a specific school is selected in the filter, show only that school's slots
    if (selectedSchoolFilter !== 'all') {
      return assignedSchool?.id === selectedSchoolFilter;
    }
    
    // Otherwise show all slots
    return true;
  };

  const getPrintScheduleData = () => {
    if (selectedSchoolFilter === 'all') {
      // Show all schools in a simple table format
      const allScheduleData: Array<{ time: string; event: string; school: string; location: string }> = [];
      
      allTimeSlots.forEach(timeSlot => {
        events.forEach(event => {
          const assignedSchool = getAssignedSchoolForSlot(event.id, timeSlot);
          if (assignedSchool) {
            allScheduleData.push({
              time: formatTimeForDisplay(timeSlot, TIME_FORMATS.TIME_ONLY_24H, timezone),
              event: event.event_name,
              school: assignedSchool.name,
              location: event.event_location || 'TBD'
            });
          }
        });
      });
      
      return allScheduleData.sort((a, b) => a.time.localeCompare(b.time));
    } else {
      // Show specific school's schedule
      const schoolSchedule: Array<{ time: string; event: string; location: string }> = [];
      
      allTimeSlots.forEach(timeSlot => {
        events.forEach(event => {
          const assignedSchool = getAssignedSchoolForSlot(event.id, timeSlot);
          if (assignedSchool?.id === selectedSchoolFilter) {
            schoolSchedule.push({
              time: formatTimeForDisplay(timeSlot, TIME_FORMATS.TIME_ONLY_24H, timezone),
              event: event.event_name,
              location: event.event_location || 'TBD'
            });
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
  const filteredTimeSlots = allTimeSlots.filter(timeSlot => 
    events.some(event => shouldShowSlot(event.id, timeSlot))
  );
  const printScheduleData = getPrintScheduleData();

  return <TooltipProvider>
      <div className="space-y-4 print:space-y-2 schedule-print-container">
        {/* Print-only table for schedule */}
        <div className="hidden print:block">
          <h2 className="text-lg font-bold mb-4 text-center">
            {selectedSchoolFilter === 'all' 
              ? 'Competition Schedule - All Schools' 
              : `Competition Schedule - ${registeredSchools?.find(s => s.id === selectedSchoolFilter)?.name || 'Selected School'}`
            }
          </h2>
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr>
                <th className="border border-black p-2 text-left font-bold">Time</th>
                <th className="border border-black p-2 text-left font-bold">Event</th>
                {selectedSchoolFilter === 'all' && <th className="border border-black p-2 text-left font-bold">School</th>}
                <th className="border border-black p-2 text-left font-bold">Location</th>
              </tr>
            </thead>
            <tbody>
              {printScheduleData.map((item, index) => (
                <tr key={index}>
                  <td className="border border-black p-2">{item.time}</td>
                  <td className="border border-black p-2">{item.event}</td>
                  {selectedSchoolFilter === 'all' && <td className="border border-black p-2">{('school' in item ? item.school : '') as string}</td>}
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
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print Schedule
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 print:hidden">
          <div className="flex items-center space-x-2">
            <Label htmlFor="school-filter" className="text-sm">
              Filter by school:
            </Label>
            <Select
              value={selectedSchoolFilter}
              onValueChange={setSelectedSchoolFilter}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All schools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All schools</SelectItem>
                {registeredSchools?.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                          {assignedSchool && showSlot ? 
                            <div className="px-2 py-1 rounded text-xs truncate text-white font-medium" style={{
                              backgroundColor: assignedSchool.color || 'hsl(var(--primary))'
                            }}>
                              {assignedSchool.name}
                            </div> : 
                            <div className="text-muted-foreground text-xs">-</div>
                          }
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