import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Clock, X } from 'lucide-react';
import { useCompetitionSchedule } from '@/hooks/competition-portal/useCompetitionSchedule';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AvailableSchool {
  id: string;
  name: string;
}

export const MobileScheduleEdit: React.FC = () => {
  const navigate = useNavigate();
  const { competitionId, eventId } = useParams<{
    competitionId: string;
    eventId: string;
  }>();
  const { timezone } = useSchoolTimezone();
  const { toast } = useToast();
  const { events, updateScheduleSlot } = useCompetitionSchedule(competitionId);
  
  const [registeredSchools, setRegisteredSchools] = useState<AvailableSchool[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<AvailableSchool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  
  // Local state for tracking schedule changes
  const [localSchedule, setLocalSchedule] = useState<Record<string, string | null>>({});
  
  // Find the current event
  const event = events.find(e => e.id === eventId);
  
  // Initialize local schedule from event data
  const initialSchedule = event ? event.timeSlots.reduce((acc, slot) => {
    acc[slot.time.toISOString()] = slot.assignedSchool?.id || null;
    return acc;
  }, {} as Record<string, string | null>) : {};
  
  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: initialSchedule,
    currentData: localSchedule,
    enabled: !!event
  });

  useEffect(() => {
    if (event && eventId) {
      loadAvailableSchools();
      setLocalSchedule(initialSchedule);
    }
  }, [event?.id, eventId]);

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
    if (!eventId || !competitionId) return;
    
    setIsLoading(true);
    try {
      const { data: registrations, error: regError } = await supabase
        .from('cp_event_registrations')
        .select('school_id, status')
        .eq('event_id', eventId);

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
      navigate(`/mobile/competition-portal/manage/${competitionId}/schedule`);
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
      navigate(`/mobile/competition-portal/manage/${competitionId}/schedule`);
    }
  };

  const handleDiscardChanges = () => {
    setLocalSchedule(initialSchedule);
    resetChanges();
    setShowUnsavedDialog(false);
    navigate(`/mobile/competition-portal/manage/${competitionId}/schedule`);
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

  if (!event) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center mb-4">
          <button onClick={handleBack} className="mr-3 p-1 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Event Not Found</h1>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">The requested event could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center mb-4">
          <button onClick={handleBack} className="mr-3 p-1 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Edit Schedule</h1>
            <p className="text-sm text-muted-foreground">{event.event_name}</p>
          </div>
        </div>

        {/* Event Info */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-foreground">{event.event_name}</h3>
              <div className="text-sm text-muted-foreground">
                {event.interval}-minute slots from{' '}
                {formatTimeForDisplay(event.start_time, TIME_FORMATS.TIME_ONLY_24H, timezone)} to{' '}
                {formatTimeForDisplay(event.end_time, TIME_FORMATS.TIME_ONLY_24H, timezone)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Slots */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            {isLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading schools...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {event.timeSlots.map((slot, index) => {
                  const currentAssignment = localSchedule[slot.time.toISOString()];
                  const assignedSchool = currentAssignment ? 
                    registeredSchools.find(s => s.id === currentAssignment) || 
                    slot.assignedSchool : null;

                  return (
                    <div key={slot.time.toISOString()} className={`flex items-center gap-3 p-3 rounded-lg border ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <div className="font-mono text-sm min-w-[60px]">
                        {formatTimeForDisplay(slot.time, TIME_FORMATS.TIME_ONLY_24H, timezone)}
                      </div>

                      <div className="flex-1">
                        {slot.isLunchBreak ? (
                          <div className="px-3 py-2 rounded-md text-sm bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 font-medium text-center border border-orange-200 dark:border-orange-800">
                            Lunch Break
                          </div>
                        ) : assignedSchool ? (
                          <div className="flex items-center gap-2">
                            <div className="bg-primary/10 text-primary px-3 py-2 rounded-md text-sm flex-1 text-center">
                              {assignedSchool.name}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleLocalScheduleChange(slot.time, null)} 
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Select 
                            value={currentAssignment || ""} 
                            onValueChange={schoolId => handleLocalScheduleChange(slot.time, schoolId)}
                          >
                            <SelectTrigger className="w-full">
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
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={handleBack} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateSchedule} 
            disabled={!hasUnsavedChanges || isSaving}
            className="flex-1 bg-primary text-primary-foreground"
          >
            {isSaving ? 'Updating...' : 'Update Schedule'}
          </Button>
        </div>
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