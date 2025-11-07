import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useCompetitionEventsPermissions, useCompetitionResourcesPermissions, useCompetitionSchoolsPermissions, useCompetitionSchedulePermissions, useCompetitionResultsPermissions, useCompetitionJudgesPermissions } from '@/hooks/useModuleSpecificPermissions';
import { CompetitionDetailsSidebar } from './CompetitionDetailsSidebar';
import { CompetitionEventsTab } from './tabs/CompetitionEventsTab';
import { CompetitionResourcesTab } from './tabs/CompetitionResourcesTab';
import { CompetitionSchoolsTab } from './tabs/CompetitionSchoolsTab';
import { CompetitionResultsTab } from './tabs/CompetitionResultsTab';
import { JudgesAssignedView } from './views/JudgesAssignedView';
import { ApplicationStatusView } from './views/ApplicationStatusView';
import { ScheduleView } from './views/ScheduleView';
export const CompetitionDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  // Extract competition ID from URL path
  const getCompetitionIdFromPath = () => {
    const pathSegments = location.pathname.split('/');
    const competitionDetailsIndex = pathSegments.findIndex(segment => segment === 'competition-details');
    if (competitionDetailsIndex !== -1 && pathSegments[competitionDetailsIndex + 1]) {
      return pathSegments[competitionDetailsIndex + 1];
    }
    return params.competitionId;
  };
  
  const competitionId = getCompetitionIdFromPath();
  const currentPath = location.pathname;

  // Get permissions for each section
  const eventsPermissions = useCompetitionEventsPermissions();
  const judgesPermissions = useCompetitionJudgesPermissions();
  const resourcesPermissions = useCompetitionResourcesPermissions();
  const schoolsPermissions = useCompetitionSchoolsPermissions();
  const schedulePermissions = useCompetitionSchedulePermissions();
  const resultsPermissions = useCompetitionResultsPermissions();

  // Navigate to default view on mount if needed
  useEffect(() => {
    if (!competitionId) return;
    
    const basePath = `/app/competition-portal/competition-details/${competitionId}`;
    const pathAfterBase = currentPath.replace(basePath, '');
    
    // If we're exactly at the base path, redirect to first available section
    if (pathAfterBase === '' || pathAfterBase === '/') {
      if (eventsPermissions.canAccess) {
        navigate(`${basePath}/events`, { replace: true });
      } else if (judgesPermissions.canAccess) {
        navigate(`${basePath}/judges/assigned`, { replace: true });
      } else if (resourcesPermissions.canAccess) {
        navigate(`${basePath}/resources`, { replace: true });
      } else if (schoolsPermissions.canAccess) {
        navigate(`${basePath}/schools`, { replace: true });
      } else if (schedulePermissions.canAccess) {
        navigate(`${basePath}/schedules/schools`, { replace: true });
      } else if (resultsPermissions.canAccess) {
        navigate(`${basePath}/results`, { replace: true });
      }
    }
  }, [competitionId, currentPath, navigate]);

  // Render content based on current route
  const renderContent = () => {
    const basePath = `/app/competition-portal/competition-details/${competitionId}`;
    
    // Events
    if (currentPath === `${basePath}/events`) {
      return <CompetitionEventsTab competitionId={competitionId} />;
    }
    
    // Judges - Assigned
    if (currentPath === `${basePath}/judges/assigned`) {
      return <JudgesAssignedView competitionId={competitionId} canCreate={judgesPermissions.canCreate} canUpdate={judgesPermissions.canUpdate} canDelete={judgesPermissions.canDelete} />;
    }
    
    // Judges - Applications - Pending
    if (currentPath === `${basePath}/judges/applications/pending`) {
      return <ApplicationStatusView competitionId={competitionId} status="pending" />;
    }
    
    // Judges - Applications - Approved
    if (currentPath === `${basePath}/judges/applications/approved`) {
      return <ApplicationStatusView competitionId={competitionId} status="approved" />;
    }
    
    // Judges - Applications - Declined
    if (currentPath === `${basePath}/judges/applications/declined`) {
      return <ApplicationStatusView competitionId={competitionId} status="declined" />;
    }
    
    // Resources
    if (currentPath === `${basePath}/resources`) {
      return <CompetitionResourcesTab competitionId={competitionId} />;
    }
    
    // Schools
    if (currentPath === `${basePath}/schools`) {
      return <CompetitionSchoolsTab competitionId={competitionId} />;
    }
    
    // Schedules - Schools
    if (currentPath === `${basePath}/schedules/schools`) {
      return <ScheduleView competitionId={competitionId} type="schools" />;
    }
    
    // Schedules - Judges
    if (currentPath === `${basePath}/schedules/judges`) {
      return <ScheduleView competitionId={competitionId} type="judges" />;
    }
    
    // Schedules - Resources
    if (currentPath === `${basePath}/schedules/resources`) {
      return <ScheduleView competitionId={competitionId} type="resources" />;
    }
    
    // Results
    if (currentPath === `${basePath}/results`) {
      return <CompetitionResultsTab competitionId={competitionId} />;
    }
    
    return null;
  };
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
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <CompetitionDetailsSidebar 
        competitionId={competitionId} 
        permissions={{
          events: eventsPermissions,
          judges: judgesPermissions,
          resources: resourcesPermissions,
          schools: schoolsPermissions,
          schedule: schedulePermissions,
          results: resultsPermissions
        }}
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Competition Details</h1>
            <Button 
              variant="outline" 
              onClick={() => navigate('/app/competition-portal/competitions')} 
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Competitions
            </Button>
          </div>

          {/* Dynamic content based on route */}
          <div className="mt-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};