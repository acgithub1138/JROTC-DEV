import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useCompetitionEventsPermissions, useCompetitionResourcesPermissions, useCompetitionSchoolsPermissions, useCompetitionSchedulePermissions, useCompetitionResultsPermissions, useCompetitionJudgesPermissions } from '@/hooks/useModuleSpecificPermissions';
import { CompetitionDetailsSidebar } from './CompetitionDetailsSidebar';
import { CompetitionDetailsTabs } from './CompetitionDetailsTabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { CompetitionEventsTab } from './tabs/CompetitionEventsTab';
import { CompetitionResourcesTab } from './tabs/CompetitionResourcesTab';
import { CompetitionSchoolsTab } from './tabs/CompetitionSchoolsTab';
import { CompetitionResultsTab } from './tabs/CompetitionResultsTab';
import { JudgesAssignedView } from './views/JudgesAssignedView';
import { ApplicationStatusView } from './views/ApplicationStatusView';
import { ScheduleView } from './views/ScheduleView';
import { JudgesSubTabs } from './JudgesSubTabs';
import { SchedulesSubTabs } from './SchedulesSubTabs';

export const CompetitionDetailsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const isMobile = useIsMobile();
  
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
    
    // Redirect /judges to /judges/assigned
    if (pathAfterBase === '/judges' && judgesPermissions.canAccess) {
      navigate(`${basePath}/judges/assigned`, { replace: true });
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
      return (
        <div className="schedule-print-wrapper">
          <ScheduleView competitionId={competitionId} type="schools" />
        </div>
      );
    }
    
    // Schedules - Judges
    if (currentPath === `${basePath}/schedules/judges`) {
      return (
        <div className="schedule-print-wrapper">
          <ScheduleView competitionId={competitionId} type="judges" />
        </div>
      );
    }
    
    // Schedules - Resources
    if (currentPath === `${basePath}/schedules/resources`) {
      return (
        <div className="schedule-print-wrapper">
          <ScheduleView competitionId={competitionId} type="resources" />
        </div>
      );
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

  const competitionPermissions = {
    events: eventsPermissions,
    judges: judgesPermissions,
    resources: resourcesPermissions,
    schools: schoolsPermissions,
    schedule: schedulePermissions,
    results: resultsPermissions
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full">
      {/* Mobile Sidebar */}
      {isMobile && (
        <CompetitionDetailsSidebar 
          competitionId={competitionId} 
          permissions={competitionPermissions}
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
        />
      )}
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Mobile Menu Button */}
        {isMobile && (
          <div className="sticky top-0 z-10 bg-background border-b p-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4 mr-2" />
              Menu
            </Button>
          </div>
        )}
        
        {/* Desktop/Tablet Tabs */}
        {!isMobile && (
          <div className="sticky top-0 z-10 bg-background border-b">
            <CompetitionDetailsTabs 
              competitionId={competitionId} 
              permissions={competitionPermissions}
            />
          </div>
        )}
        
        <div className="p-6 space-y-6">
          {/* Judges Sub-Tabs (desktop only) */}
          {!isMobile && currentPath.includes('/judges') && !currentPath.includes('/schedules') && (
            <JudgesSubTabs competitionId={competitionId} />
          )}
          
          {/* Schedules Sub-Tabs (desktop only) */}
          {!isMobile && currentPath.includes('/schedules') && (
            <SchedulesSubTabs competitionId={competitionId} />
          )}
          
          {/* Dynamic content based on route */}
          <div className={(currentPath.includes('/judges') || currentPath.includes('/schedules')) && !isMobile ? '' : 'mt-6'}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};