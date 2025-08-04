import React from 'react';
import { useParams } from 'react-router-dom';
import { CompetitionScheduleTab } from '../tabs/CompetitionScheduleTab';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export const PortalSchedulePage = () => {
  const { competitionId } = useParams<{ competitionId: string }>();

  if (!competitionId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Competition ID not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Competition Schedule</h1>
          <p className="text-muted-foreground">
            View the event schedule for this competition
          </p>
        </div>
      </div>

      <CompetitionScheduleTab competitionId={competitionId} />
    </div>
  );
};