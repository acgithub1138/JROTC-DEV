import { useMyScoreSheets } from '@/hooks/judges-portal/useMyScoreSheets';
import { convertToUI } from '@/utils/timezoneUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, School, Trophy } from 'lucide-react';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';

export const MyScoreSheetsWidget = () => {
  const { scoreSheets, isLoading, error } = useMyScoreSheets();
  const { timezone } = useSchoolTimezone();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Score Sheets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Score Sheets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Error loading score sheets: {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (scoreSheets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Score Sheets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No score sheets submitted yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Score Sheets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {scoreSheets.slice(0, 5).map((sheet) => (
          <div
            key={sheet.id}
            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{sheet.competition_name}</h3>
                  <p className="text-xs text-muted-foreground">{sheet.event_name}</p>
                </div>
                {sheet.total_points !== null && (
                  <div className="flex items-center gap-1 text-sm font-medium text-judge">
                    <Trophy className="h-3.5 w-3.5" />
                    {sheet.total_points}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {convertToUI(sheet.competition_start_date, timezone, 'date')}
                  </span>
                </div>
                {sheet.competition_location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>{sheet.competition_location}</span>
                  </div>
                )}
                {sheet.school_name && (
                  <div className="flex items-center gap-2">
                    <School className="h-3 w-3" />
                    <span>{sheet.school_name}</span>
                  </div>
                )}
              </div>

              {sheet.team_name && (
                <div className="text-xs">
                  <span className="font-medium">Team:</span> {sheet.team_name}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
