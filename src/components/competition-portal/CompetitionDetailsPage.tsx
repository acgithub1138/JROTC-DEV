import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompetitionEventsTab } from './tabs/CompetitionEventsTab';

export const CompetitionDetailsPage = () => {
  const params = useParams();
  const competitionId = params.competitionId || window.location.pathname.split('/').pop();

  console.log('Route params:', params);
  console.log('Competition ID:', competitionId);
  console.log('Current path:', window.location.pathname);

  if (!competitionId) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Invalid Competition</h1>
          <p className="text-muted-foreground">Competition ID is missing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Competition Details</h1>
          <p className="text-muted-foreground">Manage events for this competition</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Competition Events</CardTitle>
        </CardHeader>
        <CardContent>
          <CompetitionEventsTab competitionId={competitionId} />
        </CardContent>
      </Card>
    </div>
  );
};