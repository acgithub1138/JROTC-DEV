import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SchedulesSubTabsProps {
  competitionId: string;
}

export const SchedulesSubTabs = ({ competitionId }: SchedulesSubTabsProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const basePath = `/app/competition-portal/competition-details/${competitionId}`;

  const getActiveTab = () => {
    if (currentPath.includes('/schedules/judges')) return 'judges';
    if (currentPath.includes('/schedules/resources')) return 'resources';
    return 'schools';
  };

  const handleTabChange = (value: string) => {
    switch (value) {
      case 'schools':
        navigate(`${basePath}/schedules/schools`);
        break;
      case 'judges':
        navigate(`${basePath}/schedules/judges`);
        break;
      case 'resources':
        navigate(`${basePath}/schedules/resources`);
        break;
    }
  };

  return (
    <Tabs value={getActiveTab()} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="schools">Schools</TabsTrigger>
        <TabsTrigger value="judges">Judges</TabsTrigger>
        <TabsTrigger value="resources">Resources</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
