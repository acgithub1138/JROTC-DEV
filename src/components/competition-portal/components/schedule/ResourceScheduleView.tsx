import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer } from 'lucide-react';
import { useResourceSchedule } from '@/hooks/competition-portal/useResourceSchedule';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { getSchoolDateKey } from '@/utils/timezoneUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';

interface ResourceScheduleViewProps {
  competitionId: string;
}

export const ResourceScheduleView = ({ competitionId }: ResourceScheduleViewProps) => {
  const { timeline, isLoading } = useResourceSchedule(competitionId);
  const { timezone } = useSchoolTimezone();
  const [selectedResource, setSelectedResource] = useState<string>('all');

  // Get unique resource names
  const resourceNames = useMemo(() => {
    if (!timeline) return [];
    const names = new Set<string>();
    timeline.timeSlots.forEach(timeSlot => {
      timeline.locations.forEach(location => {
        const resources = timeline.getResourcesForSlot(location, timeSlot);
        resources.forEach(resource => {
          names.add(resource.name);
        });
      });
    });
    return Array.from(names).sort();
  }, [timeline]);

  // Filter function
  const shouldShowResource = (resourceName: string) => {
    if (selectedResource === 'all') return true;
    return resourceName === selectedResource;
  };

  const handlePrint = () => window.print();

  // Filter time slots based on selected resource
  const filteredTimeSlots = useMemo(() => {
    if (!timeline) return [];
    if (selectedResource === 'all') return timeline.timeSlots;
    
    return timeline.timeSlots.filter(timeSlot =>
      timeline.locations.some(location => {
        const resources = timeline.getResourcesForSlot(location, timeSlot);
        return resources.some(resource => resource.name === selectedResource);
      })
    );
  }, [timeline, selectedResource]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading resource schedule...</p>
        </div>
      </div>
    );
  }

  if (!timeline || timeline.locations.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No resource assignments found for this competition.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Filter by Cadet:</label>
          <Select value={selectedResource} onValueChange={setSelectedResource}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Cadets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cadets</SelectItem>
              {resourceNames.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print Resource Schedule
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 font-medium text-sm sticky left-0 bg-background border-r z-10 min-w-[120px]">
                    Time Slots
                  </th>
                  {timeline.locations.map(location => (
                    <th key={location} className="text-center p-4 min-w-[150px]">
                      <div className="font-medium text-sm truncate" title={location}>
                        {location}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTimeSlots.map((timeSlot, index) => {
                  const currentDateKey = getSchoolDateKey(timeSlot, timezone);
                  const previousDateKey = index > 0 ? getSchoolDateKey(filteredTimeSlots[index - 1], timezone) : null;
                  const isNewDay = index === 0 || currentDateKey !== previousDateKey;

                  return [
                    isNewDay && (
                      <tr key={`day-${index}`} className="bg-muted/50">
                        <td colSpan={timeline.locations.length + 1} className="p-3 text-center font-semibold text-sm border-b-2 border-primary">
                          {formatTimeForDisplay(timeSlot, TIME_FORMATS.FULL_DATE, timezone)}
                        </td>
                      </tr>
                    ),
                    <tr
                      key={timeSlot.toISOString()}
                      className={`border-b ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                    >
                      <td className="p-2 font-medium text-sm sticky left-0 bg-background z-10 border-r">
                        {formatTimeForDisplay(timeSlot, TIME_FORMATS.TIME_ONLY_24H, timezone)}
                      </td>
                      {timeline.locations.map(location => {
                        const resources = timeline.getResourcesForSlot(location, timeSlot);

                        return (
                          <td key={location} className="p-2 text-center">
                            {resources.length > 0 ? (
                              <div className="space-y-1">
                                {resources.filter(resource => shouldShowResource(resource.name)).map((resource, idx) => (
                                  <div key={idx} className="px-2 py-1 rounded text-xs bg-secondary/80 text-secondary-foreground font-medium">
                                    {resource.name}
                                    {resource.details && (
                                      <div className="text-[10px] text-muted-foreground mt-0.5">
                                        {resource.details}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-muted-foreground text-xs">-</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ].filter(Boolean);
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
