import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer } from 'lucide-react';
import { useResourceSchedule } from '@/hooks/competition-portal/useResourceSchedule';
import { convertToUI, getSchoolDateKey } from '@/utils/timezoneUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
interface ResourceScheduleViewProps {
  competitionId: string;
}
export const ResourceScheduleView = ({
  competitionId
}: ResourceScheduleViewProps) => {
  const {
    timeline,
    resourceAssignments,
    isLoading
  } = useResourceSchedule(competitionId);
  const {
    timezone
  } = useSchoolTimezone();
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
    return timeline.timeSlots.filter(timeSlot => timeline.locations.some(location => {
      const resources = timeline.getResourcesForSlot(location, timeSlot);
      return resources.some(resource => resource.name === selectedResource);
    }));
  }, [timeline, selectedResource]);

  // Get filtered resource assignments for individual print (before early returns)
  const filteredResourceAssignments = useMemo(() => {
    if (selectedResource === 'all' || !resourceAssignments) return [];
    return resourceAssignments.filter(assignment => assignment.resource_name === selectedResource).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [resourceAssignments, selectedResource]);
  if (isLoading) {
    return <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading resource schedule...</p>
        </div>
      </div>;
  }
  if (!timeline || timeline.locations.length === 0) {
    return <div className="text-center p-8">
        <p className="text-muted-foreground">No resource assignments found for this competition.</p>
      </div>;
  }
  return <div className="schedule-print-container space-y-4">
      {/* Print-only title */}
      <div className="print-only text-center mb-4">
        <h1 className="text-2xl font-bold">
      	Competition Schedule – {selectedResource === 'all' ? 'All Schools' : selectedResource}
        </h1>
      </div>
      
      <div className="flex items-center gap-2 no-print w-full">
        {/* Left side - dropdown */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          
      	<label htmlFor="judge-filter" className="text-sm whitespace-nowrap">
            Filter by Cadet:
          </label>
          
      	<Select value={selectedResource} onValueChange={setSelectedResource}>
      		<SelectTrigger className="w-40 sm:w-48">
      		<SelectValue placeholder="All Cadets" />
      		</SelectTrigger>
      		<SelectContent>
      		  <SelectItem value="all">All Cadets</SelectItem>
      			{resourceNames.map(name => <SelectItem key={name} value={name}>{name}
      		  </SelectItem>)}
      		</SelectContent>
      	</Select>
      	
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2 whitespace-nowrap">
            <Printer className="h-4 w-4" />
            Print Resource Schedule
          </Button>
        
        </div>
      </div>

      {/* Grid view for screen and "All Cadets" print */}
      <Card className={selectedResource !== 'all' ? 'no-print' : ''}>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[calc(100vh-280px)]">
            <table className="w-full min-w-max">
              <thead className="sticky top-0 z-20">
                <tr className="border-b bg-muted">
                  <th className="text-left p-4 font-medium text-sm sticky left-0 bg-muted border-r z-30 min-w-[120px]">
                    Time Slots
                  </th>
                  {timeline.locations.map(location => <th key={location} className="text-center p-4 min-w-[150px] bg-muted">
                      <div className="font-medium text-sm truncate" title={location}>
                        {location}
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
                        <td colSpan={timeline.locations.length + 1} className="p-3 text-center font-semibold text-sm border-b-2 border-primary">
                          {convertToUI(timeSlot, timezone, 'date')}
                        </td>
                      </tr>, <tr key={timeSlot.toISOString()} className={`border-b ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <td className="p-2 font-medium text-sm sticky left-0 z-10 border-r bg-background">
                        {convertToUI(timeSlot, timezone, 'time')}
                      </td>
                      {timeline.locations.map(location => {
                    const resources = timeline.getResourcesForSlot(location, timeSlot);
                    return <td key={location} className="p-2 text-center">
                            {resources.length > 0 ? <div className="space-y-1">
                                {resources.filter(resource => shouldShowResource(resource.name)).map((resource, idx) => <div key={idx} className="px-2 py-1 rounded text-xs font-medium">
                                    {resource.name}
                                  </div>)}
                              </div> : <div className="text-muted-foreground text-xs">-</div>}
                          </td>;
                  })}
                    </tr>].filter(Boolean);
              })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Linear table for individual cadet print */}
      {selectedResource !== 'all' && filteredResourceAssignments.length > 0 && <div className="print-only">
          <h2 className="text-xl font-bold mb-4">Cadet Schedule – {selectedResource}</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-primary">
                <th className="text-left p-3 font-semibold">Date</th>
                <th className="text-left p-3 font-semibold">Time Range</th>
                <th className="text-left p-3 font-semibold">Location</th>
                <th className="text-left p-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredResourceAssignments.map((assignment, index) => <tr key={assignment.id} className={`border-b ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                  <td className="p-3">
                    {convertToUI(assignment.start_time, timezone, 'date')}
                  </td>
                  <td className="p-3">
                    {convertToUI(assignment.start_time, timezone, 'time')} - {convertToUI(assignment.end_time, timezone, 'time')}
                  </td>
                  <td className="p-3">{assignment.location}</td>
                  <td className="p-3">{assignment.assignment_details || '-'}</td>
                </tr>)}
            </tbody>
          </table>
        </div>}
    </div>;
};