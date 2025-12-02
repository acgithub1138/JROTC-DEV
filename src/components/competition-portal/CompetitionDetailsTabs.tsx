import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, FileText, School, Calendar, Award } from 'lucide-react';

interface CompetitionDetailsTabsProps {
  competitionId: string;
  permissions: {
    events: { canAccess: boolean };
    judges: { canAccess: boolean };
    resources: { canAccess: boolean };
    schools: { canAccess: boolean };
    schedule: { canAccess: boolean };
    results: { canAccess: boolean };
  };
}

export const CompetitionDetailsTabs = ({ competitionId, permissions }: CompetitionDetailsTabsProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const tabs = [
    {
      id: 'events',
      label: 'Events',
      icon: Trophy,
      path: '/events',
      canAccess: permissions.events.canAccess,
    },
    {
      id: 'judges',
      label: 'Judges',
      icon: Users,
      path: '/judges/assigned',
      canAccess: permissions.judges.canAccess,
    },
    {
      id: 'resources',
      label: 'Resources',
      icon: FileText,
      path: '/resources',
      canAccess: permissions.resources.canAccess,
    },
    {
      id: 'schools',
      label: 'Schools',
      icon: School,
      path: '/schools',
      canAccess: permissions.schools.canAccess,
    },
    {
      id: 'schedules',
      label: 'Schedules',
      icon: Calendar,
      path: '/schedules/schools',
      canAccess: permissions.schedule.canAccess,
    },
    {
      id: 'results',
      label: 'Results',
      icon: Award,
      path: '/results',
      canAccess: permissions.results.canAccess,
    },
  ].filter(tab => tab.canAccess);

  const getActiveTab = () => {
    const basePath = `/app/competition-portal/competition-details/${competitionId}`;
    if (currentPath.includes('/events')) return 'events';
    if (currentPath.includes('/judges')) return 'judges';
    if (currentPath.includes('/resources')) return 'resources';
    if (currentPath.includes('/schools')) return 'schools';
    if (currentPath.includes('/schedules')) return 'schedules';
    if (currentPath.includes('/results')) return 'results';
    return tabs[0]?.id || '';
  };

  const handleTabChange = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      navigate(`/app/competition-portal/competition-details/${competitionId}${tab.path}`);
    }
  };

  return (
    <Tabs value={getActiveTab()} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full justify-start h-auto p-1 bg-muted/50">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
