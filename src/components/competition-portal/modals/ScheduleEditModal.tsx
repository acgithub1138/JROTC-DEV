import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompetitionSchedule, ScheduleEvent } from '@/hooks/competition-portal/useCompetitionSchedule';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
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
  const [availableSchools, setAvailableSchools] = useState<AvailableSchool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (isOpen && event) {
      loadAvailableSchools();
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
  const handleAssignSchool = async (timeSlot: Date, schoolId: string | null) => {
    await updateScheduleSlot(event.id, timeSlot, schoolId);
    await loadAvailableSchools(); // Refresh available schools
    await refetch(); // Refresh main schedule data
  };
  const handleRemoveAssignment = async (timeSlot: Date) => {
    await updateScheduleSlot(event.id, timeSlot, null);
    await loadAvailableSchools(); // Refresh available schools
    await refetch(); // Refresh main schedule data
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
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
          {isLoading ? <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading schools...</p>
            </div> : <div className="space-y-2">
              {event.timeSlots.map((slot, index) => <div key={slot.time.toISOString()} className={`flex items-center gap-4 p-3 rounded-lg border ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                  <div className="font-mono text-sm min-w-[80px]">
                    {formatTimeForDisplay(slot.time, TIME_FORMATS.TIME_ONLY_24H, timezone)}
                  </div>

                  <div className="flex-1">
                    {slot.assignedSchool ? <div className="flex items-center gap-2">
                        <div className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm">
                          {slot.assignedSchool.name}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveAssignment(slot.time)} className="h-6 w-6 p-0">
                          <X className="h-3 w-3" />
                        </Button>
                      </div> : <Select onValueChange={schoolId => handleAssignSchool(slot.time, schoolId)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select school..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSchools.length === 0 ? <SelectItem value="no-schools" disabled>
                              No schools available
                            </SelectItem> : availableSchools.map(school => <SelectItem key={school.id} value={school.id}>
                                {school.name}
                              </SelectItem>)}
                        </SelectContent>
                      </Select>}
                  </div>
                </div>)}
            </div>}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};