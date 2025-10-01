import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompetitionEventsPermissions, useCompetitionResourcesPermissions, useCompetitionSchoolsPermissions, useCompetitionSchedulePermissions, useCompetitionResultsPermissions, useCompetitionJudgesPermissions } from '@/hooks/useModuleSpecificPermissions';
import { CompetitionEventsTab } from './tabs/CompetitionEventsTab';
import { CompetitionResourcesTab } from './tabs/CompetitionResourcesTab';
import { CompetitionSchoolsTab } from './tabs/CompetitionSchoolsTab';
import { CompetitionScheduleTab } from './tabs/CompetitionScheduleTab';
import { CompetitionResultsTab } from './tabs/CompetitionResultsTab';
import { CompetitionJudgesTab } from './tabs/CompetitionJudgesTab';
export const CompetitionDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  // Extract competition ID correctly from URL path
  const getCompetitionIdFromPath = () => {
    const pathSegments = location.pathname.split('/');
    const competitionDetailsIndex = pathSegments.findIndex(segment => segment === 'competition-details');
    if (competitionDetailsIndex !== -1 && pathSegments[competitionDetailsIndex + 1]) {
      return pathSegments[competitionDetailsIndex + 1];
    }
    return params.competitionId;
  };
  
  const competitionId = getCompetitionIdFromPath();

  // Determine active tab from URL
  const getActiveTabFromUrl = () => {
    const pathSegments = location.pathname.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    // Map URL segments to tab names
    const urlToTabMap: { [key: string]: string } = {
      'events': 'cp_comp_events',
      'judges': 'cp_comp_judges', 
      'resources': 'cp_comp_resources', 
      'schools': 'cp_comp_schools',
      'schedule': 'cp_schedules',
      'results': 'cp_results'      
    };
    
    return urlToTabMap[lastSegment] || null;
  };

  // Get permissions for each tab
  const eventsPermissions = useCompetitionEventsPermissions();
  const judgesPermissions = useCompetitionJudgesPermissions();
  const resourcesPermissions = useCompetitionResourcesPermissions();
  const schoolsPermissions = useCompetitionSchoolsPermissions();
  const schedulePermissions = useCompetitionSchedulePermissions();
  const resultsPermissions = useCompetitionResultsPermissions();

  // Define available tabs based on permissions
  const availableTabs = [{
    id: 'events',
    name: 'cp_comp_events',
    label: 'Events',
    canAccess: eventsPermissions.canAccess
  }, {
    id: 'judges',
    name: 'cp_comp_judges',
    label: 'Judges',
    canAccess: judgesPermissions.canAccess
  }, {
    id: 'resources',
    name: 'cp_comp_resources',
    label: 'Resources',
    canAccess: resourcesPermissions.canAccess
  }, {
    id: 'schools',
    name: 'cp_comp_schools',
    label: 'Schools',
    canAccess: schoolsPermissions.canAccess
  }, {
    id: 'schedule',
    name: 'cp_schedules',
    label: 'Schedule',
    canAccess: schedulePermissions.canAccess
  }, {
    id: 'results',
    name: 'cp_results',
    label: 'Results',
    canAccess: resultsPermissions.canAccess
  }].filter(tab => tab.canAccess);

  // Map URL segments to tab names - updated with judges tab
  const urlToTabMap: { [key: string]: string } = {
    'events': 'cp_comp_events',
    'judges': 'cp_comp_judges',
    'resources': 'cp_comp_resources', 
    'schools': 'cp_comp_schools',
    'schedule': 'cp_schedules',
    'results': 'cp_results'
  };

  // Get the active tab from URL, fallback to first available tab
  const activeTabFromUrl = getActiveTabFromUrl();
  const defaultTab = activeTabFromUrl && availableTabs.find(tab => tab.name === activeTabFromUrl) 
    ? activeTabFromUrl 
    : availableTabs[0]?.name;
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

      {availableTabs.length > 0 ? <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className={`grid w-full grid-cols-${Math.min(availableTabs.length, 6)}`}>
            {availableTabs.map(tab => <TabsTrigger key={tab.id} value={tab.name}>
                {tab.label}
              </TabsTrigger>)}
          </TabsList>
          
          {availableTabs.map(tab => <TabsContent key={tab.id} value={tab.name}>
              <Card>
                <CardContent className="py-[8px]">
                  {/* Render tab content based on tab name */}
                  {tab.name === 'cp_comp_events' && <CompetitionEventsTab competitionId={competitionId} />}
                  {tab.name === 'cp_comp_judges' && <CompetitionJudgesTab competitionId={competitionId} />}
                  {tab.name === 'cp_comp_resources' && <CompetitionResourcesTab competitionId={competitionId} />}
                  {tab.name === 'cp_comp_schools' && <CompetitionSchoolsTab competitionId={competitionId} />}
                  {tab.name === 'cp_schedules' && <div className="schedule-print-wrapper">
                      <CompetitionScheduleTab competitionId={competitionId} />
                    </div>}
                  {tab.name === 'cp_results' && <CompetitionResultsTab competitionId={competitionId} />}
                </CardContent>
              </Card>
            </TabsContent>)}
        </Tabs> : <div className="text-center py-8">
          <p className="text-muted-foreground">No tabs available for this competition.</p>
        </div>}
    </div>;
};