import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompetitionJudgesPermissions } from '@/hooks/useModuleSpecificPermissions';

interface JudgesSubTabsProps {
  competitionId: string;
}

export const JudgesSubTabs = ({ competitionId }: JudgesSubTabsProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canUpdate } = useCompetitionJudgesPermissions();
  const currentPath = location.pathname;
  const basePath = `/app/competition-portal/competition-details/${competitionId}`;

  const getActiveTab = () => {
    if (currentPath.includes('/judges/applications/pending')) return 'pending';
    if (currentPath.includes('/judges/applications/approved')) return 'approved';
    if (currentPath.includes('/judges/applications/declined')) return 'declined';
    return 'assigned';
  };

  const handleTabChange = (value: string) => {
    switch (value) {
      case 'assigned':
        navigate(`${basePath}/judges/assigned`);
        break;
      case 'pending':
        navigate(`${basePath}/judges/applications/pending`);
        break;
      case 'approved':
        navigate(`${basePath}/judges/applications/approved`);
        break;
      case 'declined':
        navigate(`${basePath}/judges/applications/declined`);
        break;
    }
  };

  return (
    <Tabs value={getActiveTab()} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="assigned">Assigned</TabsTrigger>
        {canUpdate && (
          <>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="declined">Declined</TabsTrigger>
          </>
        )}
      </TabsList>
    </Tabs>
  );
};
