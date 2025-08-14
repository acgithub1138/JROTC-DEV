import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
        name: school.school_name,
        initials: school.school_name?.split(' ').map(word => word[0]).join('').toUpperCase() || ''
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


  const handlePrint = () => {
    navigate(`/app/print-schedule?competitionId=${competitionId}&schoolFilter=${selectedSchoolFilter}`);
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

  return <TooltipProvider>
      <div className="space-y-4">

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Competition Schedule - View and manage time slot assignments for each event
          </div>
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print Schedule
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
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

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                {/* Table Header */}
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-4 font-medium text-sm sticky left-0 bg-muted/30 z-10 min-w-[120px]">
                      Time Slots
                    </th>
                    {events.map(event => (
                      <th key={event.id} className="text-center p-4 min-w-[150px]">
                        <div className="flex items-center justify-center gap-2">
                          <div className="font-medium text-sm truncate" title={event.event_name}>
                            {event.event_name}
                          </div>
                          {!readOnly && canManageSchedule && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={() => handleEditEvent(event)} className="h-6 w-6">
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit schedule for {event.event_name}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody>
                  {filteredTimeSlots.map((timeSlot, index) => (
                    <tr 
                      key={timeSlot.toISOString()} 
                      className={`border-b ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                    >
                      <td className="p-2 font-medium text-sm sticky left-0 bg-inherit z-10 border-r">
                        {formatTimeForDisplay(timeSlot, TIME_FORMATS.TIME_ONLY_24H, timezone)}
                      </td>
                      {events.map(event => {
                        const assignedSchool = getAssignedSchoolForSlot(event.id, timeSlot);
                        const showSlot = shouldShowSlot(event.id, timeSlot);
                        
                        // Check if this time slot is a lunch break for this event
                        const eventDetails = events.find(e => e.id === event.id);
                        const isLunchSlot = eventDetails?.timeSlots.find(
                          slot => slot.time.getTime() === timeSlot.getTime()
                        )?.isLunchBreak;
                        
                        return (
                          <td key={event.id} className="p-2 text-center">
                            {isLunchSlot ? (
                              <div className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800 font-medium">
                                Lunch Break
                              </div>
                            ) : assignedSchool && showSlot ? (
                              <div 
                                className="px-2 py-1 rounded text-xs text-white font-medium" 
                                style={{ backgroundColor: assignedSchool.color || 'hsl(var(--primary))' }}
                              >
                                {assignedSchool.name}
                              </div>
                            ) : (
                              <div className="text-muted-foreground text-xs">-</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {selectedEvent && <ScheduleEditModal event={selectedEvent} competitionId={competitionId} isOpen={!!selectedEvent} onClose={handleModalClose} updateScheduleSlot={updateScheduleSlot} getAvailableSchools={getAvailableSchools} />}
      </div>
    </TooltipProvider>;
};