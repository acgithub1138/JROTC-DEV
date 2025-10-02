import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer } from 'lucide-react';
import { useJudgeSchedule } from '@/hooks/competition-portal/useJudgeSchedule';
import { formatTimeForDisplay, TIME_FORMATS } from '@/utils/timeDisplayUtils';
import { getSchoolDateKey } from '@/utils/timezoneUtils';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';

interface JudgeScheduleViewProps {
  competitionId: string;
}

export const JudgeScheduleView = ({ competitionId }: JudgeScheduleViewProps) => {
  const { timeline, isLoading } = useJudgeSchedule(competitionId);
  const { timezone } = useSchoolTimezone();
  const [selectedJudge, setSelectedJudge] = useState<string>('all');

  // Get unique judge names
  const judgeNames = useMemo(() => {
    if (!timeline) return [];
    const names = new Set<string>();
    timeline.timeSlots.forEach(timeSlot => {
      timeline.events.forEach(event => {
        const judge = timeline.getJudgeForSlot(event.id, timeSlot);
        if (judge) {
          names.add(judge.name);
        }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading judge schedule...</p>
        </div>
      </div>
    );
  }

  if (!timeline || timeline.events.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No judge assignments found for this competition.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Filter by Judge:</label>
          <Select value={selectedJudge} onValueChange={setSelectedJudge}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Judges" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Judges</SelectItem>
              {judgeNames.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Print Judge Schedule
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
                  {timeline.events.map(event => (
                    <th key={event.id} className="text-center p-4 min-w-[150px]">
                      <div className="font-medium text-sm truncate" title={event.name}>
                        {event.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeline.timeSlots.map((timeSlot, index) => {
                  const currentDateKey = getSchoolDateKey(timeSlot, timezone);
                  const previousDateKey = index > 0 ? getSchoolDateKey(timeline.timeSlots[index - 1], timezone) : null;
                  const isNewDay = index === 0 || currentDateKey !== previousDateKey;

                  return [
                    isNewDay && (
                      <tr key={`day-${index}`} className="bg-muted/50">
                        <td colSpan={timeline.events.length + 1} className="p-3 text-center font-semibold text-sm border-b-2 border-primary">
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
                      {timeline.events.map(event => {
                        const isEventActive = timeline.isEventActive(event.id, timeSlot);
                        const judge = timeline.getJudgeForSlot(event.id, timeSlot);

                        const showJudge = !judge || shouldShowJudge(judge.name);
                        
                        return (
                          <td key={event.id} className="p-2 text-center">
                            {!isEventActive ? (
                              <div className="text-muted-foreground/50 text-xs">-</div>
                            ) : judge && showJudge ? (
                              <div className="px-2 py-1 rounded text-xs bg-primary/10 text-primary font-medium">
                                {judge.name}
                                {judge.location && (
                                  <div className="text-[10px] text-muted-foreground mt-0.5">
                                    ({judge.location})
                                  </div>
                                )}
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
