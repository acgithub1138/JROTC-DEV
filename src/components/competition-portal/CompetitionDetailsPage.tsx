import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompetitions } from '@/hooks/competition-portal/useCompetitions';
import { CompetitionEventsTab } from './tabs/CompetitionEventsTab';
import { CompetitionResourcesTab } from './tabs/CompetitionResourcesTab';
import { CompetitionSchoolsTab } from './tabs/CompetitionSchoolsTab';

export const CompetitionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { competitions, isLoading } = useCompetitions();

  const competition = competitions.find(comp => comp.id === id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Competition not found</p>
        <Button 
          variant="outline" 
          onClick={() => navigate('/app/competition-portal/competitions')}
          className="mt-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Competitions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/app/competition-portal/competitions')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{competition.name}</h1>
            <p className="text-muted-foreground">
              {new Date(competition.start_date).toLocaleDateString()} - {new Date(competition.end_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Competition Details Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="schools">Schools</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <CompetitionEventsTab competitionId={id!} />
        </TabsContent>

        <TabsContent value="resources">
          <CompetitionResourcesTab competitionId={id!} />
        </TabsContent>

        <TabsContent value="schools">
          <CompetitionSchoolsTab competitionId={id!} />
        </TabsContent>
      </Tabs>
    </div>
  );
};