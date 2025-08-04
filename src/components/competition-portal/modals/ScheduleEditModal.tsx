import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompetitionSchedule, ScheduleEvent } from '@/hooks/competition-portal/useCompetitionSchedule';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
interface ScheduleEditModalProps {
  event: ScheduleEvent;
  competitionId: string;
  isOpen: boolean;
  onClose: () => void;
}
interface AvailableSchool {
  id: string;
  name: string;
}
export const ScheduleEditModal = ({
  event,
  competitionId,
  isOpen,
  onClose
}: ScheduleEditModalProps) => {
  const {
    updateScheduleSlot,
    getAvailableSchools,
    refetch
  } = useCompetitionSchedule(competitionId);
  const {
    timezone
  } = useSchoolTimezone();
  const { toast } = useToast();
  const [availableSchools, setAvailableSchools] = useState<AvailableSchool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  
  // Local state for tracking schedule changes
  const [localSchedule, setLocalSchedule] = useState<Record<string, string | null>>({});
  
  // Initialize local schedule from event data
  const initialSchedule = event.timeSlots.reduce((acc, slot) => {
    acc[slot.time.toISOString()] = slot.assignedSchool?.id || null;
    return acc;
  }, {} as Record<string, string | null>);
  
  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: initialSchedule,
    currentData: localSchedule,
    enabled: isOpen
  });
  useEffect(() => {
    if (isOpen && event) {
      loadAvailableSchools();
      setLocalSchedule(initialSchedule);
    }
  }, [isOpen, event.id]);
  const loadAvailableSchools = async () => {
    setIsLoading(true);
    try {
      const schools = await getAvailableSchools(event.id);
      setAvailableSchools(schools);
    } catch (error) {
      console.error('Error loading available schools:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleLocalScheduleChange = (timeSlot: Date, schoolId: string | null) => {
    setLocalSchedule(prev => ({
      ...prev,
      [timeSlot.toISOString()]: schoolId
    }));
  };

  const handleUpdateSchedule = async () => {
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
      for (const { timeSlotISO, schoolId } of changedSlots) {
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
      
      await loadAvailableSchools(); // Refresh available schools
      await refetch(); // Refresh main schedule data
      resetChanges();
      onClose();
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

  const handleCloseModal = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  };

  const handleDiscardChanges = () => {
    setLocalSchedule(initialSchedule);
    resetChanges();
    setShowUnsavedDialog(false);
    onClose();
  };
  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Schedule for {event.event_name}
              <div className="text-sm font-normal text-muted-foreground mt-1">
                {event.interval}-minute slots from {' '}
                {formatTimeForDisplay(event.start_time, TIME_FORMATS.TIME_ONLY_24H, timezone)} to {' '}
                {formatTimeForDisplay(event.end_time, TIME_FORMATS.TIME_ONLY_24H, timezone)}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
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
                    availableSchools.find(s => s.id === currentAssignment) || 
                    slot.assignedSchool : null;

                  return (
                    <div key={slot.time.toISOString()} className={`flex items-center gap-4 p-3 rounded-lg border ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <div className="font-mono text-sm min-w-[80px]">
                        {formatTimeForDisplay(slot.time, TIME_FORMATS.TIME_ONLY_24H, timezone)}
                      </div>

                      <div className="flex-1">
                        {assignedSchool ? (
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
                        ) : (
                          <Select 
                            value={currentAssignment || ""} 
                            onValueChange={schoolId => handleLocalScheduleChange(slot.time, schoolId)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select school..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSchools.length === 0 ? (
                                <SelectItem value="no-schools" disabled>
                                  No schools available
                                </SelectItem>
                              ) : (
                                availableSchools.map(school => (
                                  <SelectItem key={school.id} value={school.id}>
                                    {school.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleCloseModal}>
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
        </DialogContent>
      </Dialog>

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