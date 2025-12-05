import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer } from 'lucide-react';
import { useJudgeSchedule } from '@/hooks/competition-portal/useJudgeSchedule';
import { convertToUI, getSchoolDateKey } from '@/utils/timezoneUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
interface JudgeScheduleViewProps {
  competitionId: string;
}
export const JudgeScheduleView = ({
  competitionId
}: JudgeScheduleViewProps) => {
  const {
    timeline,
    judgeAssignments,
    isLoading
  } = useJudgeSchedule(competitionId);
  const {
    timezone
  } = useSchoolTimezone();
  const [selectedJudge, setSelectedJudge] = useState<string>('all');

  // Get unique judge names
  const judgeNames = useMemo(() => {
    if (!timeline) return [];
    const names = new Set<string>();
    timeline.timeSlots.forEach(timeSlot => {
      timeline.events.forEach(event => {
        const judges = timeline.getJudgesForSlot(event.id, timeSlot);
        judges.forEach(judge => names.add(judge.name));
      });
    });
    return Array.from(names).sort();
  }, [timeline]);

  // Filter function
  const shouldShowJudge = (judgeName: string | undefined) => {
    if (selectedJudge === 'all') return true;
    return judgeName === selectedJudge;
  };
  const handlePrint = () => window.print();

  // Filter time slots based on selected judge
  const filteredTimeSlots = useMemo(() => {
    if (!timeline) return [];
    if (selectedJudge === 'all') return timeline.timeSlots;
    return timeline.timeSlots.filter(timeSlot => timeline.events.some(event => {
      const judges = timeline.getJudgesForSlot(event.id, timeSlot);
      return judges.some(judge => judge.name === selectedJudge);
    }));
  }, [timeline, selectedJudge]);

  // Get filtered judge assignments for individual print (must be before any early returns)
  const filteredJudgeAssignments = useMemo(() => {
    if (selectedJudge === 'all' || !judgeAssignments) return [];
    return judgeAssignments.filter(assignment => assignment.judge_name === selectedJudge).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [judgeAssignments, selectedJudge]);
  if (isLoading) {
    return <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading judge schedule...</p>
        </div>
      </div>;
  }
  if (!timeline || timeline.events.length === 0) {
    return <div className="text-center p-8">
        <p className="text-muted-foreground">No judge assignments found for this competition.</p>
      </div>;
  }
  return <div className="schedule-print-container space-y-4">
        {/* Print-only title */}
        <div className="print-only text-center mb-4">
          <h1 className="text-2xl font-bold">
            Competition Schedule – {selectedJudge === 'all' ? 'All Judges' : selectedJudge}
          </h1>
        </div>
        
      <div className="flex items-center gap-2 no-print w-full">
        {/* Left side - dropdown */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          
      	<label htmlFor="judge-filter" className="text-sm whitespace-nowrap">
            Filter by Judge:
          </label>
          
      	<Select value={selectedJudge} onValueChange={setSelectedJudge}>
      		<SelectTrigger className="w-40 sm:w-48">
      		<SelectValue placeholder="All Judges" />
      		</SelectTrigger>
      		<SelectContent>
      			<SelectItem value="all">All Judges</SelectItem>
      			{judgeNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
      		</SelectContent>
      	</Select>
      	
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2 whitespace-nowrap">
            <Printer className="h-4 w-4" />
            Print Judge Schedule
          </Button>
        </div>
      </div>

      {/* Grid view for screen and "All Judges" print */}
      <Card className={selectedJudge !== 'all' ? 'no-print' : ''}>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[calc(100vh-280px)] print:max-h-none print:overflow-visible">
            <table className="w-full min-w-max">
              <thead className="sticky top-0 z-20">
                <tr className="border-b bg-muted">
                  <th className="text-left p-4 font-medium text-sm sticky left-0 bg-muted border-r z-30 min-w-[120px]">
                    Time Slots
                  </th>
                  {timeline.events.map(event => {
                  // Get location from the first judge assignment for this event
                  const eventLocation = judgeAssignments?.find(a => a.event_id === event.id)?.location;
                  return <th key={event.id} className="text-center p-4 min-w-[150px] py-[8px] bg-muted">
                        <div className="font-medium text-sm truncate no-print" title={event.name}>
                          {event.name}
                        </div>
                        <div className="font-medium text-sm truncate print-only" title={event.name}>
                          {event.initials}
                        </div>
                        {eventLocation && <div className="text-[10px] text-muted-foreground font-normal mt-1">
                            {eventLocation}
                          </div>}
                      </th>;
                })}
                </tr>
              </thead>
              <tbody>
                {filteredTimeSlots.map((timeSlot, index) => {
                const currentDateKey = getSchoolDateKey(timeSlot, timezone);
                const previousDateKey = index > 0 ? getSchoolDateKey(filteredTimeSlots[index - 1], timezone) : null;
                const isNewDay = index === 0 || currentDateKey !== previousDateKey;
                return [isNewDay && <tr key={`day-${index}`} className="bg-muted/50">
                        <td colSpan={timeline.events.length + 1} className="p-3 text-center font-semibold text-sm border-b-2 border-primary">
                          {convertToUI(timeSlot, timezone, 'date')}
                        </td>
                      </tr>, <tr key={timeSlot.toISOString()} className={`border-b ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <td className="p-2 font-medium text-sm sticky left-0 z-10 border-r bg-background">
                        {convertToUI(timeSlot, timezone, 'time')}
                      </td>
                      {timeline.events.map(event => {
                    const isEventActive = timeline.isEventActive(event.id, timeSlot);
                    const judges = timeline.getJudgesForSlot(event.id, timeSlot);
                    const filteredJudges = judges.filter(judge => shouldShowJudge(judge.name));
                    return <td key={event.id} className="p-2 text-center">
                            {!isEventActive ? <div className="text-muted-foreground/50 text-xs">-</div> : filteredJudges.length > 0 ? <div className="text-xs text-foreground font-medium space-y-1">
                                {filteredJudges.map((judge, idx) => <div key={idx} className="py-[4px]">
                                    {judge.name}
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

      {/* Linear table for individual judge print */}
      {selectedJudge !== 'all' && filteredJudgeAssignments.length > 0 && <div className="print-only">
          <h2 className="text-xl font-bold mb-4">Judge Schedule – {selectedJudge}</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-primary">
                <th className="text-left p-3 font-semibold">Date</th>
                <th className="text-left p-3 font-semibold">Time Range</th>
                <th className="text-left p-3 font-semibold">Event</th>
                <th className="text-left p-3 font-semibold">Location</th>
              </tr>
            </thead>
            <tbody>
              {filteredJudgeAssignments.map((assignment, index) => <tr key={assignment.id} className={`border-b ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                  <td className="p-3">
                    {convertToUI(assignment.start_time, timezone, 'date')}
                  </td>
                  <td className="p-3">
                    {convertToUI(assignment.start_time, timezone, 'time')} - {convertToUI(assignment.end_time, timezone, 'time')}
                  </td>
                  <td className="p-3">{assignment.event_name}</td>
                  <td className="p-3">{assignment.location || '-'}</td>
                </tr>)}
            </tbody>
          </table>
        </div>}
    </div>;
};