import React from 'react';
import { CompetitionsTab } from './tabs/CompetitionsTab';
import { useMyCompetitionsPermissions } from '@/hooks/useModuleSpecificPermissions';

const MyCompetitionsPage = () => {
  const { canAccess: canAccessMyCompetitions } = useMyCompetitionsPermissions();

  if (!canAccessMyCompetitions) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">You don't have permission to access My Competitions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Competitions</h1>
        <p className="text-muted-foreground">Track your competitions, score sheets, and performance</p>
      </div>

      <CompetitionsTab />
    </div>
  );
};

export default MyCompetitionsPage;