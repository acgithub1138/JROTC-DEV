import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface TeamsPageHeaderProps {
  onAddTeam: () => void;
  canCreate: boolean;
}

export const TeamsPageHeader = ({ onAddTeam, canCreate }: TeamsPageHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Teams Management</h1>
        <p className="text-gray-600 mt-2">
          Manage your teams, assign team leads, and organize team members.
        </p>
      </div>
      
      {canCreate && (
        <Button onClick={onAddTeam} className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          Add Team
        </Button>
      )}
    </div>
  );
};