import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useModuleTabs } from '@/hooks/useModuleTabs';
import { CompetitionEventsTab } from './tabs/CompetitionEventsTab';
import { CompetitionResourcesTab } from './tabs/CompetitionResourcesTab';
import { CompetitionSchoolsTab } from './tabs/CompetitionSchoolsTab';
import { CompetitionScheduleTab } from './tabs/CompetitionScheduleTab';
import { CompetitionResultsTab } from './tabs/CompetitionResultsTab';
export const CompetitionDetailsPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const competitionId = params.competitionId || window.location.pathname.split('/').pop();
  
  // Use hardcoded parent module ID for now
  const { tabs, isLoading: tabsLoading } = useModuleTabs('hosting-competitions');

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

      {tabsLoading ? (
        <div className="space-y-4">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      ) : tabs.length > 0 ? (
        <Tabs defaultValue={tabs[0]?.name} className="w-full">
          <TabsList className={`grid w-full grid-cols-${Math.min(tabs.length, 6)}`}>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.name}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.name}>
              <Card>
                <CardContent>
                  {/* Render tab content based on tab name */}
                  {tab.name === 'cp_comp_events' && <CompetitionEventsTab competitionId={competitionId} />}
                  {tab.name === 'cp_comp_resources' && <CompetitionResourcesTab competitionId={competitionId} />}
                  {tab.name === 'cp_comp_schools' && <CompetitionSchoolsTab competitionId={competitionId} />}
                  {tab.name === 'cp_schedules' && (
                    <div className="schedule-print-wrapper">
                      <CompetitionScheduleTab competitionId={competitionId} />
                    </div>
                  )}
                  {tab.name === 'cp_results' && <CompetitionResultsTab competitionId={competitionId} />}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No tabs available for this competition.</p>
        </div>
      )}
    </div>;
};