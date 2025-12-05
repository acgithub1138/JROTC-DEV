import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, X, Lock } from 'lucide-react';
import { useCompetitionSchedule } from '@/hooks/competition-portal/useCompetitionSchedule';
import { convertToUI } from '@/utils/timezoneUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePortal } from '@/contexts/PortalContext';

interface AvailableSchool {
  id: string;
  name: string;
}

export const ScheduleEditRecord = () => {
  const { '*': splat } = useParams();
  const navigate = useNavigate();
  const { timezone } = useSchoolTimezone();
  const { toast } = useToast();
  const { hasMinimumTier } = usePortal();
  
  // Check if user has analytics tier or above (required for time slot selection)
  const canSelectTimeSlot = hasMinimumTier('analytics');

  // Extract competitionId and eventId from the route
  const competitionId = splat?.split('/')[2]; // competition-details/{competitionId}/schedule_record
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('eventId');

  const {
    events,
    timeline,
    updateScheduleSlot,
    refetch
  } = useCompetitionSchedule(competitionId);

  const [registeredSchools, setRegisteredSchools] = useState<AvailableSchool[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<AvailableSchool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Local state for tracking schedule changes
  const [localSchedule, setLocalSchedule] = useState<Record<string, string | null>>({});

  // Find the current event
  const event = events.find(e => e.id === eventId);

  // Generate event-specific time slots from timeline
  const getEventTimeSlots = () => {
    if (!timeline || !event) return [];
    return timeline.timeSlots.filter((timeSlot: Date) => 
      timeline.isEventActive(event.id, timeSlot)
    ).map((timeSlot: Date) => ({
      time: timeSlot,
      isLunchBreak: timeline.isLunchBreak(event.id, timeSlot),
      assignedSchool: timeline.getAssignedSchool(event.id, timeSlot)
    }));
  };

  const eventTimeSlots = getEventTimeSlots();
  
  // Initialize local schedule from event-specific time slots
  const initialSchedule = eventTimeSlots.reduce((acc, slot) => {
    acc[slot.time.toISOString()] = slot.assignedSchool?.id || null;
    return acc;
  }, {} as Record<string, string | null>);
  
  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: initialSchedule,
    currentData: localSchedule,
    enabled: true
  });

  useEffect(() => {
    if (event && competitionId) {
      loadAvailableSchools();
      setLocalSchedule(initialSchedule);
    }
  }, [event?.id, competitionId]);

  // Update filtered schools when localSchedule changes
  useEffect(() => {
    if (registeredSchools.length > 0) {
      updateFilteredSchools();
    }
  }, [localSchedule, registeredSchools]);

  const updateFilteredSchools = () => {
    // Get all currently assigned school IDs from localSchedule
    const assignedSchoolIds = new Set(
      Object.values(localSchedule).filter(schoolId => schoolId !== null)
    );
    
    // Filter out assigned schools from all registered schools
    const available = registeredSchools.filter(school => 
      !assignedSchoolIds.has(school.id)
    );
    
    setFilteredSchools(available);
  };

  const loadAvailableSchools = async () => {
    if (!event?.id || !competitionId) return;
    
    setIsLoading(true);
    try {
      const { data: registrations, error: regError } = await supabase
        .from('cp_event_registrations')
        .select('school_id, status')
        .eq('event_id', event.id);

      if (regError) throw regError;

      const schoolIds = Array.from(new Set((registrations || [])
        .filter((r: any) => r.status === 'registered')
        .map((r: any) => r.school_id)
        .filter((id: string | null) => !!id))) as string[];

      if (schoolIds.length === 0) {
        setRegisteredSchools([]);
        setFilteredSchools([]);
        return;
      }

      const { data: compSchools, error: csError } = await supabase
        .from('cp_comp_schools')
        .select('school_id, school_name')
        .eq('competition_id', competitionId)
        .in('school_id', schoolIds);

      if (csError) throw csError;

      const schools: AvailableSchool[] = (compSchools || []).map((s: any) => ({
        id: s.school_id,
        name: s.school_name || 'School'
      }));

      // Fill missing names for any ids not in cp_comp_schools
      const foundIds = new Set(schools.map(s => s.id));
      for (const id of schoolIds) {
        if (!foundIds.has(id)) {
          schools.push({ id, name: 'School' });
        }
      }

      // Sort A-Z
      schools.sort((a, b) => a.name.localeCompare(b.name));

      setRegisteredSchools(schools);
    } catch (error) {
      console.error('Error loading available schools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocalScheduleChange = (timeSlot: Date, schoolId: string | null) => {
    const timeSlotISO = timeSlot.toISOString();
    
    setLocalSchedule(prev => ({
      ...prev,
      [timeSlotISO]: schoolId
    }));
  };

  const handleUpdateSchedule = async () => {
    if (!event) return;
    
    setIsSaving(true);
    try {
      // Find only the changed slots
      const changedSlots = [];
      for (const [timeSlotISO, schoolId] of Object.entries(localSchedule)) {
        if (initialSchedule[timeSlotISO] !== schoolId) {
          changedSlots.push({ timeSlotISO, schoolId });
        }
      }

      // Process only changed slots
      // Apply removals first to avoid unique constraint conflicts, then additions/moves
      const removals = changedSlots.filter(slot => slot.schoolId === null);
      const additions = changedSlots.filter(slot => slot.schoolId !== null);

      for (const { timeSlotISO } of removals) {
        const timeSlot = new Date(timeSlotISO);
        await updateScheduleSlot(event.id, timeSlot, null);
      }
      for (const { timeSlotISO, schoolId } of additions) {
        const timeSlot = new Date(timeSlotISO);
        await updateScheduleSlot(event.id, timeSlot, schoolId);
      }
      
      // Show summary notification
      if (changedSlots.length > 0) {
        const addedCount = changedSlots.filter(slot => slot.schoolId !== null).length;
        const removedCount = changedSlots.filter(slot => slot.schoolId === null).length;
        
        let message = '';
        if (addedCount > 0 && removedCount > 0) {
          message = `Schedule updated: ${addedCount} assignment(s) added, ${removedCount} removed`;
        } else if (addedCount > 0) {
          message = `Schedule updated: ${addedCount} school(s) assigned`;
        } else if (removedCount > 0) {
          message = `Schedule updated: ${removedCount} assignment(s) removed`;
        }
        
        toast({
          title: "Success",
          description: message,
        });
      }
      
      resetChanges();
      await refetch();
      navigate(`/app/competition-portal/competition-details/${competitionId}/schedule`); // Go back to schedule tab
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: "Error",
        description: "Failed to update schedule. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate(`/app/competition-portal/competition-details/${competitionId}/schedule`);
    }
  };

  const handleDiscardChanges = () => {
    setLocalSchedule(initialSchedule);
    resetChanges();
    setShowUnsavedDialog(false);
    navigate(`/app/competition-portal/competition-details/${competitionId}/schedule`);
  };

  // Get available schools for a specific time slot
  const getAvailableSchoolsForSlot = (timeSlot: Date) => {
    const timeSlotISO = timeSlot.toISOString();
    const currentAssignment = localSchedule[timeSlotISO];
    
    // Start with filtered schools (schools not assigned to any slot)
    const schoolsForSlot = [...filteredSchools];
    
    // Add the currently assigned school for this slot (if any) so it can be deselected
    if (currentAssignment) {
      const assignedSchool = registeredSchools.find(school => school.id === currentAssignment);
      if (assignedSchool && !schoolsForSlot.find(s => s.id === assignedSchool.id)) {
        schoolsForSlot.push(assignedSchool);
      }
    }
    
    return schoolsForSlot;
  };

  // Show loading while fetching event data
  if (!event || !competitionId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading event data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
              Back to Schedule
            </Button>
            <h1 className="text-2xl font-bold">Edit Schedule</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleBack}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateSchedule} 
              disabled={!hasUnsavedChanges || isSaving}
            >
              {isSaving ? 'Updating...' : 'Update Schedule'}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              Schedule for {event.event_name}
              <div className="text-sm font-normal text-muted-foreground mt-1">
                {event.interval}-minute slots from {' '}
                {convertToUI(event.start_time, timezone, 'time')} to {' '}
                {convertToUI(event.end_time, timezone, 'time')}
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="text-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading schools...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {eventTimeSlots.map((slot, index) => {
                  const currentAssignment = localSchedule[slot.time.toISOString()];
                  const assignedSchool = currentAssignment ? 
                    registeredSchools.find(s => s.id === currentAssignment) || 
                    slot.assignedSchool : null;

                  return (
                    <div key={slot.time.toISOString()} className={`flex w-1/2 py-[4px] items-center gap-4 p-3 rounded-lg border ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <div className="font-mono text-sm min-w-[80px]">
                        {convertToUI(slot.time, timezone, 'time')}
                      </div>

                      <div className="flex-1">
                        {slot.isLunchBreak ? (
                          <div className="px-3 py-1 rounded-md text-sm bg-orange-100 text-orange-800 font-medium text-center">
                            Lunch Break
                          </div>
                        ) : assignedSchool ? (
                          <div className="flex items-center gap-2">
                            <div className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm">
                              {assignedSchool.name}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleLocalScheduleChange(slot.time, null)} 
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : canSelectTimeSlot ? (
                          <Select 
                            value={currentAssignment || ""} 
                            onValueChange={schoolId => handleLocalScheduleChange(slot.time, schoolId)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select school..." />
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                const slotsAvailableSchools = getAvailableSchoolsForSlot(slot.time);
                                return slotsAvailableSchools.length === 0 ? (
                                  <SelectItem value="no-schools" disabled>
                                    No schools available
                                  </SelectItem>
                                ) : (
                                  slotsAvailableSchools.map(school => (
                                    <SelectItem key={school.id} value={school.id}>
                                      {school.name}
                                    </SelectItem>
                                  ))
                                );
                              })()}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Lock className="h-4 w-4" />
                            <span>Subscription required to select time</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={() => setShowUnsavedDialog(false)}
        title="Unsaved Schedule Changes"
        description="You have unsaved changes to the schedule. Are you sure you want to discard them?"
      />
    </>
  );
};