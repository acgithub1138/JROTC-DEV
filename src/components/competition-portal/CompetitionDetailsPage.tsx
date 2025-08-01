import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompetitionEventsTab } from './tabs/CompetitionEventsTab';
import { CompetitionResourcesTab } from './tabs/CompetitionResourcesTab';
import { CompetitionSchoolsTab } from './tabs/CompetitionSchoolsTab';
export const CompetitionDetailsPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const competitionId = params.competitionId || window.location.pathname.split('/').pop();
  console.log('Route params:', params);
  console.log('Competition ID:', competitionId);
  console.log('Current path:', window.location.pathname);
  if (!competitionId) {
    return <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Invalid Competition</h1>
          <p className="text-muted-foreground">Competition ID is missing</p>
        </div>
      </div>;
  }
  return <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Competition Details</h1>
          
        </div>
        <Button variant="outline" onClick={() => navigate('/app/competition-portal/competitions')} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Competitions
        </Button>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="schools">Schools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="events">
          <Card>
            
            <CardContent>
              <CompetitionEventsTab competitionId={competitionId} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources">
          <Card>
            
            <CardContent>
              <CompetitionResourcesTab competitionId={competitionId} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="schools">
          <Card>
            
            <CardContent>
              <CompetitionSchoolsTab competitionId={competitionId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>;
};